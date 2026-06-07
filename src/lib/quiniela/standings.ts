import type { Match, PredMap } from "./types";

export type StandingRow = {
  teamId: number;
  pj: number; // jugados
  g: number; // ganados
  e: number; // empatados
  p: number; // perdidos
  gf: number; // goles a favor
  gc: number; // goles en contra
  dif: number; // diferencia
  pts: number; // puntos
};

function emptyRow(teamId: number): StandingRow {
  return { teamId, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0 };
}

/** Calcula la tabla a partir de los marcadores pronosticados del grupo. */
export function computeRows(
  teamIds: number[],
  matches: Match[],
  preds: PredMap,
): Record<number, StandingRow> {
  const rows: Record<number, StandingRow> = {};
  for (const id of teamIds) rows[id] = emptyRow(id);

  for (const m of matches) {
    if (m.home_team_id == null || m.away_team_id == null) continue;
    const p = preds[m.id];
    if (!p || p.home == null || p.away == null) continue;

    const h = rows[m.home_team_id];
    const a = rows[m.away_team_id];
    if (!h || !a) continue;

    h.pj++;
    a.pj++;
    h.gf += p.home;
    h.gc += p.away;
    a.gf += p.away;
    a.gc += p.home;

    if (p.home > p.away) {
      h.g++;
      h.pts += 3;
      a.p++;
    } else if (p.home < p.away) {
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

  for (const id of teamIds) rows[id].dif = rows[id].gf - rows[id].gc;
  return rows;
}

/**
 * Ordena el grupo: primero por PUNTOS (desc). Los empates de puntos los
 * resuelve el orden MANUAL del usuario (decisión del proyecto: 100% manual).
 * `manualOrder` es un arreglo de teamIds con la preferencia del usuario.
 */
export function sortStanding(
  teamIds: number[],
  rows: Record<number, StandingRow>,
  manualOrder: number[],
): number[] {
  const manualIndex = (id: number) => {
    const i = manualOrder.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...teamIds].sort(
    (a, b) => rows[b].pts - rows[a].pts || manualIndex(a) - manualIndex(b),
  );
}
