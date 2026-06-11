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
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!league) redirect("/jugar");

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
  const topRanking = ranking.slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10">
      <AutoRefresh />
      <h1 className="text-3xl font-black text-white">{league.name}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {members ?? 1} {members === 1 ? "miembro" : "miembros"} · tu quiniela en
        esta liga
      </p>

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
        {topRanking.length === 0 ? (
          <p className="text-sm text-slate-500">Aún sin puntos cargados.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-2 py-3 text-left font-medium">Jugador</th>
                  <th className="px-2 py-3 text-center font-medium">PJ</th>
                  <th className="px-2 py-3 text-center font-medium">Exactos</th>
                  <th className="px-4 py-3 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {topRanking.map((r, i) => {
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
                      <td className="px-2 py-3 text-center tabular-nums text-slate-400">
                        {r.partidos}
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums text-slate-400">
                        {r.exactos}
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
