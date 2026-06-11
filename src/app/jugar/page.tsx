import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { League } from "@/lib/quiniela/leagues";
import {
  UpcomingMatches,
  type UpcomingMatch,
} from "@/components/UpcomingMatches";
import { GroupLockCountdown } from "@/components/GroupLockCountdown";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  LiveMatchBanner,
  type LiveBannerMatch,
} from "@/components/LiveMatchBanner";

type RankRow = {
  user_id: string;
  display_name: string;
  points: number;
  exactos: number;
  partidos: number;
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const nombre = profile?.display_name ?? user.email?.split("@")[0] ?? "jugador";

  const nowMs = Date.now();

  // Partido(s) en vivo (empezaron en las últimas ~2.5h)
  const { data: liveData } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .lte("kickoff", new Date(nowMs).toISOString())
    .gte("kickoff", new Date(nowMs - 2.5 * 3_600_000).toISOString())
    .order("kickoff", { ascending: false });
  const liveMatches = (liveData ?? []) as unknown as LiveBannerMatch[];
  let liveResults = new Map<
    number,
    { home_goals: number; away_goals: number }
  >();
  if (liveMatches.length > 0) {
    const { data: res } = await supabase
      .from("results")
      .select("match_id, home_goals, away_goals")
      .in(
        "match_id",
        liveMatches.map((m) => m.id),
      );
    liveResults = new Map((res ?? []).map((r) => [r.match_id, r]));
  }

  const { data: up } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, stadium, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .gt("kickoff", new Date(nowMs).toISOString())
    .order("kickoff")
    .limit(6);

  const { data: leaguesData } = await supabase.rpc("my_leagues");
  const leagues = (leaguesData ?? []) as League[];
  const rankings = await Promise.all(
    leagues.map(async (l) => {
      const { data } = await supabase.rpc("league_leaderboard", {
        p_league: l.id,
      });
      return { league: l, rows: (data ?? []) as RankRow[] };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <AutoRefresh seconds={60} />
      <p className="text-sm text-slate-400">Hola,</p>
      <h1 className="text-3xl font-black text-white">{nombre} 👋</h1>

      <div className="mt-5">
        <GroupLockCountdown />
      </div>

      {/* Partido en vivo (destacado) */}
      {liveMatches.length > 0 && (
        <section className="mt-6">
          <LiveMatchBanner matches={liveMatches} results={liveResults} />
        </section>
      )}

      {/* Próximos partidos */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            ⚽ Próximos partidos
          </h2>
        </div>
        <UpcomingMatches matches={(up ?? []) as unknown as UpcomingMatch[]} />
      </section>

      {/* Mis ligas + ranking */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            🏆 Mis ligas
          </h2>
          <Link
            href="/jugar/ligas"
            className="text-sm text-gold-400 hover:underline"
          >
            Gestionar →
          </Link>
        </div>

        {leagues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-navy-900/40 p-6 text-center">
            <p className="text-sm text-slate-300">
              Aún no estás en ninguna liga.
            </p>
            <Link
              href="/jugar/ligas"
              className="mt-3 inline-block rounded-xl bg-pitch-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-pitch-600"
            >
              Unirme con un código
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rankings.map((r) => (
              <LeagueRankingCard
                key={r.league.id}
                league={r.league}
                rows={r.rows}
                meId={user.id}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function LeagueRankingCard({
  league,
  rows,
  meId,
}: {
  league: League;
  rows: RankRow[];
  meId: string;
}) {
  const top = rows.slice(0, 5);
  const myIdx = rows.findIndex((r) => r.user_id === meId);
  const mineOutside = myIdx >= 5 ? rows[myIdx] : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate font-semibold text-white">{league.name}</div>
          <div className="text-xs text-slate-400">
            {league.members} {league.members === 1 ? "miembro" : "miembros"}
          </div>
        </div>
        <Link
          href={`/liga/${league.id}`}
          className="shrink-0 text-sm text-gold-400 hover:underline"
        >
          Ver liga →
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">Aún sin puntos cargados.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {top.map((r, i) => (
              <RankLine key={r.user_id} i={i} r={r} me={r.user_id === meId} />
            ))}
            {mineOutside && (
              <>
                <tr>
                  <td colSpan={3} className="py-1 text-center text-slate-600">
                    ···
                  </td>
                </tr>
                <RankLine i={myIdx} r={mineOutside} me />
              </>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RankLine({
  i,
  r,
  me,
}: {
  i: number;
  r: RankRow;
  me: boolean;
}) {
  const medal = ["🥇", "🥈", "🥉"][i];
  return (
    <tr className={me ? "rounded bg-pitch-500/10" : ""}>
      <td className="w-8 py-1.5 font-bold text-slate-400">{medal ?? i + 1}</td>
      <td className="py-1.5 font-medium text-white">
        {r.display_name}
        {me && (
          <span className="ml-2 rounded bg-pitch-500/20 px-1.5 py-0.5 text-[10px] text-pitch-500">
            tú
          </span>
        )}
      </td>
      <td className="py-1.5 text-right text-lg font-black tabular-nums text-white">
        {r.points}
      </td>
    </tr>
  );
}
