import { Flag } from "./Flag";

type Pred = {
  user_id: string;
  display_name: string;
  home_goals: number | null;
  away_goals: number | null;
  points: number | null;
  revealed: boolean;
};

export type LiveMatch = {
  id: number;
  grp: string | null;
  label: string | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

export function LiveMatchCard({
  match,
  members,
  preds,
  result,
  meId,
}: {
  match: LiveMatch;
  members: { user_id: string; display_name: string }[];
  preds: Pred[];
  result: { home_goals: number; away_goals: number } | undefined;
  meId: string;
}) {
  // Pronóstico (revelado) por usuario
  const predByUser = new Map(
    preds.filter((p) => p.revealed).map((p) => [p.user_id, p]),
  );
  // TODOS los miembros: primero quienes pronosticaron (por puntos), luego el resto
  const ordered = [...members].sort((a, b) => {
    const pa = predByUser.get(a.user_id);
    const pb = predByUser.get(b.user_id);
    const va = pa ? (pa.points ?? -1) : -2;
    const vb = pb ? (pb.points ?? -1) : -2;
    return vb - va;
  });

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          En vivo
        </span>
        <span className="text-[11px] text-slate-400">
          {match.grp ? `Grupo ${match.grp}` : match.label}
        </span>
      </div>

      {/* Marcador */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center justify-end gap-2 text-right">
          <Flag flag={match.home?.flag} className="w-7" />
          <span className="font-semibold text-white">{match.home?.name}</span>
        </div>
        <span className="rounded-lg bg-navy-950 px-3 py-1.5 text-xl font-black tabular-nums text-white">
          {result ? `${result.home_goals} - ${result.away_goals}` : "vs"}
        </span>
        <div className="flex items-center gap-2 text-left">
          <span className="font-semibold text-white">{match.away?.name}</span>
          <Flag flag={match.away?.flag} className="w-7" />
        </div>
      </div>

      {/* Pronósticos de la liga */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Pronósticos de la liga
        </div>
        {ordered.length === 0 ? (
          <p className="text-center text-xs text-slate-500">Sin miembros.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {ordered.map((m) => {
              const p = predByUser.get(m.user_id);
              const me = m.user_id === meId;
              return (
                <div
                  key={m.user_id}
                  className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${
                    me ? "bg-pitch-500/10" : ""
                  }`}
                >
                  <span className="text-slate-200">
                    {m.display_name}
                    {me && (
                      <span className="ml-2 text-[10px] text-pitch-500">tú</span>
                    )}
                  </span>
                  {p ? (
                    <span className="flex items-center gap-2">
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
                  ) : (
                    <span className="text-xs text-slate-600">no jugó</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
