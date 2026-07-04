"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMatchLocked, isGroupLocked } from "@/lib/quiniela/lock";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SaveResult = { ok: true } | { ok: false; error: string };

type IncomingPred = {
  matchId: number;
  home: number | null;
  away: number | null;
  advance?: number | null;
};

async function isMember(
  supabase: SupabaseClient,
  userId: string,
  leagueId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId)
    .eq("league_id", leagueId)
    .maybeSingle();
  return Boolean(data);
}

const clean = (n: number | null) =>
  n == null || Number.isNaN(n) ? null : Math.max(0, Math.min(99, n));

/** Guarda los pronósticos de un grupo en una liga. Cierre GLOBAL al 1er partido. */
export async function saveGroup(input: {
  leagueId: string;
  grupo: string;
  matchIds: number[];
  predictions: IncomingPred[];
  order: number[];
}): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };
  if (!(await isMember(supabase, user.id, input.leagueId)))
    return { ok: false, error: "No perteneces a esta liga." };
  if (isGroupLocked())
    return {
      ok: false,
      error: "La fase de grupos ya está cerrada (comenzó el Mundial).",
    };

  // Bloqueo POR PARTIDO: no se aceptan cambios de partidos ya iniciados.
  const { data: kickoffs } = await supabase
    .from("matches")
    .select("id, kickoff")
    .in("id", input.matchIds);
  const open = new Set(
    (kickoffs ?? []).filter((m) => !isMatchLocked(m.kickoff)).map((m) => m.id),
  );

  const rows = input.predictions
    .filter((p) => input.matchIds.includes(p.matchId) && open.has(p.matchId))
    .map((p) => ({
      user_id: user.id,
      league_id: input.leagueId,
      match_id: p.matchId,
      home_goals: clean(p.home),
      away_goals: clean(p.away),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("predictions")
      .upsert(rows, { onConflict: "user_id,league_id,match_id" });
    if (error) return { ok: false, error: error.message };
  }

  if (input.order.length > 0) {
    await supabase
      .from("group_positions")
      .delete()
      .eq("user_id", user.id)
      .eq("league_id", input.leagueId)
      .eq("grp", input.grupo);
    const posRows = input.order.map((teamId, i) => ({
      user_id: user.id,
      league_id: input.leagueId,
      grp: input.grupo,
      team_id: teamId,
      position: i + 1,
    }));
    const { error } = await supabase.from("group_positions").insert(posRows);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/liga/${input.leagueId}/grupos/${input.grupo}`);
  return { ok: true };
}

/** Guarda los pronósticos de eliminatorias en una liga. */
export async function saveKnockout(input: {
  leagueId: string;
  predictions: IncomingPred[];
}): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };
  if (!(await isMember(supabase, user.id, input.leagueId)))
    return { ok: false, error: "No perteneces a esta liga." };

  const matchIds = input.predictions.map((p) => p.matchId);
  if (matchIds.length === 0) return { ok: true };

  // Rondas habilitadas por el admin (global).
  const { data: openRoundsStr } = await supabase.rpc("get_knockout_rounds");
  const openRounds = new Set(
    String(openRoundsStr ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const { data: matchData } = await supabase
    .from("matches")
    .select("id, kickoff, stage, home_team_id, away_team_id")
    .in("id", matchIds);
  const byId = new Map((matchData ?? []).map((m) => [m.id, m]));

  // Aceptamos solo: ronda abierta + no iniciado + con cruce definido.
  const open = new Set(
    (matchData ?? [])
      .filter(
        (m) =>
          openRounds.has(m.stage) &&
          !isMatchLocked(m.kickoff) &&
          m.home_team_id != null &&
          m.away_team_id != null,
      )
      .map((m) => m.id),
  );

  const rows = input.predictions
    .filter((p) => open.has(p.matchId))
    .map((p) => {
      const home = clean(p.home);
      const away = clean(p.away);
      const m = byId.get(p.matchId);
      // El equipo de penales solo vale si predijo empate y es uno de los dos del cruce.
      const isDraw = home != null && away != null && home === away;
      const validAdvance =
        isDraw &&
        m != null &&
        (p.advance === m.home_team_id || p.advance === m.away_team_id)
          ? p.advance
          : null;
      return {
        user_id: user.id,
        league_id: input.leagueId,
        match_id: p.matchId,
        home_goals: home,
        away_goals: away,
        advance_team_id: validAdvance,
        updated_at: new Date().toISOString(),
      };
    });

  // Regla: empate SIN pick de penales no se guarda (obligatorio elegirlo).
  const drawsWithoutPick = rows.filter(
    (r) =>
      r.home_goals != null &&
      r.away_goals != null &&
      r.home_goals === r.away_goals &&
      r.advance_team_id == null,
  );
  if (drawsWithoutPick.length > 0)
    return {
      ok: false,
      error:
        "En los empates es obligatorio elegir quién pasa por penales. Revisa tus pronósticos con empate.",
    };

  if (rows.length > 0) {
    const { error } = await supabase
      .from("predictions")
      .upsert(rows, { onConflict: "user_id,league_id,match_id" });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/liga/${input.leagueId}/cuadro`);
  return { ok: true };
}

/**
 * Convierte una liga de grupos en eliminatorias (solo admin).
 * Conserva el mismo league_id: los puntos de grupos se mantienen y los del
 * mata-mata se suman encima.
 */
export async function startKnockout(leagueId: string): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesión expirada. Vuelve a entrar." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin)
    return { ok: false, error: "Solo un administrador puede hacer esto." };

  const { error } = await supabase.rpc("set_league_type", {
    p_league: leagueId,
    p_type: "eliminatorias",
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/liga/${leagueId}`);
  revalidatePath("/jugar");
  return { ok: true };
}
