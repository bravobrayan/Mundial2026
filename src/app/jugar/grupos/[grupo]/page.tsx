import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GROUPS, type Match, type PredMap, type Team } from "@/lib/quiniela/types";
import { getCompletedGroups } from "@/lib/quiniela/progress";
import { GroupTabs } from "../GroupTabs";
import { GroupEditor } from "../GroupEditor";

export default async function GrupoPage({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  const { grupo: raw } = await params;
  const grupo = raw.toUpperCase();
  if (!GROUPS.includes(grupo as (typeof GROUPS)[number])) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: teams }, { data: matches }, { data: preds }, { data: pos }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, grp, flag")
        .eq("grp", grupo)
        .order("id"),
      supabase
        .from("matches")
        .select("*")
        .eq("stage", "group")
        .eq("grp", grupo)
        .order("kickoff")
        .order("id"),
      supabase
        .from("predictions")
        .select("match_id, home_goals, away_goals")
        .eq("user_id", user.id),
      supabase
        .from("group_positions")
        .select("team_id, position")
        .eq("user_id", user.id)
        .eq("grp", grupo)
        .order("position"),
    ]);

  const initialPreds: PredMap = {};
  for (const p of preds ?? []) {
    initialPreds[p.match_id] = { home: p.home_goals, away: p.away_goals };
  }
  const initialOrder = (pos ?? []).map((p) => p.team_id);
  const completed = await getCompletedGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            Pronósticos de grupos
          </h1>
          <p className="text-sm text-slate-400">
            Llena los 6 partidos del grupo. La tabla se actualiza sola.
          </p>
        </div>
        <GroupTabs active={grupo} completed={completed} />
      </div>

      <GroupEditor
        grupo={grupo}
        teams={(teams ?? []) as Team[]}
        matches={(matches ?? []) as Match[]}
        initialPreds={initialPreds}
        initialOrder={initialOrder}
      />
    </main>
  );
}
