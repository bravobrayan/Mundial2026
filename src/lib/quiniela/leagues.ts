import type { SupabaseClient } from "@supabase/supabase-js";

export type League = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  members: number;
  created_at: string;
};

/** Liga a la que el usuario pertenece, o null si no es miembro. */
export async function getMembership(
  supabase: SupabaseClient,
  userId: string,
  leagueId: string,
): Promise<{ id: string; name: string; code: string; owner_id: string } | null> {
  const { data } = await supabase
    .from("league_members")
    .select("league:league_id(id, name, code, owner_id)")
    .eq("user_id", userId)
    .eq("league_id", leagueId)
    .maybeSingle();
  // @ts-expect-error embedded relation
  return data?.league ?? null;
}
