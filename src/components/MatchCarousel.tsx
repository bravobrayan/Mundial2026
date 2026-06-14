import { Flag } from "./Flag";

const fmtDay = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: "America/Caracas",
});
const fmtHour = new Intl.DateTimeFormat("es-MX", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export type CarouselMatch = {
  id: number;
  grp: string | null;
  label: string | null;
  kickoff: string;
  stadium: string | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

/**
 * Carrusel horizontal de próximos partidos (estilo fixture de Mundial).
 * Tarjetas grandes con bandera, hora y estadio; scroll táctil sin barra.
 */
export function MatchCarousel({ matches }: { matches: CarouselMatch[] }) {
  if (matches.length === 0)
    return (
      <p className="text-sm text-slate-400">No hay partidos próximos por ahora.</p>
    );

  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
      {matches.map((m) => (
        <div
          key={m.id}
          className="w-[230px] shrink-0 snap-start rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/60 to-navy-900/50 p-4"
        >
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-gold-400">
              {m.grp ? `Grupo ${m.grp}` : m.label}
            </span>
            <span className="text-slate-500">
              {fmtDay.format(new Date(m.kickoff))}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <TeamCol team={m.home} />
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-navy-950 px-2.5 py-1 text-sm font-black tabular-nums text-white">
                {fmtHour.format(new Date(m.kickoff))}
              </span>
              <span className="mt-1 text-[10px] font-bold text-slate-600">
                VS
              </span>
            </div>
            <TeamCol team={m.away} />
          </div>

          {m.stadium && (
            <div className="mt-3 truncate text-center text-[11px] text-slate-500">
              📍 {m.stadium}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TeamCol({
  team,
}: {
  team: { name: string; flag: string | null } | null;
}) {
  return (
    <div className="flex w-1/3 flex-col items-center gap-1.5 text-center">
      {team ? (
        <>
          <Flag flag={team.flag} className="w-9" />
          <span className="line-clamp-2 text-xs font-semibold leading-tight text-white">
            {team.name}
          </span>
        </>
      ) : (
        <span className="text-xs text-slate-500">Por definir</span>
      )}
    </div>
  );
}
