"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMatchLocked } from "@/lib/quiniela/lock";

export type SaveResult = { ok: true } | { ok: false; error: string };

type IncomingPred = { matchId: number; home: number | null; away: number | null };

export async function saveGroup(input: {
  grupo: string;
  matchIds: number[];
  predictions: IncomingPred[];
  order: number[]; // teamIds, posición 1..4
}): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };

  // Bloqueo por partido: no se aceptan cambios de partidos ya iniciados.
  const { data: kickoffs } = await supabase
    .from("matches")
    .select("id, kickoff")
    .in("id", input.matchIds);
  const open = new Set(
    (kickoffs ?? [])
      .filter((m) => !isMatchLocked(m.kickoff))
      .map((m) => m.id),
  );

  // Validar marcadores
  const rows = input.predictions
    .filter((p) => input.matchIds.includes(p.matchId) && open.has(p.matchId))
    .map((p) => {
      const clean = (n: number | null) =>
        n == null || Number.isNaN(n) ? null : Math.max(0, Math.min(99, n));
      return {
        user_id: user.id,
        match_id: p.matchId,
        home_goals: clean(p.home),
        away_goals: clean(p.away),
        updated_at: new Date().toISOString(),
      };
    });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("predictions")
      .upsert(rows, { onConflict: "user_id,match_id" });
    if (error) return { ok: false, error: error.message };
  }

  // Guardar orden manual del grupo (posiciones 1..4)
  if (input.order.length > 0) {
    await supabase
      .from("group_positions")
      .delete()
      .eq("user_id", user.id)
      .eq("grp", input.grupo);

    const posRows = input.order.map((teamId, i) => ({
      user_id: user.id,
      grp: input.grupo,
      team_id: teamId,
      position: i + 1,
    }));
    const { error } = await supabase.from("group_positions").insert(posRows);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/jugar/grupos/${input.grupo}`);
  return { ok: true };
}
