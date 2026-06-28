-- ============================================================
--  Quiniela Mundial 2026 — Mostrar quién pasa por penales
--  league_board ahora devuelve también la selección de penales del
--  pronóstico (advance_team_id + nombre/bandera), revelada igual que
--  el marcador. Ejecutar tras 0012. Aditiva (cambia el tipo de retorno).
-- ============================================================

drop function if exists public.league_board(uuid, int[]);

create or replace function public.league_board(
  p_league uuid,
  p_matches int[] default null
)
returns table (
  match_id        int,
  user_id         uuid,
  display_name    text,
  home_goals      int,
  away_goals      int,
  points          int,
  revealed        boolean,
  advance_team_id int,
  advance_name    text,
  advance_flag    text
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
    x.rv,
    case when x.rv then p.advance_team_id end,
    case when x.rv then at.name end,
    case when x.rv then at.flag end
  from public.predictions p
  join public.profiles pr on pr.id = p.user_id
  join public.matches m on m.id = p.match_id
  left join public.results r on r.match_id = p.match_id
  left join public.teams at on at.id = p.advance_team_id
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
