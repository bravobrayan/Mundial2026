-- ============================================================
--  Quiniela Mundial 2026 — Fase de eliminatorias
--  · Liga "tipo eliminatorias" (league_type) — UX por fase
--  · Bonus +3 por acertar quién pasa por penales (empate predicho)
--  · Apertura del cuadro ronda por ronda (controlado por admin)
--  100% ADITIVO: no borra nada. Ejecutar en Supabase → SQL Editor.
-- ============================================================

-- ---------- Tipo de liga (grupos | eliminatorias) ----------
-- Las ligas existentes quedan automáticamente como 'grupos'.
alter table public.leagues
  add column if not exists league_type text not null default 'grupos'
  check (league_type in ('grupos', 'eliminatorias'));

-- ---------- Bonus de penales (+3) ----------
-- +3 si el usuario predijo empate, el partido real fue empate (fue a penales)
-- y acertó qué selección avanzó. Inmutable, espejo de score_prediction.
create or replace function public.penalty_bonus(
  ph int, pa int, p_adv int, rh int, ra int, r_adv int
)
returns int
language sql immutable
as $$
  select case
    when ph is null or pa is null or rh is null or ra is null then 0
    when ph = pa and rh = ra and p_adv is not null and p_adv = r_adv then 3
    else 0
  end;
$$;

-- ---------- Tabla general (incluye el bonus de penales) ----------
create or replace function public.leaderboard()
returns table (
  user_id uuid,
  display_name text,
  points int,
  exactos int,
  partidos int
)
language sql stable security definer set search_path = public
as $$
  select
    pr.id as user_id,
    pr.display_name,
    coalesce(sum(
      public.score_prediction(p.home_goals, p.away_goals, r.home_goals, r.away_goals)
      + public.penalty_bonus(p.home_goals, p.away_goals, p.advance_team_id,
                             r.home_goals, r.away_goals, r.advance_team_id)
    ), 0)::int as points,
    coalesce(sum(((p.home_goals = r.home_goals) and (p.away_goals = r.away_goals))::int), 0)::int as exactos,
    count(r.match_id)::int as partidos
  from public.profiles pr
  left join public.predictions p on p.user_id = pr.id
    and p.home_goals is not null and p.away_goals is not null
  left join public.results r on r.match_id = p.match_id
  group by pr.id, pr.display_name
  order by points desc, exactos desc, pr.display_name asc;
$$;

grant execute on function public.leaderboard() to anon, authenticated;

-- ---------- Ranking por liga (incluye el bonus de penales) ----------
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
    coalesce(sum(
      public.score_prediction(p.home_goals, p.away_goals, r.home_goals, r.away_goals)
      + public.penalty_bonus(p.home_goals, p.away_goals, p.advance_team_id,
                             r.home_goals, r.away_goals, r.advance_team_id)
    ), 0)::int,
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

-- ---------- Crear liga con tipo (admin) ----------
-- Quita la versión vieja de 1 argumento (la firma cambió a 2 args).
drop function if exists public.create_league(text);
create or replace function public.create_league(p_name text, p_type text default 'grupos')
returns public.leagues
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_league public.leagues;
  v_type text := coalesce(p_type, 'grupos');
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not public.is_admin() then
    raise exception 'Solo un administrador puede crear ligas';
  end if;
  if length(coalesce(trim(p_name), '')) < 2 then
    raise exception 'El nombre de la liga es muy corto';
  end if;
  if v_type not in ('grupos', 'eliminatorias') then
    raise exception 'Tipo de liga inválido';
  end if;

  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.leagues where code = v_code);
  end loop;

  insert into public.leagues (name, code, owner_id, league_type)
  values (trim(p_name), v_code, auth.uid(), v_type)
  returning * into v_league;

  insert into public.league_members (league_id, user_id)
  values (v_league.id, auth.uid());

  return v_league;
end;
$$;

grant execute on function public.create_league(text, text) to authenticated;

-- ---------- my_leagues con league_type ----------
-- Cambió el tipo de retorno (nueva columna league_type) => hay que dropear primero.
drop function if exists public.my_leagues();
create or replace function public.my_leagues()
returns table (
  id uuid,
  name text,
  code text,
  owner_id uuid,
  league_type text,
  members int,
  created_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  select l.id, l.name, l.code, l.owner_id, l.league_type,
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

-- ---------- Convertir una liga (grupos <-> eliminatorias), solo admin ----------
-- Conserva el mismo league_id => los puntos y predicciones se mantienen.
create or replace function public.set_league_type(p_league uuid, p_type text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador';
  end if;
  if p_type not in ('grupos', 'eliminatorias') then
    raise exception 'Tipo de liga inválido';
  end if;
  update public.leagues set league_type = p_type where id = p_league;
end;
$$;

grant execute on function public.set_league_type(uuid, text) to authenticated;

-- ============================================================
--  Apertura del cuadro ronda por ronda (GLOBAL, vía settings)
--  value = lista separada por comas, p.ej. 'r32,r16'
-- ============================================================

create or replace function public.get_knockout_rounds()
returns text
language sql stable security definer set search_path = public
as $$
  select coalesce((select value from public.settings where key = 'ko_open_rounds'), '');
$$;

create or replace function public.set_knockout_rounds(p_value text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador';
  end if;
  insert into public.settings (key, value)
  values ('ko_open_rounds', coalesce(p_value, ''))
  on conflict (key) do update set value = excluded.value;
end;
$$;

grant execute on function public.get_knockout_rounds() to anon, authenticated;
grant execute on function public.set_knockout_rounds(text) to authenticated;

-- ---------- Tablero por liga: puntos por partido + bonus de penales ----------
-- Misma lógica de revelado que 0010, pero el puntaje incluye el bonus.
create or replace function public.league_board(
  p_league uuid,
  p_matches int[] default null
)
returns table (
  match_id     int,
  user_id      uuid,
  display_name text,
  home_goals   int,
  away_goals   int,
  points       int,
  revealed     boolean
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_member(p_league) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    p.match_id,
    pr.id,
    pr.display_name,
    case when x.rv then p.home_goals end,
    case when x.rv then p.away_goals end,
    case
      when x.rv and r.match_id is not null
      then public.score_prediction(p.home_goals, p.away_goals, r.home_goals, r.away_goals)
         + public.penalty_bonus(p.home_goals, p.away_goals, p.advance_team_id,
                                r.home_goals, r.away_goals, r.advance_team_id)
    end,
    x.rv
  from public.predictions p
  join public.profiles pr on pr.id = p.user_id
  join public.matches m on m.id = p.match_id
  left join public.results r on r.match_id = p.match_id
  cross join lateral (
    select (
      now() >= m.kickoff
      or p.user_id = auth.uid()
      or (m.stage = 'group' and now() >= timestamptz '2026-06-11 19:00:00+00')
    ) as rv
  ) x
  where p.league_id = p_league
    and (p_matches is null or p.match_id = any(p_matches))
    and p.home_goals is not null
    and p.away_goals is not null;
end;
$$;

grant execute on function public.league_board(uuid, int[]) to authenticated;
