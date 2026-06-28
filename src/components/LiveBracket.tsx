"use client";

import { useState } from "react";
import { Flag } from "@/components/Flag";
import { WINNER_TO, LOSER_TO } from "@/lib/quiniela/bracket";

export type BracketMatch = {
  id: number;
  stage: string;
  label: string | null;
  kickoff: string;
  homeId: number | null;
  awayId: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
  result: {
    home: number;
    away: number;
    advance: number | null;
    finished: boolean;
  } | null;
};

const TABS: { key: string; label: string; ids: number[] }[] = [
  { key: "r32", label: "16avos", ids: [73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88] },
  { key: "r16", label: "Octavos", ids: [89, 90, 91, 92, 93, 94, 95, 96] },
  { key: "qf", label: "Cuartos", ids: [97, 98, 99, 100] },
  { key: "sf", label: "Semis", ids: [101, 102] },
  { key: "final", label: "Final", ids: [104, 103] }, // final + 3er puesto
];

const ROUND_NAME: Record<string, string> = {
  r32: "16avos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semis",
  third: "3er puesto",
  final: "Final",
};

const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

// Inverso del bracket para los placeholders ("Gan. 16avos 3", "Perd. Semis 1").
const SLOT_SOURCE = new Map<string, { src: number; kind: "G" | "P" }>();
for (const [src, t] of Object.entries(WINNER_TO))
  SLOT_SOURCE.set(`${t.match}:${t.slot}`, { src: Number(src), kind: "G" });
for (const [src, t] of Object.entries(LOSER_TO))
  SLOT_SOURCE.set(`${t.match}:${t.slot}`, { src: Number(src), kind: "P" });

function winnerOf(m: BracketMatch): number | null {
  const r = m.result;
  if (!r) return null;
  if (r.home > r.away) return m.homeId;
  if (r.away > r.home) return m.awayId;
  return r.advance ?? null;
}

export function LiveBracket({ matches }: { matches: BracketMatch[] }) {
  const map = new Map(matches.map((m) => [m.id, m]));
  const labelOf = (id: number) => {
    const m = map.get(id);
    if (!m) return `#${id}`;
    const n = (m.label ?? "").match(/\d+/)?.[0] ?? "";
    return `${ROUND_NAME[m.stage] ?? m.stage} ${n}`.trim();
  };

  // Ronda inicial: la más avanzada que ya tenga algún equipo definido.
  const deepestWithTeams = (() => {
    for (let i = TABS.length - 1; i >= 0; i--) {
      const has = TABS[i].ids.some((id) => {
        const m = map.get(id);
        return m && (m.homeId != null || m.awayId != null);
      });
      if (has) return TABS[i].key;
    }
    return "r32";
  })();
  const [active, setActive] = useState(deepestWithTeams);

  const final = map.get(104);
  const champId = final ? winnerOf(final) : null;
  const champ =
    champId === final?.homeId
      ? final?.home
      : champId === final?.awayId
        ? final?.away
        : null;

  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <div>
      {champ && (
        <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl border border-gold-400/40 bg-gradient-to-b from-gold-400/15 to-navy-900/40 px-6 py-4">
          <span className="text-3xl">🏆</span>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-widest text-gold-400">
              Campeón del Mundo
            </div>
            <div className="flex items-center justify-center gap-2 text-2xl font-black text-white">
              <Flag flag={champ.flag} className="w-8 rounded-sm" /> {champ.name}
            </div>
          </div>
        </div>
      )}

      {/* Pestañas de ronda */}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const played = t.ids.some((id) => map.get(id)?.result?.finished);
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-pitch-500 text-navy-950"
                  : "border border-white/10 bg-navy-900/60 text-slate-200 hover:bg-navy-800"
              }`}
            >
              {t.label}
              {played && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-navy-950/50" : "bg-pitch-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Final: layout especial (final destacada + 3er puesto) */}
      {activeTab.key === "final" ? (
        <div className="mx-auto flex max-w-md flex-col gap-5">
          {final && (
            <div>
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-gold-400">
                Final
              </p>
              <MatchCard
                m={final}
                labelOf={labelOf}
                winnerOf={winnerOf}
                highlight
              />
            </div>
          )}
          {map.get(103) && (
            <div>
              <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Tercer puesto
              </p>
              <MatchCard m={map.get(103)!} labelOf={labelOf} winnerOf={winnerOf} />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeTab.ids.map((id) => {
            const m = map.get(id);
            if (!m) return null;
            return (
              <MatchCard key={id} m={m} labelOf={labelOf} winnerOf={winnerOf} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  m,
  labelOf,
  winnerOf,
  highlight,
}: {
  m: BracketMatch;
  labelOf: (id: number) => string;
  winnerOf: (m: BracketMatch) => number | null;
  highlight?: boolean;
}) {
  const win = winnerOf(m);
  const isPenalties =
    m.result != null && m.result.home === m.result.away && m.result.finished;

  const placeholder = (slot: "home" | "away") => {
    const s = SLOT_SOURCE.get(`${m.id}:${slot}`);
    if (!s) return "Por definir";
    return `${s.kind === "G" ? "Gan." : "Perd."} ${labelOf(s.src)}`;
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-gradient-to-b from-navy-900/70 to-navy-900/40 ${
        highlight ? "border-gold-400/50 ring-1 ring-gold-400/20" : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-[11px] text-slate-400">
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-slate-300">
          {m.label}
        </span>
        <span>{fmt.format(new Date(m.kickoff))}</span>
      </div>
      <div className="px-4 py-2.5">
        <TeamRow
          team={m.home}
          placeholder={placeholder("home")}
          win={win != null && win === m.homeId}
          lose={win != null && win !== m.homeId && m.homeId != null}
          score={m.result?.home}
          pen={isPenalties && win === m.homeId}
        />
        <div className="my-1 h-px bg-white/5" />
        <TeamRow
          team={m.away}
          placeholder={placeholder("away")}
          win={win != null && win === m.awayId}
          lose={win != null && win !== m.awayId && m.awayId != null}
          score={m.result?.away}
          pen={isPenalties && win === m.awayId}
        />
      </div>
    </div>
  );
}

function TeamRow({
  team,
  placeholder,
  win,
  lose,
  score,
  pen,
}: {
  team: { name: string; flag: string | null } | null;
  placeholder: string;
  win: boolean;
  lose: boolean;
  score?: number;
  pen: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {team ? (
        <Flag flag={team.flag} className="w-7 shrink-0 rounded-sm" />
      ) : (
        <span className="h-5 w-7 shrink-0" />
      )}
      <span
        className={`flex-1 truncate ${
          win
            ? "font-bold text-white"
            : team
              ? lose
                ? "text-slate-500"
                : "text-slate-200"
              : "italic text-slate-600"
        }`}
      >
        {team ? team.name : placeholder}
        {pen && (
          <span className="ml-1.5 rounded bg-gold-400/15 px-1 py-0.5 text-[10px] font-semibold text-gold-400">
            pasa por penales
          </span>
        )}
      </span>
      {win && <span className="shrink-0 text-pitch-500">✓</span>}
      {score != null && (
        <span
          className={`w-6 shrink-0 text-center text-xl tabular-nums ${
            win ? "font-black text-white" : "text-slate-400"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
