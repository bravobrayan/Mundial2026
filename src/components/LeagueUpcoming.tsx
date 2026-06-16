"use client";

import { useState } from "react";
import { Flag } from "./Flag";
import { arePredsRevealed } from "@/lib/quiniela/lock";
import type { CarouselMatch } from "./MatchCarousel";

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

export type UpcomingPred = {
  user_id: string;
  display_name: string;
  home_goals: number | null;
  away_goals: number | null;
  revealed: boolean;
};

/**
 * Carrusel de próximos partidos con opción de ver los pronósticos de todos.
 * Solo se pueden ver cuando ya no son editables (grupos cerrados); las
 * eliminatorias siguen ocultas hasta su kickoff.
 */
export function LeagueUpcoming({
  matches,
  preds,
  meId,
}: {
  matches: CarouselMatch[];
  preds: Record<number, UpcomingPred[]>;
  meId: string;
}) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (matches.length === 0)
    return (
      <p className="text-sm text-slate-400">No hay partidos próximos por ahora.</p>
    );

  const open = openId != null ? matches.find((m) => m.id === openId) : null;
  const openPreds = (openId != null ? preds[openId] : [])?.filter(
    (p) => p.revealed && p.home_goals != null,
  );

  return (
    <>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
        {matches.map((m) => {
          const revealable = arePredsRevealed(!!m.grp, m.kickoff);
          const shown = (preds[m.id] ?? []).filter(
            (p) => p.revealed && p.home_goals != null,
          );
          return (
            <div
              key={m.id}
              className="flex w-[80%] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-navy-800/70 to-navy-900/50 p-5 sm:w-[47%]"
            >
              <div className="mb-4 flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-gold-400">
                  {m.grp ? `Grupo ${m.grp}` : m.label}
                </span>
                <span className="text-slate-400">
                  {fmtDay.format(new Date(m.kickoff))}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <TeamCol team={m.home} />
                <div className="flex flex-col items-center">
                  <span className="rounded-xl bg-white/10 px-3.5 py-2 text-lg font-black tabular-nums text-white">
                    {fmtHour.format(new Date(m.kickoff))}
                  </span>
                  <span className="mt-1.5 text-[11px] font-bold tracking-widest text-slate-500">
                    VS
                  </span>
                </div>
                <TeamCol team={m.away} />
              </div>

              {m.stadium && (
                <div className="mt-4 truncate text-center text-xs text-slate-500">
                  📍 {m.stadium}
                </div>
              )}

              <div className="mt-4">
                {revealable ? (
                  <button
                    type="button"
                    onClick={() => setOpenId(m.id)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    👁️ Ver pronósticos ({shown.length})
                  </button>
                ) : (
                  <p className="text-center text-[11px] text-slate-500">
                    🔒 Se revelan al empezar
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pop-up de pronósticos */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-navy-900 p-5 sm:max-w-md sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400">
                {open.grp ? `Grupo ${open.grp}` : open.label}
              </span>
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 flex items-center justify-center gap-3 text-sm font-semibold text-white">
              <span className="flex items-center gap-2">
                <Flag flag={open.home?.flag} className="w-6" />
                {open.home?.name}
              </span>
              <span className="text-slate-500">vs</span>
              <span className="flex items-center gap-2">
                {open.away?.name}
                <Flag flag={open.away?.flag} className="w-6" />
              </span>
            </div>

            {!openPreds || openPreds.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                Nadie ha pronosticado este partido.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {openPreds
                  .slice()
                  .sort((a, b) => a.display_name.localeCompare(b.display_name))
                  .map((p) => (
                    <div
                      key={p.user_id}
                      className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                        p.user_id === meId ? "bg-pitch-500/10" : ""
                      }`}
                    >
                      <span className="text-slate-200">
                        {p.display_name}
                        {p.user_id === meId && (
                          <span className="ml-2 text-[10px] text-pitch-500">
                            tú
                          </span>
                        )}
                      </span>
                      <span className="font-mono tabular-nums text-white">
                        {p.home_goals}-{p.away_goals}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TeamCol({
  team,
}: {
  team: { name: string; flag: string | null } | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      {team ? (
        <>
          <Flag flag={team.flag} className="w-12" />
          <span className="line-clamp-2 text-sm font-semibold leading-tight text-white">
            {team.name}
          </span>
        </>
      ) : (
        <span className="text-sm text-slate-500">Por definir</span>
      )}
    </div>
  );
}
