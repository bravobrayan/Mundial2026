import { Flag } from "./Flag";
import type { MyResultRow } from "@/lib/quiniela/myResults";

const fmt = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Caracas",
});

function pointStyle(p: number) {
  if (p >= 5) return "bg-pitch-500/20 text-pitch-500";
  if (p === 3) return "bg-pitch-500/15 text-pitch-400";
  if (p === 1) return "bg-gold-400/20 text-gold-400";
  return "bg-white/5 text-slate-500";
}

export function MyResults({ rows }: { rows: MyResultRow[] }) {
  if (rows.length === 0)
    return (
      <p className="rounded-2xl border border-white/10 bg-navy-900/50 px-4 py-5 text-center text-sm text-slate-400">
        Todavía no hay partidos jugados con resultado. Aquí verás tu pronóstico,
        el marcador real y los puntos que sacaste.
      </p>
    );

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <div
          key={r.matchId}
          className="rounded-xl border border-white/10 bg-navy-900/50 p-3.5"
        >
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium text-gold-400">
              {r.grp ? `Grupo ${r.grp}` : r.label}
            </span>
            <span>{fmt.format(new Date(r.kickoff))}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Equipos + marcador real */}
            <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex items-center justify-end gap-2 text-right">
                <span className="truncate text-sm font-semibold text-white">
                  {r.home?.name ?? "—"}
                </span>
                <Flag flag={r.home?.flag} className="w-5" />
              </div>
              <span className="rounded bg-navy-950 px-2 py-1 text-sm font-black tabular-nums text-white">
                {r.real.home}-{r.real.away}
              </span>
              <div className="flex items-center gap-2 text-left">
                <Flag flag={r.away?.flag} className="w-5" />
                <span className="truncate text-sm font-semibold text-white">
                  {r.away?.name ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-xs">
            <span className="text-slate-400">
              Tu pronóstico:{" "}
              <span className="font-mono tabular-nums text-slate-200">
                {r.pred.home}-{r.pred.away}
              </span>
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${pointStyle(r.points)}`}
            >
              {r.points > 0 ? `+${r.points}` : "0"} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
