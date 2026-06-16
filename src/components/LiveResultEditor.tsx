"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveResult } from "@/app/admin/actions";

/**
 * Editor rápido del resultado en vivo — SOLO admin. Se muestra dentro de la
 * tarjeta/banner del partido en vivo para no tener que entrar a /admin.
 * La acción saveResult valida el rol de admin en el servidor.
 */
export function LiveResultEditor({
  matchId,
  home,
  away,
  finished,
}: {
  matchId: number;
  home: number | null;
  away: number | null;
  finished: boolean;
}) {
  const [h, setH] = useState(home != null ? String(home) : "");
  const [a, setA] = useState(away != null ? String(away) : "");
  const [fin, setFin] = useState(finished);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function save(nextFin = fin) {
    setMsg(null);
    start(async () => {
      const res = await saveResult({
        matchId,
        home: h === "" ? null : Number(h),
        away: a === "" ? null : Number(a),
        finished: nextFin,
      });
      if (res.ok) {
        setMsg("Guardado ✓");
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-gold-400/30 bg-gold-400/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gold-400">
        ⚙️ Admin · editar marcador
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            value={h}
            onChange={(e) => setH(e.target.value)}
            className="h-9 w-9 rounded-lg border border-white/10 bg-navy-950 text-center font-bold text-white outline-none focus:border-pitch-500"
          />
          <span className="text-slate-500">-</span>
          <input
            type="number"
            min={0}
            value={a}
            onChange={(e) => setA(e.target.value)}
            className="h-9 w-9 rounded-lg border border-white/10 bg-navy-950 text-center font-bold text-white outline-none focus:border-pitch-500"
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={fin}
          onClick={() => setFin((v) => !v)}
          className="flex items-center gap-2 text-xs"
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition ${
              fin ? "bg-pitch-500" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                fin ? "left-[18px]" : "left-0.5"
              }`}
            />
          </span>
          <span className={fin ? "text-white" : "text-slate-400"}>
            {fin ? "Terminó" : "En juego"}
          </span>
        </button>

        <button
          onClick={() => save()}
          disabled={pending}
          className="ml-auto rounded-lg bg-pitch-500 px-4 py-1.5 text-sm font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-50"
        >
          Guardar
        </button>
        {msg && <span className="text-xs text-pitch-500">{msg}</span>}
      </div>
    </div>
  );
}
