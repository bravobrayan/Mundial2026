"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdminResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, ok: Boolean(data?.is_admin) };
}

/** Guardar (o borrar) el resultado real de un partido. */
export async function saveResult(input: {
  matchId: number;
  home: number | null;
  away: number | null;
}): Promise<AdminResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  if (input.home == null || input.away == null) {
    const { error } = await supabase
      .from("results")
      .delete()
      .eq("match_id", input.matchId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("results").upsert(
      {
        match_id: input.matchId,
        home_goals: Math.max(0, Math.min(99, input.home)),
        away_goals: Math.max(0, Math.min(99, input.away)),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    );
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin");
  revalidatePath("/jugar/ranking");
  return { ok: true };
}

/** Definir los equipos reales de un partido de eliminatorias. */
export async function setMatchTeams(input: {
  matchId: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
}): Promise<AdminResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  const { error } = await supabase
    .from("matches")
    .update({
      home_team_id: input.homeTeamId,
      away_team_id: input.awayTeamId,
    })
    .eq("id", input.matchId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/jugar/cuadro");
  return { ok: true };
}
