import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Flag } from "@/components/Flag";
import { GROUPS } from "@/lib/quiniela/types";
import {
  computeRealStandings,
  type GroupMatch,
  type TeamLite,
} from "@/lib/quiniela/realStandings";

export default async function PosicionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: teams }, { data: matches }] = await Promise.all([
    supabase.from("teams").select("id, name, grp, flag"),
    supabase
      .from("matches")
      .select("id, grp, home_team_id, away_team_id")
      .eq("stage", "group"),
  ]);

  const matchIds = (matches ?? []).map((m) => m.id);
  const { data: resData } = await supabase
    .from("results")
    .select("match_id, home_goals, away_goals")
    .in("match_id", matchIds.length ? matchIds : [-1]);
  const results = new Map(
    (resData ?? []).map((r) => [
      r.match_id,
      { home_goals: r.home_goals, away_goals: r.away_goals },
    ]),
  );

  const standings = computeRealStandings(
    (teams ?? []) as TeamLite[],
    (matches ?? []) as GroupMatch[],
    results,
  );
  const anyPlayed = results.size > 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-black text-white">Posiciones reales</h1>
      <p className="mb-6 text-sm text-slate-400">
        Clasificación oficial de los grupos según los resultados reales.{" "}
        {!anyPlayed && "Aún no hay partidos jugados."}
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {GROUPS.map((g) => {
          const rows = standings[g] ?? [];
          if (rows.length === 0) return null;
          return (
            <div
              key={g}
              className="overflow-hidden rounded-2xl border border-white/10 bg-navy-900/50"
            >
              <div className="border-b border-white/10 bg-navy-900/70 px-4 py-2.5">
                <span className="text-sm font-bold text-white">Grupo {g}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-1 py-2 text-left font-medium">Equipo</th>
                    <th className="px-1.5 py-2 text-center font-medium">PJ</th>
                    <th className="px-1.5 py-2 text-center font-medium">DG</th>
                    <th className="px-3 py-2 text-right font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.teamId}
                      className={`border-t border-white/5 ${
                        i < 2 ? "bg-pitch-500/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2 font-bold text-slate-400">
                        {i + 1}
                      </td>
                      <td className="px-1 py-2">
                        <span className="flex items-center gap-2">
                          <Flag flag={r.flag} className="w-5" />
                          <span className="truncate font-medium text-white">
                            {r.name}
                          </span>
                        </span>
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-slate-400">
                        {r.pj}
                      </td>
                      <td className="px-1.5 py-2 text-center tabular-nums text-slate-400">
                        {r.dif > 0 ? `+${r.dif}` : r.dif}
                      </td>
                      <td className="px-3 py-2 text-right text-base font-black tabular-nums text-white">
                        {r.pts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-600">
        Los dos primeros de cada grupo (resaltados) avanzan. Desempate mostrado:
        puntos, diferencia de gol, goles a favor.
      </p>
    </main>
  );
}
