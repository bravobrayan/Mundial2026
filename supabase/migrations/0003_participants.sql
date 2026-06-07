-- ============================================================
--  Quiniela Mundial 2026 — Lista de participantes (solo admin)
--  Ejecutar en Supabase → SQL Editor (después de 0002).
-- ============================================================

-- Resumen por jugador: cuántos pronósticos lleva, sin exponer marcadores.
-- Admin-only: lanza excepción si quien llama no es administrador.
create or replace function public.participants()
returns table (
  user_id uuid,
  display_name text,
  group_preds int,    -- partidos de grupos pronosticados (0..72)
  groups_done int,    -- grupos completos (0..12)
  ko_preds int,       -- partidos de eliminatorias pronosticados
  total_preds int,    -- total de pronósticos con marcador
  last_pred timestamptz,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  with pc as (
    select
      p.user_id,
      count(*) filter (
        where m.stage = 'group' and p.home_goals is not null and p.away_goals is not null
      ) as gpreds,
      count(*) filter (
        where m.stage <> 'group' and p.home_goals is not null and p.away_goals is not null
      ) as kopreds,
      count(*) filter (
        where p.home_goals is not null and p.away_goals is not null
      ) as total,
      max(p.updated_at) as last_pred
    from public.predictions p
    join public.matches m on m.id = p.match_id
    group by p.user_id
  ),
  gd as (
    select s.user_id, count(*) as groups_done
    from (
      select p2.user_id, m2.grp,
        count(*) filter (
          where p2.home_goals is not null and p2.away_goals is not null
        ) as c
      from public.predictions p2
      join public.matches m2 on m2.id = p2.match_id
      where m2.stage = 'group'
      group by p2.user_id, m2.grp
    ) s
    where s.c = 6
    group by s.user_id
  )
  select
    pr.id,
    pr.display_name,
    coalesce(pc.gpreds, 0)::int,
    coalesce(gd.groups_done, 0)::int,
    coalesce(pc.kopreds, 0)::int,
    coalesce(pc.total, 0)::int,
    pc.last_pred,
    pr.created_at
  from public.profiles pr
  left join pc on pc.user_id = pr.id
  left join gd on gd.user_id = pr.id
  order by coalesce(pc.total, 0) desc, pr.display_name asc;
end;
$$;

grant execute on function public.participants() to authenticated;
