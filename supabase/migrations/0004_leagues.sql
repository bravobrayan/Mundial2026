-- ============================================================
--  Quiniela Mundial 2026 — Ligas privadas (multi-liga)
--  Cada liga tiene su ranking aislado. Predicciones POR LIGA.
--  Resultados reales = globales (un solo Mundial).
--  Ejecutar en Supabase → SQL Editor (después de 0003).
-- ============================================================

-- ---------- Tablas ----------
create table if not exists public.leagues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  code       text not null unique,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index if not exists league_members_user_idx on public.league_members(user_id);

-- ---------- Predicciones y posiciones: ahora POR LIGA ----------
alter table public.predictions
  add column if not exists league_id uuid references public.leagues(id) on delete cascade;
alter table public.group_positions
  add column if not exists league_id uuid references public.leagues(id) on delete cascade;

-- Limpia datos de prueba previos al modelo de ligas (no tenían liga).
delete from public.predictions where league_id is null;
delete from public.group_positions where league_id is null;

alter table public.predictions     alter column league_id set not null;
alter table public.group_positions alter column league_id set not null;

-- Restricciones de unicidad por liga
alter table public.predictions drop constraint if exists predictions_user_id_match_id_key;
alter table public.predictions add constraint predictions_user_league_match_key
  unique (user_id, league_id, match_id);

alter table public.group_positions drop constraint if exists group_positions_pkey;
alter table public.group_positions drop constraint if exists group_positions_user_id_grp_position_key;
alter table public.group_positions add primary key (user_id, league_id, grp, team_id);
alter table public.group_positions add constraint group_positions_user_league_grp_pos_key
  unique (user_id, league_id, grp, position);

-- ---------- Helper: ¿el usuario es miembro de la liga? ----------
create or replace function public.is_member(l uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = l and user_id = auth.uid()
  );
$$;

-- ============================================================
--  Row Level Security
-- ============================================================
alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;

-- Ligas: las ves si eres miembro (o dueño)
drop policy if exists "read my leagues" on public.leagues;
create policy "read my leagues" on public.leagues for select
  using (public.is_member(id) or owner_id = auth.uid());

-- Miembros: ves a los de tus ligas
drop policy if exists "read members" on public.league_members;
create policy "read members" on public.league_members for select
  using (public.is_member(league_id));
drop policy if exists "leave league" on public.league_members;
create policy "leave league" on public.league_members for delete
  using (user_id = auth.uid());

-- (Crear/unirse se hace por RPC SECURITY DEFINER de abajo.)

-- ============================================================
--  RPCs: crear y unirse a liga
-- ============================================================

create or replace function public.create_league(p_name text)
returns public.leagues
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_league public.leagues;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear ligas';
  end if;
  if length(coalesce(trim(p_name), '')) < 2 then
    raise exception 'El nombre de la liga es muy corto';
  end if;

  -- código único de 6 caracteres
  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.leagues where code = v_code);
  end loop;

  insert into public.leagues (name, code, owner_id)
  values (trim(p_name), v_code, auth.uid())
  returning * into v_league;

  insert into public.league_members (league_id, user_id)
  values (v_league.id, auth.uid());

  return v_league;
end;
$$;

create or replace function public.join_league(p_code text)
returns public.leagues
language plpgsql security definer set search_path = public
as $$
declare
  v_league public.leagues;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;

  select * into v_league from public.leagues
  where code = upper(trim(p_code));

  if v_league.id is null then
    raise exception 'No existe una liga con ese código';
  end if;

  insert into public.league_members (league_id, user_id)
  values (v_league.id, auth.uid())
  on conflict (league_id, user_id) do nothing;

  return v_league;
end;
$$;

grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;

-- ============================================================
--  Mis ligas (con conteo de miembros) y ranking por liga
-- ============================================================

create or replace function public.my_leagues()
returns table (
  id uuid,
  name text,
  code text,
  owner_id uuid,
  members int,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select l.id, l.name, l.code, l.owner_id,
    (select count(*)::int from public.league_members m where m.league_id = l.id) as members,
    l.created_at
  from public.leagues l
  where exists (
    select 1 from public.league_members me
    where me.league_id = l.id and me.user_id = auth.uid()
  )
  order by l.created_at desc;
$$;

grant execute on function public.my_leagues() to authenticated;

-- Ranking de una liga (solo sus miembros). Solo accesible a miembros.
create or replace function public.league_leaderboard(p_league uuid)
returns table (
  user_id uuid,
  display_name text,
  points int,
  exactos int,
  partidos int
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_member(p_league) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    pr.id,
    pr.display_name,
    coalesce(sum(public.score_prediction(p.home_goals, p.away_goals, r.home_goals, r.away_goals)), 0)::int,
    coalesce(sum(((p.home_goals = r.home_goals) and (p.away_goals = r.away_goals))::int), 0)::int,
    count(r.match_id)::int
  from public.league_members lm
  join public.profiles pr on pr.id = lm.user_id
  left join public.predictions p on p.user_id = lm.user_id and p.league_id = p_league
    and p.home_goals is not null and p.away_goals is not null
  left join public.results r on r.match_id = p.match_id
  where lm.league_id = p_league
  group by pr.id, pr.display_name
  order by 3 desc, 4 desc, pr.display_name asc;
end;
$$;

grant execute on function public.league_leaderboard(uuid) to authenticated;
