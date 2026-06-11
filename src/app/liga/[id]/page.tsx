import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompletedGroups } from "@/lib/quiniela/progress";
import { GroupLockCountdown } from "@/components/GroupLockCountdown";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  UpcomingMatches,
  type UpcomingMatch,
} from "@/components/UpcomingMatches";
import { LiveMatchCard, type LiveMatch } from "@/components/LiveMatchCard";

type RankRow = {
  user_id: string;
  display_name: string;
  points: number;
  exactos: number;
  partidos: number;
};

export default async function LigaDashboard({
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

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!league) redirect("/jugar");
  const isOwner = league.owner_id === user.id;

  const { count: members } = await supabase
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", id);

  const completed = await getCompletedGroups(supabase, user.id, id);
  const pct = Math.round((completed.size / 12) * 100);

  const { data: up } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, stadium, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .gt("kickoff", new Date().toISOString())
    .order("kickoff")
    .limit(4);

  const { data: rankData } = await supabase.rpc("league_leaderboard", {
    p_league: id,
  });
  const ranking = (rankData ?? []) as RankRow[];

  // Partidos EN VIVO (empezaron en las últimas ~2.5h)
  const nowMs = Date.now();
  const { data: liveData } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .lte("kickoff", new Date(nowMs).toISOString())
    .gte("kickoff", new Date(nowMs - 2.5 * 3_600_000).toISOString())
    .order("kickoff", { ascending: false });
  const liveMatches = (liveData ?? []) as unknown as LiveMatch[];

  type BoardRow = {
    match_id: number;
    user_id: string;
    display_name: string;
    home_goals: number | null;
    away_goals: number | null;
    points: number | null;
    revealed: boolean;
  };
  const liveBoard = new Map<number, BoardRow[]>();
  const liveResults = new Map<
    number,
    { home_goals: number; away_goals: number }
  >();
  if (liveMatches.length > 0) {
    const liveIds = liveMatches.map((m) => m.id);
    const [{ data: board }, { data: res }] = await Promise.all([
      supabase.rpc("league_board", { p_league: id, p_matches: liveIds }),
      supabase
        .from("results")
        .select("match_id, home_goals, away_goals")
        .in("match_id", liveIds),
    ]);
    for (const r of (board ?? []) as BoardRow[]) {
      if (!liveIds.includes(r.match_id)) continue;
      const arr = liveBoard.get(r.match_id) ?? [];
      arr.push(r);
      liveBoard.set(r.match_id, arr);
    }
    for (const r of res ?? []) liveResults.set(r.match_id, r);
  }

  // Progreso de llenado: SOLO lo ve el dueño de la liga.
  let progress: { user_id: string; display_name: string; group_filled: number }[] =
    [];
  if (isOwner) {
    const { data } = await supabase.rpc("league_progress", { p_league: id });
    progress = (data ?? []) as typeof progress;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <AutoRefresh />
      <h1 className="text-3xl font-black text-white">{league.name}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {members ?? 1} {members === 1 ? "miembro" : "miembros"} · tu quiniela en
        esta liga
      </p>

      {/* Partido(s) en vivo — destacado */}
      {liveMatches.length > 0 && (
        <section className="mt-6 flex flex-col gap-3">
          {liveMatches.map((m) => (
            <LiveMatchCard
              key={m.id}
              match={m}
              members={ranking}
              preds={liveBoard.get(m.id) ?? []}
              result={liveResults.get(m.id)}
              meId={user.id}
            />
          ))}
        </section>
      )}

      <div className="mt-5">
        <GroupLockCountdown />
      </div>

      {/* Fase de grupos (arriba) */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Fase de grupos</h2>
          <span className="text-sm text-slate-400">
            {completed.size}/12 grupos
          </span>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-navy-950">
          <div
            className="h-full rounded-full bg-pitch-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <Link
          href={`/liga/${id}/grupos`}
          className="mt-5 inline-block rounded-xl bg-pitch-500 px-5 py-2.5 font-semibold text-navy-950 transition hover:bg-pitch-600"
        >
          {completed.size === 0
            ? "Empezar mis pronósticos →"
            : completed.size === 12
              ? "Revisar mis grupos →"
              : "Continuar →"}
        </Link>
      </div>

      {/* Próximos partidos (dinámico) */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
          ⚽ Próximos partidos
        </h2>
        <UpcomingMatches matches={(up ?? []) as unknown as UpcomingMatch[]} />
      </section>

      {/* Ranking (visible) */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            🏆 Ranking de la liga
          </h2>
          <Link
            href={`/liga/${id}/ranking`}
            className="text-sm text-gold-400 hover:underline"
          >
            Ver completo →
          </Link>
        </div>
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-500">Aún sin puntos cargados.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-2 py-3 text-left font-medium">Jugador</th>
                  <th className="px-4 py-3 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => {
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Progreso de llenado — SOLO el dueño */}
      {isOwner && progress.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              👀 Quién falta por completar
            </h2>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
              solo tú ves esto
            </span>
          </div>
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-navy-900/50">
            {progress.map((r) => {
              const pct = Math.round((r.group_filled / 72) * 100);
              const done = r.group_filled >= 72;
              return (
                <div
                  key={r.user_id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="truncate text-sm text-white">
                    {r.display_name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-navy-950">
                      <div
                        className={`h-full rounded-full ${done ? "bg-pitch-500" : "bg-gold-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className={`w-14 text-right text-xs tabular-nums ${done ? "text-pitch-500" : "text-slate-400"}`}
                    >
                      {r.group_filled}/72{done ? " ✓" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Accesos */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card
          title="Partidos"
          desc="Mira qué predijo cada quien (se revela al empezar)."
          href={`/liga/${id}/partidos`}
        />
        <Card
          title="Eliminatorias"
          desc="Predice los cruces reales, de Dieciseisavos a la final."
          href={`/liga/${id}/cuadro`}
        />
      </div>
    </main>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="h-full rounded-2xl border border-white/10 bg-navy-900/50 p-5 transition hover:border-white/20">
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
      </div>
    </Link>
  );
}
