import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ExpelButton } from "./ExpelButton";

type Row = {
  user_id: string;
  display_name: string;
  points: number;
  exactos: number;
  partidos: number;
};

export default async function LigaRankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.rpc("league_leaderboard", {
    p_league: id,
  });
  const rows = (data ?? []) as Row[];

  const { data: league } = await supabase
    .from("leagues")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();
  const isOwner = league?.owner_id === user.id;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-black text-white">Ranking de la liga</h1>
      <p className="mb-6 text-sm text-slate-400">
        Solo los miembros de esta liga. Se actualiza conforme entran los
        resultados reales.
      </p>

      {error && (
        <div className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          No se pudo cargar el ranking (¿corriste la migración 0004?).
        </div>
      )}

      {!error && rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-2 py-3 text-left font-medium">Jugador</th>
                <th className="px-4 py-3 text-right font-medium">Pts</th>
                {isOwner && <th className="px-2 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const me = r.user_id === user.id;
                const medal = ["🥇", "🥈", "🥉"][i];
                return (
                  <tr
                    key={r.user_id}
                    className={`border-t border-white/5 ${me ? "bg-pitch-500/10" : ""}`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-300">
                      {medal ?? i + 1}
                    </td>
                    <td className="px-2 py-3 font-medium text-white">
                      {r.display_name}
                      {me && (
                        <span className="ml-2 rounded bg-pitch-500/20 px-1.5 py-0.5 text-[10px] text-pitch-500">
                          tú
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-black tabular-nums text-white">
                      {r.points}
                    </td>
                    {isOwner && (
                      <td className="px-2 py-3 text-right">
                        {!me && (
                          <ExpelButton
                            leagueId={id}
                            userId={r.user_id}
                            name={r.display_name}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
