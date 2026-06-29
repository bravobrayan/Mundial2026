import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import {
  fetchWC2026,
  topScorers,
  finishedMatches,
  toEsTeam,
  normalize,
} from "@/lib/api/openfootball";

export default async function EstadisticasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ ok, matches, error }, { data: teams }] = await Promise.all([
    fetchWC2026(),
    supabase.from("teams").select("name, flag"),
  ]);

  // Mapa: nombre ES normalizado → bandera.
  const flagOf = new Map(
    (teams ?? []).map((t) => [normalize(t.name), t.flag as string | null]),
  );
  const teamFlag = (enName: string) =>
    flagOf.get(normalize(toEsTeam(enName))) ?? null;

  const scorers = topScorers(matches).slice(0, 20);
  const results = finishedMatches(matches).slice(0, 12);
  const totalGoals = topScorers(matches).reduce((s, x) => s + x.goals, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-black text-white">Estadísticas</h1>
      <p className="mb-6 text-sm text-slate-400">
        Datos del Mundial 2026 (fuente abierta, se actualiza durante el torneo).
      </p>

      {!ok ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          No se pudo cargar la data ({error}). Reintenta en un momento.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Goleadores */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
                ⚽ Goleadores
              </h2>
              <span className="text-xs text-slate-500">{totalGoals} goles</span>
            </div>
            {scorers.length === 0 ? (
              <p className="text-sm text-slate-500">Aún sin goles cargados.</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-navy-900/50">
                {scorers.map((s, i) => (
                  <div
                    key={`${s.name}-${s.team}`}
                    className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0"
                  >
                    <span className="w-5 text-right text-sm font-bold tabular-nums text-slate-500">
                      {i + 1}
                    </span>
                    <Flag flag={teamFlag(s.team)} className="w-6 shrink-0 rounded-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {s.name}
                      </div>
                      <div className="truncate text-[11px] text-slate-500">
                        {toEsTeam(s.team)}
                      </div>
                    </div>
                    {s.penalties > 0 && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {s.penalties} pen
                      </span>
                    )}
                    <span className="w-7 text-right text-lg font-black tabular-nums text-white">
                      {s.goals}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Últimos resultados */}
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gold-400">
              📅 Últimos resultados
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {results.map((m, idx) => (
                <div
                  key={`${m.date}-${m.team1}-${idx}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-navy-900/50 px-3 py-2.5 text-sm"
                >
                  <div className="flex flex-1 items-center justify-end gap-1.5 text-right">
                    <span className="truncate text-white">
                      {toEsTeam(m.team1)}
                    </span>
                    <Flag flag={teamFlag(m.team1)} className="w-5 shrink-0 rounded-[2px]" />
                  </div>
                  <span className="shrink-0 rounded bg-navy-950 px-2 py-0.5 font-black tabular-nums text-white">
                    {m.ft[0]}-{m.ft[1]}
                  </span>
                  <div className="flex flex-1 items-center gap-1.5">
                    <Flag flag={teamFlag(m.team2)} className="w-5 shrink-0 rounded-[2px]" />
                    <span className="truncate text-white">
                      {toEsTeam(m.team2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
