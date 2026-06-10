"use client";

import { useMemo, useState, useTransition } from "react";
import type { Team } from "@/lib/quiniela/types";
import { Flag } from "@/components/Flag";
import { saveResult, setMatchTeams } from "./actions";

export type AdminMatch = {
  id: number;
  stage: string;
  grp: string | null;
  kickoff: string;
  label: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
};

const STAGES: { key: string; label: string }[] = [
  { key: "group", label: "Grupos" },
  { key: "r32", label: "Dieciseisavos" },
  { key: "r16", label: "Octavos" },
  { key: "qf", label: "Cuartos" },
  { key: "sf", label: "Semis" },
  { key: "third", label: "3er puesto" },
  { key: "final", label: "Final" },
];

export function AdminBoard({
  matches,
  results,
  teams,
}: {
  matches: AdminMatch[];
  results: Record<number, { home: number; away: number }>;
  teams: Team[];
}) {
  const [stage, setStage] = useState("group");
  const list = useMemo(
    () => matches.filter((m) => m.stage === stage),
    [matches, stage],
  );

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStage(s.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              stage === s.key
                ? "bg-pitch-500 text-navy-950"
                : "border border-white/10 bg-navy-900/60 text-slate-200 hover:bg-navy-800"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {list.map((m) => (
          <AdminRow
            key={m.id}
            match={m}
            result={results[m.id]}
            teams={teams}
            knockout={m.stage !== "group"}
          />
        ))}
      </div>
    </div>
  );
}

function AdminRow({
  match,
  result,
  teams,
  knockout,
}: {
  match: AdminMatch;
  result?: { home: number; away: number };
  teams: Team[];
  knockout: boolean;
}) {
  const [home, setHome] = useState<string>(result ? String(result.home) : "");
  const [away, setAway] = useState<string>(result ? String(result.away) : "");
  const [homeId, setHomeId] = useState<number | null>(match.home_team_id);
  const [awayId, setAwayId] = useState<number | null>(match.away_team_id);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const teamName = (id: number | null, embedded: { name: string } | null) =>
    embedded?.name ?? teams.find((t) => t.id === id)?.name ?? "—";
  const teamFlag = (
    id: number | null,
    embedded: { flag: string | null } | null,
  ) => embedded?.flag ?? teams.find((t) => t.id === id)?.flag ?? null;

  function saveTeams() {
    setMsg(null);
    start(async () => {
      const res = await setMatchTeams({
        matchId: match.id,
        homeTeamId: homeId,
        awayTeamId: awayId,
      });
      setMsg(res.ok ? "Cruce guardado ✓" : res.error);
    });
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveResult({
        matchId: match.id,
        home: home === "" ? null : Number(home),
        away: away === "" ? null : Number(away),
      });
      setMsg(res.ok ? "Resultado guardado ✓" : res.error);
    });
  }

  const teamsSet = homeId != null && awayId != null;

  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 p-3">
      <div className="mb-2 text-[11px] text-slate-500">
        #{match.id} · {match.label ?? `Grupo ${match.grp}`}
      </div>

      {knockout && (
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamSelect
            teams={teams}
            value={homeId}
            onChange={setHomeId}
          />
          <span className="text-xs text-slate-500">vs</span>
          <TeamSelect teams={teams} value={awayId} onChange={setAwayId} />
          <button
            onClick={saveTeams}
            disabled={pending}
            className="col-span-3 mt-1 rounded-lg border border-white/15 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
          >
            Guardar cruce
          </button>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className="flex items-center justify-end gap-1.5 text-right text-sm font-medium text-white">
          <Flag flag={teamFlag(homeId, match.home)} className="h-4 w-6" />{" "}
          {teamName(homeId, match.home)}
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={home}
            disabled={knockout && !teamsSet}
            onChange={(e) => setHome(e.target.value)}
            className="h-10 w-10 rounded-lg border border-white/10 bg-navy-950 text-center font-bold text-white outline-none focus:border-pitch-500 disabled:opacity-40"
          />
          <span className="text-slate-500">-</span>
          <input
            type="number"
            min={0}
            value={away}
            disabled={knockout && !teamsSet}
            onChange={(e) => setAway(e.target.value)}
            className="h-10 w-10 rounded-lg border border-white/10 bg-navy-950 text-center font-bold text-white outline-none focus:border-pitch-500 disabled:opacity-40"
          />
        </div>
        <span className="flex items-center gap-1.5 text-left text-sm font-medium text-white">
          {teamName(awayId, match.away)}{" "}
          <Flag flag={teamFlag(awayId, match.away)} className="h-4 w-6" />
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-pitch-500">{msg}</span>
        <button
          onClick={save}
          disabled={pending || (knockout && !teamsSet)}
          className="rounded-lg bg-pitch-500 px-4 py-1.5 text-sm font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

function TeamSelect({
  teams,
  value,
  onChange,
}: {
  teams: Team[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="rounded-lg border border-white/10 bg-navy-950 px-2 py-1.5 text-sm text-white outline-none focus:border-pitch-500"
    >
      <option value="">— equipo —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.grp} · {t.name}
        </option>
      ))}
    </select>
  );
}
