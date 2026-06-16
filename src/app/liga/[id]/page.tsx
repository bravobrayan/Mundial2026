import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompletedGroups } from "@/lib/quiniela/progress";
import { isGroupLocked, isMatchFinished } from "@/lib/quiniela/lock";
import { GroupLockCountdown } from "@/components/GroupLockCountdown";
import { AutoRefresh } from "@/components/AutoRefresh";
import { type CarouselMatch } from "@/components/MatchCarousel";
import {
  LeagueUpcoming,
  type UpcomingPred,
} from "@/components/LeagueUpcoming";
import { Podium } from "@/components/Podium";
import { RankingTable, type RankingRow } from "@/components/RankingTable";
import { LiveMatchCard, type LiveMatch } from "@/components/LiveMatchCard";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = !!profile?.is_admin;

  const { count: members } = await supabase
    .from("league_members")
    .select("user_id", { count: "exact", head: true })
    .eq("league_id", id);

  const completed = await getCompletedGroups(supabase, user.id, id);
  const pct = Math.round((completed.size / 12) * 100);
  const tournamentStarted = isGroupLocked();

  const { data: up } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, stadium, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .gt("kickoff", new Date().toISOString())
    .order("kickoff")
    .limit(8);

  // Pronósticos de los próximos partidos (para el pop-up "ver todos").
  const upIds = (up ?? []).map((m) => m.id);
  const upPreds: Record<number, UpcomingPred[]> = {};
  if (upIds.length > 0) {
    const { data: ub } = await supabase.rpc("league_board", {
      p_league: id,
      p_matches: upIds,
    });
    for (const r of (ub ?? []) as (UpcomingPred & { match_id: number })[]) {
      (upPreds[r.match_id] ??= []).push(r);
    }
  }

  const { data: rankData } = await supabase.rpc("league_leaderboard", {
    p_league: id,
  });
  const ranking = (rankData ?? []) as RankingRow[];
  const hasPoints = ranking.some((r) => r.points > 0);

  // Partidos EN VIVO (empezaron en las últimas ~2.5h)
  const nowMs = Date.now();
  const { data: liveData } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .lte("kickoff", new Date(nowMs).toISOString())
    .gte("kickoff", new Date(nowMs - 4 * 3_600_000).toISOString())
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
    { home_goals: number; away_goals: number; finished?: boolean }
  >();
  if (liveMatches.length > 0) {
    const liveIds = liveMatches.map((m) => m.id);
    const [{ data: board }, { data: res }] = await Promise.all([
      supabase.rpc("league_board", { p_league: id, p_matches: liveIds }),
      supabase
        .from("results")
        .select("match_id, home_goals, away_goals, finished")
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

  const liveSection = liveMatches.length > 0 && (
    <section className="flex flex-col gap-3">
      {liveMatches.map((m) => (
        <LiveMatchCard
          key={m.id}
          match={m}
          members={ranking}
          preds={liveBoard.get(m.id) ?? []}
          result={liveResults.get(m.id)}
          meId={user.id}
          finished={
            (liveResults.get(m.id)?.finished ?? false) ||
            isMatchFinished(m.kickoff)
          }
          isAdmin={isAdmin}
        />
      ))}
    </section>
  );

  const rankingSection = (
    <section>
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
        <p className="text-sm text-slate-500">Aún sin participantes.</p>
      ) : !hasPoints ? (
        <RankingTable rows={ranking} meId={user.id} showExactos={false} />
      ) : (
        <div className="flex flex-col gap-5">
          {ranking.length >= 3 && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/50 to-navy-900/40 px-4 pb-5 pt-6">
              <Podium rows={ranking} meId={user.id} />
            </div>
          )}
          {ranking.length > 3 && (
            <RankingTable rows={ranking.slice(3)} meId={user.id} startRank={3} />
          )}
        </div>
      )}
    </section>
  );

  const upcomingSection = (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
        ⚽ Próximos partidos
      </h2>
      <LeagueUpcoming
        matches={(up ?? []) as unknown as CarouselMatch[]}
        preds={upPreds}
        meId={user.id}
      />
    </section>
  );

  // Bloque de grupos: protagonista antes del torneo, acceso secundario después.
  const groupsBlock = tournamentStarted ? (
    <Link
      href={`/liga/${id}/grupos`}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-900/50 p-4 transition hover:border-white/20"
    >
      <div>
        <h3 className="font-semibold text-white">Mis grupos</h3>
        <p className="mt-0.5 text-sm text-slate-400">
          Revisa tus pronósticos de la fase de grupos.
        </p>
      </div>
      <span className="text-sm text-gold-400">{completed.size}/12 →</span>
    </Link>
  ) : (
    <div className="rounded-2xl border border-white/10 bg-navy-900/50 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Fase de grupos</h2>
        <span className="text-sm text-slate-400">{completed.size}/12 grupos</span>
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
  );

  const progressSection = isOwner && progress.length > 0 && (
    <section>
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
          const rpct = Math.round((r.group_filled / 72) * 100);
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
                    style={{ width: `${rpct}%` }}
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
  );

  const accessCards = (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card
        title="Posiciones"
        desc="La tabla real de los 12 grupos."
        href={`/liga/${id}/posiciones`}
      />
      <Card
        title="Partidos"
        desc="Qué predijo cada quien (se revela al empezar)."
        href={`/liga/${id}/partidos`}
      />
      <Card
        title="Eliminatorias"
        desc="Predice los cruces reales hasta la final."
        href={`/liga/${id}/cuadro`}
      />
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10">
      <AutoRefresh />
      <div>
        <h1 className="text-3xl font-black text-white">{league.name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {members ?? 1} {members === 1 ? "miembro" : "miembros"} · tu quiniela
          en esta liga
        </p>
      </div>

      {tournamentStarted ? (
        <>
          {liveSection}
          {upcomingSection}
          {groupsBlock}
          {rankingSection}
          {accessCards}
          {progressSection}
        </>
      ) : (
        <>
          <GroupLockCountdown />
          {liveSection}
          {groupsBlock}
          {upcomingSection}
          {rankingSection}
          {progressSection}
          {accessCards}
        </>
      )}
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
