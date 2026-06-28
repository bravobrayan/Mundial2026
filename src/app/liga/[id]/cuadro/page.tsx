import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PredMap } from "@/lib/quiniela/types";
import { KnockoutEditor, type KnockoutMatch } from "@/components/KnockoutEditor";
import { getMembership } from "@/lib/quiniela/leagues";

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

  const league = await getMembership(supabase, user.id, id);
  if (!league) redirect("/jugar");
  if (league.league_type === "grupos") redirect(`/liga/${id}`);

  const [{ data: matches }, { data: preds }, { data: openRoundsStr }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, stage, label, kickoff, home_team_id, away_team_id, home:home_team_id(name,flag), away:away_team_id(name,flag)",
        )
        .in("stage", ["r32", "r16", "qf", "sf", "third", "final"])
        .order("id"),
      supabase
        .from("predictions")
        .select("match_id, home_goals, away_goals, advance_team_id")
        .eq("user_id", user.id)
        .eq("league_id", id),
      supabase.rpc("get_knockout_rounds"),
    ]);

  const initialPreds: PredMap = {};
  for (const p of preds ?? [])
    initialPreds[p.match_id] = {
      home: p.home_goals,
      away: p.away_goals,
      advance: p.advance_team_id,
    };

  const openStages = String(openRoundsStr ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const list = (matches ?? []) as unknown as KnockoutMatch[];
  const anyOpenDefined = list.some(
    (m) =>
      openStages.includes(m.stage) &&
      m.home_team_id != null &&
      m.away_team_id != null,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-black text-white">Eliminatorias</h1>
      <p className="mb-6 text-sm text-slate-400">
        Marcador a los 120&apos; (con prórroga). Si predices empate, marca quién
        pasa por penales: +3 si aciertas. El cuadro se abre ronda por ronda.
      </p>

      {!anyOpenDefined && (
        <div className="mb-6 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
          🗓️ Aún no hay una ronda abierta con cruces definidos. Esta sección se
          activa cuando el admin habilite la ronda y se conozcan los equipos.
        </div>
      )}

      <KnockoutEditor
        leagueId={id}
        matches={list}
        initialPreds={initialPreds}
        openStages={openStages}
      />
    </main>
  );
}
