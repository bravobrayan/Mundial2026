"use client";

import { useEffect, useState } from "react";
import { GROUP_LOCK_AT } from "@/lib/quiniela/lock";

function diff() {
  const ms = GROUP_LOCK_AT.getTime() - Date.now();
  return {
    ms,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms / 3_600_000) % 24),
    m: Math.floor((ms / 60_000) % 60),
  };
}

export function GroupLockCountdown() {
  // null antes de montar (evita desajuste de hidratación)
  const [t, setT] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setT(diff());
    const id = setInterval(() => setT(diff()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!t) return null;

  if (t.ms <= 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3 text-sm text-slate-300">
        🔒 La fase de grupos está cerrada. ¡Mucha suerte! ⚽
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-400">
      <span>⏳</span>
      <span>
        Quedan{" "}
        <strong className="font-bold">
          {t.d}d {t.h}h {t.m}m
        </strong>{" "}
        para que <strong>cierren los grupos</strong> — ¡completa tus pronósticos!
      </span>
    </div>
  );
}
