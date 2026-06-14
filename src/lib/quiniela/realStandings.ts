/** Tabla de posiciones REAL de los grupos, calculada con los resultados oficiales. */

export type TeamLite = {
  id: number;
  name: string;
  grp: string | null;
  flag: string | null;
};

export type GroupMatch = {
  id: number;
  grp: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
};

export type RealRow = {
  teamId: number;
  name: string;
  flag: string | null;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
};

/**
 * Devuelve un mapa { grupo -> filas ordenadas } usando SOLO los partidos
 * que ya tienen resultado. Orden: pts, dif, gf, nombre (desempate estándar
 * simplificado; no aplica head-to-head FIFA, es una vista informativa).
 */
export function computeRealStandings(
  teams: TeamLite[],
  matches: GroupMatch[],
  results: Map<number, { home_goals: number; away_goals: number }>,
): Record<string, RealRow[]> {
  const rowById = new Map<number, RealRow>();
  for (const t of teams) {
    if (!t.grp) continue;
    rowById.set(t.id, {
      teamId: t.id,
      name: t.name,
      flag: t.flag,
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      pts: 0,
    });
  }

  for (const m of matches) {
    if (m.home_team_id == null || m.away_team_id == null) continue;
    const r = results.get(m.id);
    if (!r) continue;
    const h = rowById.get(m.home_team_id);
    const a = rowById.get(m.away_team_id);
    if (!h || !a) continue;

    h.pj++;
    a.pj++;
    h.gf += r.home_goals;
    h.gc += r.away_goals;
    a.gf += r.away_goals;
    a.gc += r.home_goals;

    if (r.home_goals > r.away_goals) {
      h.g++;
      h.pts += 3;
      a.p++;
    } else if (r.home_goals < r.away_goals) {
      a.g++;
      a.pts += 3;
      h.p++;
    } else {
      h.e++;
      a.e++;
      h.pts++;
      a.pts++;
    }
  }

  const byGroup: Record<string, RealRow[]> = {};
  for (const t of teams) {
    if (!t.grp) continue;
    const row = rowById.get(t.id)!;
    row.dif = row.gf - row.gc;
    (byGroup[t.grp] ??= []).push(row);
  }
  for (const g of Object.keys(byGroup)) {
    byGroup[g].sort(
      (a, b) =>
        b.pts - a.pts ||
        b.dif - a.dif ||
        b.gf - a.gf ||
        a.name.localeCompare(b.name),
    );
  }
  return byGroup;
}
