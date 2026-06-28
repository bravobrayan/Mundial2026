"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WINNER_TO, LOSER_TO } from "@/lib/quiniela/bracket";

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
  finished?: boolean;
  /** Eliminatorias: equipo que avanzó por penales (solo si el marcador es empate). */
  advanceTeamId?: number | null;
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
    const home = Math.max(0, Math.min(99, input.home));
    const away = Math.max(0, Math.min(99, input.away));
    // El que avanza por penales solo aplica si el marcador es empate.
    const advance = home === away ? (input.advanceTeamId ?? null) : null;
    const { error } = await supabase.from("results").upsert(
      {
        match_id: input.matchId,
        home_goals: home,
        away_goals: away,
        advance_team_id: advance,
        finished: input.finished ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    );
    if (error) return { ok: false, error: error.message };

    // Bracket dinámico: al terminar un partido de eliminatoria, el ganador
    // (y en semis el perdedor) pasa solo a la ronda siguiente.
    if (input.finished) {
      await advanceWinner(supabase, input.matchId, home, away, advance);
    }
  }
  revalidatePath("/admin");
  revalidatePath("/jugar/ranking");
  return { ok: true };
}

/**
 * Coloca al ganador (y en semis al perdedor) del partido en el slot que le
 * corresponde de la ronda siguiente, según el mapa fijo del cuadro.
 * No hace nada para partidos de grupo o si no hay ganador determinable.
 */
async function advanceWinner(
  supabase: SupabaseClient,
  matchId: number,
  home: number,
  away: number,
  advanceTeamId: number | null,
) {
  const winTo = WINNER_TO[matchId];
  const loseTo = LOSER_TO[matchId];
  if (!winTo && !loseTo) return; // p.ej. la final (104) no avanza a nada

  const { data: m } = await supabase
    .from("matches")
    .select("stage, home_team_id, away_team_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!m || m.stage === "group") return;
  if (m.home_team_id == null || m.away_team_id == null) return;

  let winnerId: number | null;
  let loserId: number | null;
  if (home > away) {
    winnerId = m.home_team_id;
    loserId = m.away_team_id;
  } else if (away > home) {
    winnerId = m.away_team_id;
    loserId = m.home_team_id;
  } else {
    // Empate → decide el de penales (advance_team_id).
    if (advanceTeamId == null) return; // sin definir aún quién pasó
    winnerId = advanceTeamId;
    loserId =
      advanceTeamId === m.home_team_id ? m.away_team_id : m.home_team_id;
  }

  if (winTo && winnerId != null) {
    await supabase
      .from("matches")
      .update({ [`${winTo.slot}_team_id`]: winnerId })
      .eq("id", winTo.match);
  }
  if (loseTo && loserId != null) {
    await supabase
      .from("matches")
      .update({ [`${loseTo.slot}_team_id`]: loserId })
      .eq("id", loseTo.match);
  }
}

/** Definir qué rondas de eliminatorias están abiertas para predicción (global). */
export async function setKnockoutRounds(stages: string[]): Promise<AdminResult> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) return { ok: false, error: "No autorizado." };

  const valid = ["r32", "r16", "qf", "sf", "third", "final"];
  const value = stages.filter((s) => valid.includes(s)).join(",");
  const { error } = await supabase.rpc("set_knockout_rounds", {
    p_value: value,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
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
