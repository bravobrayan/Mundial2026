import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Devuelve el conjunto de grupos (A..L) en los que el usuario ya pronosticó
 * los 6 partidos (ambos marcadores).
 */
export async function getCompletedGroups(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const { data: matches } = await supabase
    .from("matches")
    .select("id, grp")
    .eq("stage", "group");

  const { data: preds } = await supabase
    .from("predictions")
    .select("match_id, home_goals, away_goals")
    .eq("user_id", userId);

  const filled = new Set(
    (preds ?? [])
      .filter((p) => p.home_goals != null && p.away_goals != null)
      .map((p) => p.match_id),
  );

  const total: Record<string, number> = {};
  const done: Record<string, number> = {};
  for (const m of matches ?? []) {
    if (!m.grp) continue;
    total[m.grp] = (total[m.grp] ?? 0) + 1;
    if (filled.has(m.id)) done[m.grp] = (done[m.grp] ?? 0) + 1;
  }

  const completed = new Set<string>();
  for (const g of Object.keys(total)) {
    if (done[g] === total[g]) completed.add(g);
  }
  return completed;
}
