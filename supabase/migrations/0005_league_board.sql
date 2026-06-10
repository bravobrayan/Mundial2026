-- ============================================================
--  Quiniela Mundial 2026 — Pronósticos de la liga por partido
--  Revela el pronóstico de cada miembro SOLO cuando el partido
--  ya empezó (o si es el propio). Incluye puntos si ya hay resultado.
--  Ejecutar en Supabase → SQL Editor (después de 0004). Es aditiva.
-- ============================================================

create or replace function public.league_board(p_league uuid)
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
    end,
    x.rv
  from public.predictions p
  join public.profiles pr on pr.id = p.user_id
  join public.matches m on m.id = p.match_id
  left join public.results r on r.match_id = p.match_id
  cross join lateral (
    select (now() >= m.kickoff or p.user_id = auth.uid()) as rv
  ) x
  where p.league_id = p_league
    and p.home_goals is not null
    and p.away_goals is not null;
end;
$$;

grant execute on function public.league_board(uuid) to authenticated;
