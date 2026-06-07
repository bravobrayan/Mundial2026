"use client";

import { useEffect, useState } from "react";

const KICKOFF = new Date("2026-06-11T19:00:00Z"); // 1er partido, UTC

function diff() {
  const ms = KICKOFF.getTime() - Date.now();
  const clamped = Math.max(0, ms);
  return {
    d: Math.floor(clamped / 86_400_000),
    h: Math.floor((clamped / 3_600_000) % 24),
    m: Math.floor((clamped / 60_000) % 60),
    s: Math.floor((clamped / 1000) % 60),
    over: ms <= 0,
  };
}

const UNITS = [
  { k: "d", l: "días" },
  { k: "h", l: "hrs" },
  { k: "m", l: "min" },
  { k: "s", l: "seg" },
] as const;

export function Countdown() {
  // null en el primer render (servidor + cliente) para evitar desajuste de
  // hidratación; el valor real se calcula tras montar.
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff());
    const id = setInterval(() => setT(diff()), 1000);
    return () => clearInterval(id);
  }, []);

  if (t?.over) {
    return (
      <p className="text-lg font-semibold text-gold-400">
        ¡El Mundial ya comenzó! Las quinielas están cerradas.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {UNITS.map((u) => (
        <div
          key={u.l}
          className="flex min-w-16 flex-col items-center rounded-xl border border-white/10 bg-navy-900/70 px-3 py-2"
        >
          <span className="font-mono text-2xl font-bold tabular-nums text-white">
            {t ? String(t[u.k]).padStart(2, "0") : "--"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400">
            {u.l}
          </span>
        </div>
      ))}
    </div>
  );
}
