import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/Flag";
import { AutoRefresh } from "@/components/AutoRefresh";
import { arePredsRevealed } from "@/lib/quiniela/lock";

type BoardRow = {
  match_id: number;
  user_id: string;
  display_name: string;
  home_goals: number | null;
  away_goals: number | null;
  points: number | null;
  revealed: boolean;
  advance_name: string | null;
  advance_flag: string | null;
};

type MatchRow = {
  id: number;
  grp: string | null;
  label: string | null;
  kickoff: string;
  stadium: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export default async function PartidosPage({
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

  const since = new Date(Date.now() - 2 * 86_400_000).toISOString();

  // Primero los partidos a mostrar, para pedir SOLO esos pronósticos
  const { data: matchesData } = await supabase
    .from("matches")
    .select(
      "id, grp, label, kickoff, stadium, home_team_id, away_team_id, home:home_team_id(name,flag), away:away_team_id(name,flag)",
    )
    .gte("kickoff", since)
    .order("kickoff")
    .limit(18);
  const matches = (matchesData ?? []) as unknown as MatchRow[];
  const matchIds = matches.length ? matches.map((m) => m.id) : [-1];

  const [{ data: board }, { count: members }, { data: resultsData }, { data: profile }] =
    await Promise.all([
      supabase.rpc("league_board", { p_league: id, p_matches: matchIds }),
      supabase
        .from("league_members")
        .select("user_id", { count: "exact", head: true })
        .eq("league_id", id),
      supabase
        .from("results")
        .select("match_id, home_goals, away_goals, advance_team_id")
        .in("match_id", matchIds),
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
  const isAdmin = profile?.is_admin ?? false;

  const rows = (board ?? []) as BoardRow[];
  const byMatch = new Map<number, BoardRow[]>();
  for (const r of rows) {
    const arr = byMatch.get(r.match_id) ?? [];
    arr.push(r);
    byMatch.set(r.match_id, arr);
  }
  const results = new Map<
    number,
    { home_goals: number; away_goals: number; advance_team_id: number | null }
  >(
    (resultsData ?? []).map((r) => [
      r.match_id,
      {
        home_goals: r.home_goals,
        away_goals: r.away_goals,
        advance_team_id: r.advance_team_id ?? null,
      },
    ]),
  );

  const now = Date.now();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <AutoRefresh />
      <h1 className="text-2xl font-black text-white">Partidos de la liga</h1>
      <p className="mb-6 text-sm text-slate-400">
        {isAdmin ? (
          <>
            Como <strong className="text-gold-400">admin</strong> ves todos los
            pronósticos desde que se ingresan; para los demás se revelan al
            empezar el partido. 👁️
          </>
        ) : (
          <>
            Los pronósticos de cada quien se{" "}
            <strong className="text-white">revelan al empezar el partido</strong>{" "}
            (antes solo ves cuántos ya jugaron). 🔥
          </>
        )}
      </p>

      <div className="flex flex-col gap-4">
        {matches.map((m) => {
          const preds = byMatch.get(m.id) ?? [];
          const locked = now >= new Date(m.kickoff).getTime();
          const revealedToAll = arePredsRevealed(!!m.grp, m.kickoff, now);
          const showAll = revealedToAll || isAdmin;
          const result = results.get(m.id);
          // Equipo que pasó por penales en el resultado real (empate).
          const advTeam =
            result == null ||
            result.advance_team_id == null ||
            result.home_goals !== result.away_goals
              ? null
              : result.advance_team_id === m.home_team_id
                ? m.home
                : result.advance_team_id === m.away_team_id
                  ? m.away
                  : null;
          const mine = preds.find((p) => p.user_id === user.id);
          const revealed = preds
            .filter((p) => p.revealed)
            .sort((a, b) => (b.points ?? -1) - (a.points ?? -1));

          return (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-navy-900/50 p-4"
            >
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-gold-400">
                  {m.grp ? `Grupo ${m.grp}` : m.label}
                </span>
                <span>
                  {fmt.format(new Date(m.kickoff))}
                  {locked ? " · 🔒 jugado/en curso" : ""}
                </span>
              </div>

              {/* Marcador */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex items-center justify-end gap-2 text-right">
                  <Flag flag={m.home?.flag} className="w-6" />
                  <span className="text-sm font-semibold text-white">
                    {m.home?.name ?? "Por definir"}
                  </span>
                </div>
                <span className="rounded bg-navy-950 px-2 py-1 text-sm font-black tabular-nums text-white">
                  {result ? `${result.home_goals}-${result.away_goals}` : "vs"}
                </span>
                <div className="flex items-center gap-2 text-left">
                  <span className="text-sm font-semibold text-white">
                    {m.away?.name ?? "Por definir"}
                  </span>
                  <Flag flag={m.away?.flag} className="w-6" />
                </div>
              </div>

              {advTeam && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gold-400">
                  <Flag flag={advTeam.flag} className="w-4" />
                  <span>
                    <strong>{advTeam.name}</strong> pasó por penales
                  </span>
                </div>
              )}

              {/* Pronósticos */}
              <div className="mt-3 border-t border-white/5 pt-3">
                {preds.length === 0 ? (
                  <p className="text-center text-xs text-slate-500">
                    Nadie ha pronosticado aún.
                  </p>
                ) : !showAll ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {mine
                        ? `Tu pronóstico: ${mine.home_goals}-${mine.away_goals}`
                        : "Aún no has pronosticado"}
                    </span>
                    <span className="text-slate-500">
                      🔒 {preds.length} de {members ?? preds.length} ya jugaron ·
                      se revelan al empezar
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {!revealedToAll && (
                      <p className="text-[11px] text-gold-400">
                        👁️ Vista admin: los demás aún no ven estos pronósticos
                      </p>
                    )}
                    {revealed.map((p) => (
                      <div
                        key={p.user_id}
                        className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${
                          p.user_id === user.id ? "bg-pitch-500/10" : ""
                        }`}
                      >
                        <span className="text-slate-200">
                          {p.display_name}
                          {p.user_id === user.id && (
                            <span className="ml-2 text-[10px] text-pitch-500">
                              tú
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-2">
                          {p.home_goals === p.away_goals && p.advance_name && (
                            <span className="flex items-center gap-1 rounded bg-gold-400/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-400">
                              <Flag flag={p.advance_flag} className="w-3.5" />
                              <span className="hidden sm:inline">pasa</span>{" "}
                              {p.advance_name}
                            </span>
                          )}
                          <span className="font-mono tabular-nums text-white">
                            {p.home_goals}-{p.away_goals}
                          </span>
                          {p.points != null && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                p.points >= 3
                                  ? "bg-pitch-500/20 text-pitch-500"
                                  : p.points === 1
                                    ? "bg-gold-400/20 text-gold-400"
                                    : "bg-white/5 text-slate-400"
                              }`}
                            >
                              +{p.points}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {matches.length === 0 && (
          <p className="text-center text-slate-400">
            No hay partidos próximos por ahora.
          </p>
        )}
      </div>
    </main>
  );
}
