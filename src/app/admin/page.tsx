import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/quiniela/types";
import { AdminBoard, type AdminMatch } from "./AdminBoard";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: matches }, { data: results }, { data: teams }] =
    await Promise.all([
      supabase
        .from("matches")
        .select(
          "id, stage, grp, kickoff, label, home_team_id, away_team_id, home:home_team_id(name,flag), away:away_team_id(name,flag)",
        )
        .order("id"),
      supabase.from("results").select("match_id, home_goals, away_goals, finished"),
      supabase.from("teams").select("id, name, grp, flag").order("grp").order("name"),
    ]);

  const resultMap: Record<
    number,
    { home: number; away: number; finished: boolean }
  > = {};
  for (const r of results ?? [])
    resultMap[r.match_id] = {
      home: r.home_goals,
      away: r.away_goals,
      finished: r.finished ?? false,
    };

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-black text-white">Resultados reales</h1>
      <p className="mb-6 text-sm text-slate-400">
        Carga los marcadores reales. El ranking se recalcula solo. En
        eliminatorias, primero define los equipos del cruce.
      </p>
      <AdminBoard
        matches={(matches ?? []) as unknown as AdminMatch[]}
        results={resultMap}
        teams={(teams ?? []) as Team[]}
      />
    </main>
  );
}
