"use client";

import { useState, useTransition } from "react";
import type { PredMap } from "@/lib/quiniela/types";
import { isMatchLocked } from "@/lib/quiniela/lock";
import { Flag } from "@/components/Flag";
import { saveKnockout } from "./actions";

export type KnockoutMatch = {
  id: number;
  stage: string;
  label: string | null;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

const ROUNDS: { key: string; label: string }[] = [
  { key: "r32", label: "Dieciseisavos de final" },
  { key: "r16", label: "Octavos de final" },
  { key: "qf", label: "Cuartos de final" },
  { key: "sf", label: "Semifinales" },
  { key: "third", label: "Tercer puesto" },
  { key: "final", label: "Final" },
];

const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export function KnockoutEditor({
  matches,
  initialPreds,
}: {
  matches: KnockoutMatch[];
  initialPreds: PredMap;
}) {
  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function setScore(id: number, side: "home" | "away", v: string) {
    const n = v === "" ? null : Math.max(0, Math.min(99, Number(v)));
    setPreds((prev) => ({ ...prev, [id]: { ...prev[id], [side]: n } }));
  }

  function onSave() {
    setMsg(null);
    const defined = matches.filter(
      (m) => m.home_team_id != null && m.away_team_id != null,
    );
    start(async () => {
      const res = await saveKnockout({
        predictions: defined.map((m) => ({
          matchId: m.id,
          home: preds[m.id]?.home ?? null,
          away: preds[m.id]?.away ?? null,
        })),
      });
      setMsg(
        res.ok
          ? { ok: true, text: "Pronósticos guardados ✓" }
          : { ok: false, text: res.error },
      );
    });
  }

  const anyDefined = matches.some(
    (m) => m.home_team_id != null && m.away_team_id != null,
  );

  return (
    <div>
      <div className="flex flex-col gap-8">
        {ROUNDS.map((round) => {
          const list = matches.filter((m) => m.stage === round.key);
          if (list.length === 0) return null;
          return (
            <section key={round.key}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gold-400">
                {round.label}
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {list.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    pred={preds[m.id] ?? { home: null, away: null }}
                    onScore={setScore}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {anyDefined && (
        <div className="sticky bottom-4 mt-8">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-navy-900/90 p-3 backdrop-blur">
            <button
              onClick={onSave}
              disabled={pending}
              className="w-full rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar pronósticos"}
            </button>
            {msg && (
              <p
                className={`mt-2 text-center text-sm ${
                  msg.ok ? "text-pitch-500" : "text-red-300"
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match,
  pred,
  onScore,
}: {
  match: KnockoutMatch;
  pred: { home: number | null; away: number | null };
  onScore: (id: number, side: "home" | "away", v: string) => void;
}) {
  const defined = match.home_team_id != null && match.away_team_id != null;
  const lock = isMatchLocked(match.kickoff);

  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 p-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>{match.label}</span>
        <span>
          {fmt.format(new Date(match.kickoff))}
          {lock ? " · 🔒" : ""}
        </span>
      </div>

      {defined ? (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <span className="flex items-center justify-end gap-1.5 text-right text-sm font-medium text-white">
            <Flag flag={match.home?.flag} className="w-6" /> {match.home?.name}
          </span>
          <div className="flex items-center gap-1.5">
            <Score
              value={pred.home}
              onChange={(v) => onScore(match.id, "home", v)}
              disabled={lock}
            />
            <span className="text-slate-500">-</span>
            <Score
              value={pred.away}
              onChange={(v) => onScore(match.id, "away", v)}
              disabled={lock}
            />
          </div>
          <span className="flex items-center gap-1.5 text-left text-sm font-medium text-white">
            {match.away?.name} <Flag flag={match.away?.flag} className="w-6" />
          </span>
        </div>
      ) : (
        <div className="py-3 text-center text-sm text-slate-500">
          Por definir — disponible cuando se conozca el cruce
        </div>
      )}
    </div>
  );
}

function Score({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-10 rounded-lg border border-white/10 bg-navy-950 text-center text-lg font-bold text-white outline-none focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 disabled:opacity-50"
    />
  );
}
