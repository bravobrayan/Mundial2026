import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/quiniela/leagues";
import { AutoRefresh } from "@/components/AutoRefresh";
import { LiveBracket, type BracketMatch } from "@/components/LiveBracket";

export default async function BracketPage({
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

  const [{ data: matches }, { data: results }] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, stage, label, kickoff, home_team_id, away_team_id, home:home_team_id(name,flag), away:away_team_id(name,flag)",
      )
      .in("stage", ["r32", "r16", "qf", "sf", "third", "final"])
      .order("id"),
    supabase
      .from("results")
      .select("match_id, home_goals, away_goals, advance_team_id, finished"),
  ]);

  const resById = new Map(
    (results ?? []).map((r) => [
      r.match_id,
      {
        home: r.home_goals,
        away: r.away_goals,
        advance: r.advance_team_id ?? null,
        finished: r.finished ?? false,
      },
    ]),
  );

  const list = (matches ?? []) as unknown as {
    id: number;
    stage: string;
    label: string | null;
    kickoff: string;
    home_team_id: number | null;
    away_team_id: number | null;
    home: { name: string; flag: string | null } | null;
    away: { name: string; flag: string | null } | null;
  }[];

  const data: BracketMatch[] = list.map((m) => ({
    id: m.id,
    stage: m.stage,
    label: m.label,
    kickoff: m.kickoff,
    homeId: m.home_team_id,
    awayId: m.away_team_id,
    home: m.home,
    away: m.away,
    result: resById.get(m.id) ?? null,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-black text-white">Cuadro en vivo</h1>
      <p className="mb-6 text-sm text-slate-400">
        Se actualiza solo con los resultados reales. El ganador de cada partido
        avanza a la ronda siguiente.
      </p>
      <LiveBracket matches={data} />
    </main>
  );
}
