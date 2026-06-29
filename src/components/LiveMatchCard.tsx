"use client";

import { useEffect, useState } from "react";
import { Flag } from "./Flag";
import { LiveResultEditor } from "./LiveResultEditor";

type Pred = {
  user_id: string;
  display_name: string;
  home_goals: number | null;
  away_goals: number | null;
  points: number | null;
  revealed: boolean;
  advance_name?: string | null;
  advance_flag?: string | null;
};

export type LiveMatch = {
  id: number;
  grp: string | null;
  label: string | null;
  kickoff: string;
  home_team_id: number | null;
  away_team_id: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

// Preferencia compartida (se recuerda en el navegador del usuario).
const STORAGE_KEY = "qm:live-expand";

export function LiveMatchCard({
  match,
  members,
  preds,
  result,
  meId,
  finished,
  isAdmin = false,
}: {
  match: LiveMatch;
  members: { user_id: string; display_name: string }[];
  preds: Pred[];
  result:
    | {
        home_goals: number;
        away_goals: number;
        finished?: boolean;
        advance_team_id?: number | null;
      }
    | undefined;
  meId: string;
  finished: boolean;
  isAdmin?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setExpanded((v) => {
      const nv = !v;
      try {
        localStorage.setItem(STORAGE_KEY, nv ? "1" : "0");
      } catch {
        /* ignore */
      }
      return nv;
    });
  };

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

  const me = members.find((m) => m.user_id === meId);
  const minePred = predByUser.get(meId);
  const playedCount = predByUser.size;

  // Equipo que pasó por penales (lo definió el admin) en empates de eliminatoria.
  const advTeam =
    result == null ||
    result.advance_team_id == null ||
    result.home_goals !== result.away_goals
      ? null
      : result.advance_team_id === match.home_team_id
        ? match.home
        : result.advance_team_id === match.away_team_id
          ? match.away
          : null;

  return (
    <div
      className={`relative rounded-2xl border bg-gradient-to-b to-transparent p-4 ${
        finished ? "border-white/10 from-white/5" : "border-red-500/30 from-red-500/10"
      }`}
    >
      {isAdmin && (
        <LiveResultEditor
          matchId={match.id}
          title={`${match.home?.name ?? "?"} vs ${match.away?.name ?? "?"}`}
          home={result?.home_goals ?? null}
          away={result?.away_goals ?? null}
          finished={result?.finished ?? false}
        />
      )}

      <div className="mb-3 flex items-center gap-2">
        {finished ? (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Final
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            En juego
          </span>
        )}
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
          {result ? `${result.home_goals} - ${result.away_goals}` : "—"}
        </span>
        <div className="flex items-center gap-2 text-left">
          <span className="font-semibold text-white">{match.away?.name}</span>
          <Flag flag={match.away?.flag} className="w-7" />
        </div>
      </div>

      {advTeam && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gold-400">
          <Flag flag={advTeam.flag} className="w-5" />
          <span>
            <strong>{advTeam.name}</strong> pasó por penales
          </span>
        </div>
      )}

      {/* Pronósticos */}
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {expanded ? "Pronósticos de la liga" : "Tu pronóstico"}
        </div>

        {expanded ? (
          ordered.length === 0 ? (
            <p className="text-center text-xs text-slate-500">Sin miembros.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {ordered.map((m) => (
                <PredRow
                  key={m.user_id}
                  name={m.display_name}
                  pred={predByUser.get(m.user_id)}
                  me={m.user_id === meId}
                />
              ))}
            </div>
          )
        ) : (
          <PredRow
            name={me?.display_name ?? "Tú"}
            pred={minePred}
            me
            emptyText="No pronosticaste este partido"
          />
        )}

        <button
          type="button"
          onClick={toggle}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
        >
          {expanded
            ? "Ocultar los demás ▴"
            : `Ver pronósticos de todos (${playedCount}) ▾`}
        </button>
      </div>
    </div>
  );
}

function PredRow({
  name,
  pred,
  me,
  emptyText = "no jugó",
}: {
  name: string;
  pred: Pred | undefined;
  me: boolean;
  emptyText?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${
        me ? "bg-pitch-500/10" : ""
      }`}
    >
      <span className="text-slate-200">
        {name}
        {me && <span className="ml-2 text-[10px] text-pitch-500">tú</span>}
      </span>
      {pred ? (
        <span className="flex items-center gap-2">
          {pred.home_goals === pred.away_goals && pred.advance_name && (
            <span className="flex items-center gap-1 rounded bg-gold-400/15 px-1.5 py-0.5 text-[10px] font-medium text-gold-400">
              <Flag flag={pred.advance_flag} className="w-3.5" />
              <span className="hidden sm:inline">pasa</span> {pred.advance_name}
            </span>
          )}
          <span className="font-mono tabular-nums text-white">
            {pred.home_goals}-{pred.away_goals}
          </span>
          {pred.points != null && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                pred.points >= 3
                  ? "bg-pitch-500/20 text-pitch-500"
                  : pred.points === 1
                    ? "bg-gold-400/20 text-gold-400"
                    : "bg-white/5 text-slate-400"
              }`}
            >
              +{pred.points}
            </span>
          )}
        </span>
      ) : (
        <span className="text-xs text-slate-600">{emptyText}</span>
      )}
    </div>
  );
}
