import { Flag } from "./Flag";

const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export type UpcomingMatch = {
  id: number;
  grp: string | null;
  label: string | null;
  kickoff: string;
  stadium: string | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

export function UpcomingMatches({ matches }: { matches: UpcomingMatch[] }) {
  if (matches.length === 0)
    return (
      <p className="text-sm text-slate-400">
        No hay partidos próximos por ahora.
      </p>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {matches.map((m) => (
        <div
          key={m.id}
          className="rounded-xl border border-white/10 bg-navy-900/50 p-3.5"
        >
          <div className="mb-2.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-gold-400">
              {m.grp ? `Grupo ${m.grp}` : m.label}
            </span>
            <span>{fmt.format(new Date(m.kickoff))}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <Side team={m.home} align="left" />
            <span className="text-[11px] font-bold text-slate-600">VS</span>
            <Side team={m.away} align="right" />
          </div>
          {m.stadium && (
            <div className="mt-2 text-center text-[11px] text-slate-500">
              📍 {m.stadium}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Side({
  team,
  align,
}: {
  team: { name: string; flag: string | null } | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      {team ? (
        <>
          <Flag flag={team.flag} className="w-6" />
          <span className="truncate text-sm font-semibold text-white">
            {team.name}
          </span>
        </>
      ) : (
        <span className="text-sm text-slate-500">Por definir</span>
      )}
    </div>
  );
}
