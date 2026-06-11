import { Flag } from "./Flag";

export type LiveBannerMatch = {
  id: number;
  grp: string | null;
  label: string | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

/** Banner del/los partido(s) en vivo (solo el marcador). Para el Home. */
export function LiveMatchBanner({
  matches,
  results,
}: {
  matches: LiveBannerMatch[];
  results: Map<number, { home_goals: number; away_goals: number }>;
}) {
  if (matches.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {matches.map((m) => {
        const r = results.get(m.id);
        return (
          <div
            key={m.id}
            className="rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-500/10 to-transparent p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                En vivo
              </span>
              <span className="text-[11px] text-slate-400">
                {m.grp ? `Grupo ${m.grp}` : m.label}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex items-center justify-end gap-2 text-right">
                <Flag flag={m.home?.flag} className="w-7" />
                <span className="font-semibold text-white">{m.home?.name}</span>
              </div>
              <span className="rounded-lg bg-navy-950 px-3 py-1.5 text-xl font-black tabular-nums text-white">
                {r ? `${r.home_goals} - ${r.away_goals}` : "vs"}
              </span>
              <div className="flex items-center gap-2 text-left">
                <span className="font-semibold text-white">{m.away?.name}</span>
                <Flag flag={m.away?.flag} className="w-7" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
