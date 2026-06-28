import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreLine, penaltyBonus } from "./score";

export type MyResultRow = {
  matchId: number;
  grp: string | null;
  label: string | null;
  kickoff: string;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
  pred: { home: number; away: number };
  real: { home: number; away: number };
  points: number;
  /** Marcador exacto (5 pts base), independiente del bonus de penales. */
  exact: boolean;
};

/**
 * Pronósticos del usuario en una liga que YA tienen resultado real,
 * con los puntos obtenidos. Ordenados del más reciente al más antiguo.
 */
export async function getMyResults(
  supabase: SupabaseClient,
  userId: string,
  leagueId: string,
): Promise<MyResultRow[]> {
  const { data: preds } = await supabase
    .from("predictions")
    .select(
      "match_id, home_goals, away_goals, advance_team_id, match:match_id(grp,label,kickoff,home:home_team_id(name,flag),away:away_team_id(name,flag))",
    )
    .eq("user_id", userId)
    .eq("league_id", leagueId)
    .not("home_goals", "is", null)
    .not("away_goals", "is", null);

  const rows = (preds ?? []) as unknown as {
    match_id: number;
    home_goals: number;
    away_goals: number;
    advance_team_id: number | null;
    match: {
      grp: string | null;
      label: string | null;
      kickoff: string;
      home: { name: string; flag: string | null } | null;
      away: { name: string; flag: string | null } | null;
    } | null;
  }[];

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.match_id);
  const { data: resData } = await supabase
    .from("results")
    .select("match_id, home_goals, away_goals, advance_team_id")
    .in("match_id", ids);
  const results = new Map(
    (resData ?? []).map((r) => [
      r.match_id,
      { home: r.home_goals, away: r.away_goals, advance: r.advance_team_id },
    ]),
  );

  const out: MyResultRow[] = [];
  for (const r of rows) {
    const real = results.get(r.match_id);
    if (!real || !r.match) continue;
    out.push({
      matchId: r.match_id,
      grp: r.match.grp,
      label: r.match.label,
      kickoff: r.match.kickoff,
      home: r.match.home,
      away: r.match.away,
      pred: { home: r.home_goals, away: r.away_goals },
      real: { home: real.home, away: real.away },
      points:
        scoreLine(r.home_goals, r.away_goals, real.home, real.away) +
        penaltyBonus(
          r.home_goals,
          r.away_goals,
          r.advance_team_id,
          real.home,
          real.away,
          real.advance,
        ),
      exact: r.home_goals === real.home && r.away_goals === real.away,
    });
  }
  out.sort(
    (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime(),
  );
  return out;
}
