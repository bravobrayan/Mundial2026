import type { ReactNode } from "react";

export type RankingRow = {
  user_id: string;
  display_name: string;
  points: number;
  exactos?: number;
  partidos?: number;
};

/**
 * Tabla de ranking reutilizable (dashboard, ranking de liga, etc.).
 * Muestra Pts y, como desempate, los marcadores Exactos.
 * `action` permite inyectar un control por fila (ej. expulsar) solo al dueño.
 */
export function RankingTable({
  rows,
  meId,
  showExactos = true,
  startRank = 0,
  action,
}: {
  rows: RankingRow[];
  meId: string;
  showExactos?: boolean;
  /** Si se pasa, las posiciones empiezan en startRank+1 (para "fuera del top"). */
  startRank?: number;
  action?: (row: RankingRow) => ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-2 py-3 text-left font-medium">Jugador</th>
            {showExactos && (
              <th className="px-2 py-3 text-right font-medium">Exactos</th>
            )}
            <th className="px-4 py-3 text-right font-medium">Pts</th>
            {action && <th className="px-2 py-3" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rank = startRank + i;
            const me = r.user_id === meId;
            const medal = ["🥇", "🥈", "🥉"][rank];
            return (
              <tr
                key={r.user_id}
                className={`border-t border-white/5 ${me ? "bg-pitch-500/10" : ""}`}
              >
                <td className="px-4 py-3 font-bold text-slate-300">
                  {medal ?? rank + 1}
                </td>
                <td className="px-2 py-3 font-medium text-white">
                  {r.display_name}
                  {me && (
                    <span className="ml-2 rounded bg-pitch-500/20 px-1.5 py-0.5 text-[10px] text-pitch-500">
                      tú
                    </span>
                  )}
                </td>
                {showExactos && (
                  <td className="px-2 py-3 text-right tabular-nums text-slate-400">
                    {r.exactos ?? 0}
                  </td>
                )}
                <td className="px-4 py-3 text-right text-lg font-black tabular-nums text-white">
                  {r.points}
                </td>
                {action && (
                  <td className="px-2 py-3 text-right">{!me && action(r)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
