"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isMatchLocked } from "@/lib/quiniela/lock";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SaveResult = { ok: true } | { ok: false; error: string };

type IncomingPred = { matchId: number; home: number | null; away: number | null };

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

/** Guarda los pronósticos de un grupo en una liga (bloqueo por partido). */
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

  const { data: kickoffs } = await supabase
    .from("matches")
    .select("id, kickoff")
    .in("id", matchIds);
  const open = new Set(
    (kickoffs ?? []).filter((m) => !isMatchLocked(m.kickoff)).map((m) => m.id),
  );

  const rows = input.predictions
    .filter((p) => open.has(p.matchId))
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

  revalidatePath(`/liga/${input.leagueId}/cuadro`);
  return { ok: true };
}
