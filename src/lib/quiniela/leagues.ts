import type { SupabaseClient } from "@supabase/supabase-js";

export type LeagueType = "grupos" | "eliminatorias";

export type League = {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  league_type: LeagueType;
  members: number;
  created_at: string;
};

/** Liga a la que el usuario pertenece, o null si no es miembro. */
export async function getMembership(
  supabase: SupabaseClient,
  userId: string,
  leagueId: string,
): Promise<{
  id: string;
  name: string;
  code: string;
  owner_id: string;
  league_type: LeagueType;
} | null> {
  const { data } = await supabase
    .from("league_members")
    .select("league:league_id(id, name, code, owner_id, league_type)")
    .eq("user_id", userId)
    .eq("league_id", leagueId)
    .maybeSingle();
  // @ts-expect-error embedded relation
  return data?.league ?? null;
}
