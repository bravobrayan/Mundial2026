import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AutoRefresh } from "@/components/AutoRefresh";
import { Podium } from "@/components/Podium";
import { RankingTable, type RankingRow } from "@/components/RankingTable";
import { ExpelButton } from "./ExpelButton";

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
  const rows = (data ?? []) as RankingRow[];
  const hasPoints = rows.some((r) => r.points > 0);

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
        resultados reales. Desempate por marcadores exactos.
      </p>

      {error && (
        <div className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          No se pudo cargar el ranking (¿corriste la migración 0004?).
        </div>
      )}

      {!error && rows.length > 0 && (
        <div className="flex flex-col gap-6">
          {hasPoints && rows.length >= 3 && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/50 to-navy-900/40 px-4 pb-5 pt-6">
              <Podium rows={rows} meId={user.id} />
            </div>
          )}
          <RankingTable
            rows={rows}
            meId={user.id}
            showExactos={hasPoints}
            action={
              isOwner
                ? (r) => (
                    <ExpelButton
                      leagueId={id}
                      userId={r.user_id}
                      name={r.display_name}
                    />
                  )
                : undefined
            }
          />
        </div>
      )}
    </main>
  );
}
