"use client";

import { useState, useTransition } from "react";
import type { PredMap } from "@/lib/quiniela/types";
import { isMatchLocked } from "@/lib/quiniela/lock";
import { Flag } from "@/components/Flag";
import { saveKnockout } from "@/app/liga/actions";

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
  leagueId,
  matches,
  initialPreds,
  openStages,
}: {
  leagueId: string;
  matches: KnockoutMatch[];
  initialPreds: PredMap;
  /** Rondas habilitadas por el admin (p.ej. ["r32"]). */
  openStages: string[];
}) {
  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Partidos con empate SIN pick de penales (se marcan en rojo al guardar).
  const [penErrors, setPenErrors] = useState<Set<number>>(new Set());
  const open = new Set(openStages);

  // Rondas cuyos partidos YA se jugaron todos arrancan plegadas,
  // para que la ronda por llenar quede protagonista.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const c: Record<string, boolean> = {};
    for (const r of ROUNDS) {
      const list = matches.filter((m) => m.stage === r.key);
      if (list.length > 0 && list.every((m) => isMatchLocked(m.kickoff)))
        c[r.key] = true;
    }
    return c;
  });
  const toggleRound = (key: string) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  function setScore(id: number, side: "home" | "away", v: string) {
    const n = v === "" ? null : Math.max(0, Math.min(99, Number(v)));
    setPreds((prev) => {
      const cur = prev[id] ?? { home: null, away: null };
      const next = { ...cur, [side]: n };
      // Si deja de ser empate, limpiamos la selección de penales.
      if (next.home == null || next.away == null || next.home !== next.away)
        next.advance = null;
      return { ...prev, [id]: next };
    });
  }

  function setAdvance(id: number, teamId: number) {
    setPreds((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { home: null, away: null }), advance: teamId },
    }));
    setPenErrors((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function onSave() {
    setMsg(null);
    const defined = matches.filter(
      (m) =>
        open.has(m.stage) &&
        m.home_team_id != null &&
        m.away_team_id != null,
    );

    // Regla: si predices empate, es OBLIGATORIO elegir quién pasa por penales.
    const missingPen = defined.filter((m) => {
      if (isMatchLocked(m.kickoff)) return false;
      const p = preds[m.id];
      return (
        p?.home != null &&
        p?.away != null &&
        p.home === p.away &&
        p.advance == null
      );
    });
    if (missingPen.length > 0) {
      setPenErrors(new Set(missingPen.map((m) => m.id)));
      setMsg({
        ok: false,
        text: `⚠️ Pusiste empate sin elegir quién pasa por penales en: ${missingPen
          .map((m) => `${m.home?.name} vs ${m.away?.name}`)
          .join(", ")}.`,
      });
      return;
    }
    setPenErrors(new Set());

    start(async () => {
      const res = await saveKnockout({
        leagueId,
        predictions: defined.map((m) => ({
          matchId: m.id,
          home: preds[m.id]?.home ?? null,
          away: preds[m.id]?.away ?? null,
          advance: preds[m.id]?.advance ?? null,
        })),
      });
      setMsg(
        res.ok
          ? { ok: true, text: "Pronósticos guardados ✓" }
          : { ok: false, text: res.error },
      );
    });
  }

  const anyOpenDefined = matches.some(
    (m) =>
      open.has(m.stage) && m.home_team_id != null && m.away_team_id != null,
  );

  return (
    <div>
      <div className="flex flex-col gap-8">
        {ROUNDS.map((round) => {
          const list = matches
            .filter((m) => m.stage === round.key)
            .sort(
              (a, b) =>
                new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime(),
            );
          if (list.length === 0) return null;
          const isOpen = open.has(round.key);
          const isCollapsed = collapsed[round.key] ?? false;
          const allPlayed =
            list.length > 0 && list.every((m) => isMatchLocked(m.kickoff));
          return (
            <section key={round.key}>
              <button
                type="button"
                onClick={() => isOpen && toggleRound(round.key)}
                disabled={!isOpen}
                aria-expanded={!isCollapsed}
                className="mb-4 flex w-full items-center gap-3 text-left"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
                  {round.label}
                </h2>
                {allPlayed && (
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    ✓ jugada
                  </span>
                )}
                <div className="h-px flex-1 bg-gradient-to-r from-gold-400/30 to-transparent" />
                {!isOpen ? (
                  <span className="text-slate-500">🔒</span>
                ) : (
                  <span className="text-xs text-slate-400">
                    {isCollapsed ? "▸ mostrar" : "▾ ocultar"}
                  </span>
                )}
              </button>
              {isOpen ? (
                isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleRound(round.key)}
                    className="w-full rounded-2xl border border-white/10 bg-navy-900/40 px-4 py-3 text-center text-sm text-slate-400 transition hover:bg-navy-900/70"
                  >
                    {list.length} partidos {allPlayed ? "jugados" : ""} · toca
                    para ver ▾
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    {list.map((m) => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        pred={preds[m.id] ?? { home: null, away: null }}
                        onScore={setScore}
                        onAdvance={setAdvance}
                        penError={penErrors.has(m.id)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-navy-900/40 px-4 py-6 text-center text-sm text-slate-500">
                  🔒 Se abre cuando termine la ronda anterior.
                </div>
              )}
            </section>
          );
        })}
      </div>

      {anyOpenDefined && (
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
  onAdvance,
  penError = false,
}: {
  match: KnockoutMatch;
  pred: { home: number | null; away: number | null; advance?: number | null };
  onScore: (id: number, side: "home" | "away", v: string) => void;
  onAdvance: (id: number, teamId: number) => void;
  penError?: boolean;
}) {
  const defined = match.home_team_id != null && match.away_team_id != null;
  const lock = isMatchLocked(match.kickoff);
  const isDraw =
    pred.home != null && pred.away != null && pred.home === pred.away;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-navy-900/70 to-navy-900/40 transition hover:border-white/20">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-[11px] font-medium text-slate-400">
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-slate-300">
          {match.label}
        </span>
        <span className="flex items-center gap-1.5">
          {fmt.format(new Date(match.kickoff))}
          {lock && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">
              🔒 cerrado
            </span>
          )}
        </span>
      </div>

      {defined ? (
        <div className="px-4 py-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <div className="flex items-center justify-end gap-2.5 text-right">
              <span className="text-sm font-semibold leading-tight text-white sm:text-base">
                {match.home?.name}
              </span>
              <Flag
                flag={match.home?.flag}
                className="w-9 shrink-0 rounded-sm shadow-sm ring-1 ring-white/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Score
                value={pred.home}
                onChange={(v) => onScore(match.id, "home", v)}
                disabled={lock}
                label={`Goles ${match.home?.name ?? "local"}`}
              />
              <span className="text-lg font-black text-slate-600">:</span>
              <Score
                value={pred.away}
                onChange={(v) => onScore(match.id, "away", v)}
                disabled={lock}
                label={`Goles ${match.away?.name ?? "visitante"}`}
              />
            </div>

            <div className="flex items-center gap-2.5 text-left">
              <Flag
                flag={match.away?.flag}
                className="w-9 shrink-0 rounded-sm shadow-sm ring-1 ring-white/10"
              />
              <span className="text-sm font-semibold leading-tight text-white sm:text-base">
                {match.away?.name}
              </span>
            </div>
          </div>

          {isDraw && (
            <div
              className={`mt-4 rounded-xl border p-3 ${
                penError
                  ? "border-red-500/60 bg-red-500/10 ring-1 ring-red-500/30"
                  : "border-gold-400/20 bg-gold-400/[0.06]"
              }`}
            >
              <p
                className={`mb-2.5 text-center text-[11px] font-semibold uppercase tracking-wider ${
                  penError ? "text-red-300" : "text-gold-400"
                }`}
              >
                {penError ? "⚠️ Obligatorio: " : "Empate — "}¿quién pasa por
                penales? <span className="text-pitch-500">+3</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <AdvanceButton
                  active={pred.advance === match.home_team_id}
                  disabled={lock}
                  onClick={() => onAdvance(match.id, match.home_team_id!)}
                  name={match.home?.name}
                  flag={match.home?.flag}
                />
                <AdvanceButton
                  active={pred.advance === match.away_team_id}
                  disabled={lock}
                  onClick={() => onAdvance(match.id, match.away_team_id!)}
                  name={match.away?.name}
                  flag={match.away?.flag}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-slate-500">
          Por definir — disponible cuando se conozca el cruce
        </div>
      )}
    </div>
  );
}

function AdvanceButton({
  active,
  disabled,
  onClick,
  name,
  flag,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  name?: string;
  flag?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? "border-pitch-500 bg-pitch-500/20 text-white ring-1 ring-pitch-500/40"
          : "border-white/10 bg-navy-950 text-slate-300 hover:border-white/25 hover:bg-white/5"
      }`}
    >
      <Flag flag={flag} className="w-5 shrink-0 rounded-sm" />
      <span className="truncate">{name}</span>
      {active && <span className="text-pitch-500">✓</span>}
    </button>
  );
}

function Score({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number | null;
  onChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value ?? ""}
      disabled={disabled}
      aria-label={label}
      placeholder="–"
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-12 rounded-xl border border-white/15 bg-navy-950 text-center text-2xl font-black text-white outline-none transition placeholder:text-slate-700 focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-14"
    />
  );
}
