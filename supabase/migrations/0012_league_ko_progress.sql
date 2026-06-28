-- ============================================================
--  Quiniela Mundial 2026 — Progreso de llenado en ELIMINATORIAS
--  Dueño (o admin) ve cuántos de los partidos ABIERTOS y con cruce
--  definido ha pronosticado cada miembro. Ejecutar tras 0011. Aditiva.
-- ============================================================

create or replace function public.league_ko_progress(p_league uuid)
returns table (
  user_id uuid,
  display_name text,
  filled int,
  total int
)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_open  text;
  v_total int;
begin
  -- Solo el dueño de la liga o un admin.
  if not exists (
    select 1 from public.leagues where id = p_league and owner_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  v_open := coalesce(
    (select value from public.settings where key = 'ko_open_rounds'), ''
  );

  -- Partidos "disponibles": ronda abierta + cruce ya definido.
  v_total := (
    select count(*) from public.matches m
    where m.stage <> 'group'
      and m.home_team_id is not null
      and m.away_team_id is not null
      and m.stage = any (string_to_array(v_open, ','))
  );

  return query
  select
    pr.id,
    pr.display_name,
    count(*) filter (
      where m.id is not null
        and p.home_goals is not null
        and p.away_goals is not null
    )::int as filled,
    v_total as total
  from public.league_members lm
  join public.profiles pr on pr.id = lm.user_id
  left join public.predictions p
    on p.user_id = lm.user_id and p.league_id = p_league
  left join public.matches m
    on m.id = p.match_id
    and m.stage <> 'group'
    and m.home_team_id is not null
    and m.away_team_id is not null
    and m.stage = any (string_to_array(v_open, ','))
  where lm.league_id = p_league
  group by pr.id, pr.display_name
  order by 3 asc, pr.display_name asc; -- los que menos llevan, primero
end;
$$;

grant execute on function public.league_ko_progress(uuid) to authenticated;
