"use client";

import { useMemo, useState, useTransition } from "react";
import type { Match, PredMap, Team } from "@/lib/quiniela/types";
import { computeRows, sortStanding } from "@/lib/quiniela/standings";
import { Flag } from "@/components/Flag";
import { saveGroup } from "@/app/liga/actions";

const fmt = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Caracas", // UTC-4, igual que el Excel
});

export function GroupEditor({
  leagueId,
  grupo,
  teams,
  matches,
  initialPreds,
  initialOrder,
  locked,
}: {
  leagueId: string;
  grupo: string;
  teams: Team[];
  matches: Match[];
  initialPreds: PredMap;
  initialOrder: number[];
  locked: boolean;
}) {
  const teamById = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t])) as Record<number, Team>,
    [teams],
  );
  const teamIds = useMemo(() => teams.map((t) => t.id), [teams]);

  const [preds, setPreds] = useState<PredMap>(initialPreds);
  const [manualOrder, setManualOrder] = useState<number[]>(
    initialOrder.length === teamIds.length ? initialOrder : teamIds,
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const rows = useMemo(
    () => computeRows(teamIds, matches, preds),
    [teamIds, matches, preds],
  );
  const sorted = useMemo(
    () => sortStanding(teamIds, rows, manualOrder),
    [teamIds, rows, manualOrder],
  );

  function setScore(matchId: number, side: "home" | "away", value: string) {
    const n = value === "" ? null : Math.max(0, Math.min(99, Number(value)));
    setPreds((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: n },
    }));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    if (rows[sorted[i]].pts !== rows[sorted[j]].pts) return; // solo dentro de empate de puntos
    const next = [...sorted];
    [next[i], next[j]] = [next[j], next[i]];
    setManualOrder(next);
  }

  function onSave() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveGroup({
        leagueId,
        grupo,
        matchIds: matches.map((m) => m.id),
        predictions: matches.map((m) => ({
          matchId: m.id,
          home: preds[m.id]?.home ?? null,
          away: preds[m.id]?.away ?? null,
        })),
        order: sorted,
      });
      setMsg(
        res.ok
          ? { ok: true, text: "Grupo guardado ✓" }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* Partidos */}
      <div className="flex flex-col gap-3">
        {matches.map((m) => {
          const home = teamById[m.home_team_id!];
          const away = teamById[m.away_team_id!];
          const p = preds[m.id] ?? { home: null, away: null };
          return (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-navy-900/50 p-3"
            >
              <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  J{m.matchday} · {fmt.format(new Date(m.kickoff))}
                </span>
                <span>{m.stadium}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <TeamSide team={home} align="right" />
                <div className="flex items-center gap-1.5">
                  <Score
                    value={p.home}
                    onChange={(v) => setScore(m.id, "home", v)}
                    disabled={locked}
                  />
                  <span className="text-slate-500">-</span>
                  <Score
                    value={p.away}
                    onChange={(v) => setScore(m.id, "away", v)}
                    disabled={locked}
                  />
                </div>
                <TeamSide team={away} align="left" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Posiciones */}
      <div className="lg:sticky lg:top-4 self-start">
        <div className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-300">
            Posiciones — Grupo {grupo}
          </h3>
          <p className="mb-3 text-[11px] text-slate-500">
            Con empate de puntos, ordena tú con las flechas ↑↓
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500">
                <th className="pb-1 text-left font-medium">Equipo</th>
                <th className="pb-1 text-center font-medium">PJ</th>
                <th className="pb-1 text-center font-medium">DIF</th>
                <th className="pb-1 text-center font-medium">Pts</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((id, i) => {
                const r = rows[id];
                const t = teamById[id];
                const qualifies = i < 2; // 1° y 2° avanzan directo
                return (
                  <tr
                    key={id}
                    className={`border-t border-white/5 ${
                      qualifies ? "text-white" : "text-slate-400"
                    }`}
                  >
                    <td className="py-1.5">
                      <span className="mr-1 text-slate-500">{i + 1}</span>
                      <Flag flag={t.flag} className="mr-1.5 w-5" />
                      {t.name}
                    </td>
                    <td className="text-center tabular-nums">{r.pj}</td>
                    <td className="text-center tabular-nums">
                      {r.dif > 0 ? `+${r.dif}` : r.dif}
                    </td>
                    <td className="text-center font-bold tabular-nums text-white">
                      {r.pts}
                    </td>
                    <td className="pl-1">
                      <div className="flex flex-col">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={
                            locked ||
                            i === 0 ||
                            rows[sorted[i - 1]]?.pts !== r.pts
                          }
                          className="text-xs leading-none text-slate-500 enabled:hover:text-white disabled:opacity-20"
                          aria-label="Subir"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={
                            locked ||
                            i === sorted.length - 1 ||
                            rows[sorted[i + 1]]?.pts !== r.pts
                          }
                          className="text-xs leading-none text-slate-500 enabled:hover:text-white disabled:opacity-20"
                          aria-label="Bajar"
                        >
                          ▼
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-pitch-500" />
            1° y 2° avanzan directo · 3° puede clasificar como mejor tercero
          </p>
        </div>

        <div className="mt-4">
          <button
            onClick={onSave}
            disabled={pending || locked}
            className="w-full rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
          >
            {locked
              ? "🔒 Cerrado"
              : pending
                ? "Guardando…"
                : "Guardar grupo"}
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
    </div>
  );
}

function TeamSide({
  team,
  align,
}: {
  team: Team | undefined;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : "text-left"
      }`}
    >
      <Flag flag={team?.flag} className="w-7" />
      <span className="text-sm font-medium text-white">{team?.name}</span>
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
      className="h-11 w-11 rounded-lg border border-white/10 bg-navy-950 text-center text-lg font-bold text-white outline-none focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30 disabled:opacity-60"
    />
  );
}
