import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PredMap } from "@/lib/quiniela/types";
import { KnockoutEditor, type KnockoutMatch } from "@/components/KnockoutEditor";

export default async function CuadroPage({
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

  const [{ data: matches }, { data: preds }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, stage, label, kickoff, home_team_id, away_team_id, home:home_team_id(name,flag), away:away_team_id(name,flag)",
      )
      .in("stage", ["r32", "r16", "qf", "sf", "third", "final"])
      .order("id"),
    supabase
      .from("predictions")
      .select("match_id, home_goals, away_goals")
      .eq("user_id", user.id)
      .eq("league_id", id),
  ]);

  const initialPreds: PredMap = {};
  for (const p of preds ?? [])
    initialPreds[p.match_id] = { home: p.home_goals, away: p.away_goals };

  const list = (matches ?? []) as unknown as KnockoutMatch[];
  const anyDefined = list.some(
    (m) => m.home_team_id != null && m.away_team_id != null,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-black text-white">Eliminatorias</h1>
      <p className="mb-6 text-sm text-slate-400">
        Predice los marcadores de cada ronda. Los cruces se habilitan conforme
        se definen los equipos reales (mismo sistema 5/3/1).
      </p>

      {!anyDefined && (
        <div className="mb-6 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          🗓️ Aún no hay cruces definidos. Esta sección se activa cuando termine
          la fase de grupos y se conozcan los Dieciseisavos.
        </div>
      )}

      <KnockoutEditor leagueId={id} matches={list} initialPreds={initialPreds} />
    </main>
  );
}
