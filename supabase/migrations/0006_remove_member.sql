-- ============================================================
--  Quiniela Mundial 2026 — Expulsar miembro de una liga
--  Solo el DUEÑO de la liga puede expulsar. Borra también sus
--  pronósticos/posiciones en esa liga. Ejecutar tras 0005. Aditiva.
-- ============================================================

create or replace function public.remove_member(p_league uuid, p_user uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.leagues
    where id = p_league and owner_id = auth.uid()
  ) then
    raise exception 'Solo el dueño de la liga puede expulsar miembros';
  end if;

  if p_user = auth.uid() then
    raise exception 'No puedes expulsarte a ti mismo';
  end if;

  delete from public.predictions     where league_id = p_league and user_id = p_user;
  delete from public.group_positions where league_id = p_league and user_id = p_user;
  delete from public.league_members  where league_id = p_league and user_id = p_user;
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;
