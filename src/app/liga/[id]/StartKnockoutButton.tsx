"use client";

import { useState, useTransition } from "react";
import { startKnockout } from "@/app/liga/actions";

export function StartKnockoutButton({ leagueId }: { leagueId: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function onConfirm() {
    setMsg(null);
    start(async () => {
      const res = await startKnockout(leagueId);
      if (!res.ok) {
        setMsg(res.error);
        setConfirming(false);
      }
      // Si ok, revalidatePath refresca el dashboard ya en modo eliminatorias.
    });
  }

  if (!confirming) {
    return (
      <div className="rounded-2xl border border-gold-400/30 bg-gold-400/5 p-5">
        <h3 className="font-semibold text-white">Iniciar eliminatorias 🏆</h3>
        <p className="mt-1 text-sm text-slate-400">
          Convierte esta liga a fase de eliminatorias.{" "}
          <strong className="text-slate-300">
            Los puntos de grupos se mantienen
          </strong>{" "}
          y los del mata-mata se suman encima. Los grupos quedan de solo lectura.
        </p>
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 inline-block rounded-xl bg-gold-400 px-5 py-2.5 font-semibold text-navy-950 transition hover:bg-gold-300"
        >
          Iniciar eliminatorias →
        </button>
        {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-5">
      <h3 className="font-semibold text-white">¿Confirmas?</h3>
      <p className="mt-1 text-sm text-slate-300">
        Esta liga pasará a fase de eliminatorias para todos sus miembros.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onConfirm}
          disabled={pending}
          className="rounded-xl bg-pitch-500 px-5 py-2.5 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
        >
          {pending ? "Convirtiendo…" : "Sí, iniciar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-xl border border-white/15 px-5 py-2.5 font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-red-300">{msg}</p>}
    </div>
  );
}
