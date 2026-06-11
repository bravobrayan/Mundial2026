-- ============================================================
--  Quiniela Mundial 2026 — Progreso de llenado por miembro
--  SOLO el dueño de la liga puede verlo. Cuenta partidos de grupos
--  pronosticados por cada miembro (de 72). Ejecutar tras 0006. Aditiva.
-- ============================================================

create or replace function public.league_progress(p_league uuid)
returns table (
  user_id uuid,
  display_name text,
  group_filled int
)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.leagues
    where id = p_league and owner_id = auth.uid()
  ) then
    raise exception 'No autorizado';
  end if;

  return query
  select
    pr.id,
    pr.display_name,
    count(*) filter (
      where m.stage = 'group'
        and p.home_goals is not null
        and p.away_goals is not null
    )::int as group_filled
  from public.league_members lm
  join public.profiles pr on pr.id = lm.user_id
  left join public.predictions p
    on p.user_id = lm.user_id and p.league_id = p_league
  left join public.matches m on m.id = p.match_id
  where lm.league_id = p_league
  group by pr.id, pr.display_name
  order by 3 asc, pr.display_name asc; -- los que menos llevan, primero
end;
$$;

grant execute on function public.league_progress(uuid) to authenticated;
