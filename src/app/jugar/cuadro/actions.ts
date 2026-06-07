"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMatchLocked } from "@/lib/quiniela/lock";

export type SaveResult = { ok: true } | { ok: false; error: string };

type IncomingPred = { matchId: number; home: number | null; away: number | null };

/** Guarda pronósticos de marcador (eliminatorias). Bloqueo por partido. */
export async function saveKnockout(input: {
  predictions: IncomingPred[];
}): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };

  const matchIds = input.predictions.map((p) => p.matchId);
  if (matchIds.length === 0) return { ok: true };

  const { data: kickoffs } = await supabase
    .from("matches")
    .select("id, kickoff")
    .in("id", matchIds);
  const open = new Set(
    (kickoffs ?? []).filter((m) => !isMatchLocked(m.kickoff)).map((m) => m.id),
  );

  const clean = (n: number | null) =>
    n == null || Number.isNaN(n) ? null : Math.max(0, Math.min(99, n));

  const rows = input.predictions
    .filter((p) => open.has(p.matchId))
    .map((p) => ({
      user_id: user.id,
      match_id: p.matchId,
      home_goals: clean(p.home),
      away_goals: clean(p.away),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("predictions")
      .upsert(rows, { onConflict: "user_id,match_id" });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/jugar/cuadro");
  return { ok: true };
}
