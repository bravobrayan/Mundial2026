"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function expelMember(
  leagueId: string,
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", {
    p_league: leagueId,
    p_user: userId,
  });
  if (error) return { error: error.message };
  revalidatePath(`/liga/${leagueId}/ranking`);
  revalidatePath(`/liga/${leagueId}`);
  return { ok: true };
}
