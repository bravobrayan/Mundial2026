-- ============================================================
--  Quiniela Mundial 2026 — Puntuación, ranking y rol admin
--  Ejecutar en Supabase → SQL Editor (después de 0001 y seed).
-- ============================================================

-- ---------- Rol admin ----------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------- Puntuación de un pronóstico (5 / 3 / 1 / 0) ----------
-- 5 = marcador exacto · 3 = signo correcto · 1 = goles de un equipo · 0 = nada
create or replace function public.score_prediction(ph int, pa int, rh int, ra int)
returns int
language sql immutable
as $$
  select case
    when ph is null or pa is null or rh is null or ra is null then 0
    when ph = rh and pa = ra then 5
    when sign(ph - pa) = sign(rh - ra) then 3
    when ph = rh or pa = ra then 1
    else 0
  end;
$$;

-- ---------- Tabla general (ranking en vivo) ----------
-- SECURITY DEFINER: agrega puntos de TODOS sin exponer pronósticos ajenos.
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
    coalesce(sum(public.score_prediction(p.home_goals, p.away_goals, r.home_goals, r.away_goals)), 0)::int as points,
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

-- ---------- Permisos de escritura para admins ----------
-- Resultados reales: solo admins
drop policy if exists "admin insert results" on public.results;
drop policy if exists "admin update results" on public.results;
drop policy if exists "admin delete results" on public.results;
create policy "admin insert results" on public.results for insert with check (public.is_admin());
create policy "admin update results" on public.results for update using (public.is_admin());
create policy "admin delete results" on public.results for delete using (public.is_admin());

-- Partidos: admins pueden actualizar (definir equipos de eliminatorias)
drop policy if exists "admin update matches" on public.matches;
create policy "admin update matches" on public.matches for update using (public.is_admin());
