"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveResult } from "@/app/admin/actions";

/**
 * Editor rápido del resultado en vivo — SOLO admin. Un botón discreto en la
 * esquina del partido en vivo abre un pop-up para acomodar el marcador, sin
 * entrar a /admin. saveResult valida el rol de admin en el servidor.
 */
export function LiveResultEditor({
  matchId,
  title,
  home,
  away,
  finished,
}: {
  matchId: number;
  title?: string;
  home: number | null;
  away: number | null;
  finished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(home != null ? String(home) : "");
  const [a, setA] = useState(away != null ? String(away) : "");
  const [fin, setFin] = useState(finished);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveResult({
        matchId,
        home: h === "" ? null : Number(h),
        away: a === "" ? null : Number(a),
        finished: fin,
      });
      if (res.ok) {
        router.refresh();
        setOpen(false);
      } else {
        setMsg(res.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar resultado (admin)"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-gold-400/30 bg-gold-400/10 text-sm text-gold-400 transition hover:bg-gold-400/20"
      >
        ⚙️
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl border border-white/10 bg-navy-900 p-5 sm:max-w-sm sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400">
                ⚙️ Admin · editar resultado
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-white/5"
              >
                ✕
              </button>
            </div>
            {title && (
              <p className="mb-4 text-sm font-semibold text-white">{title}</p>
            )}

            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                min={0}
                value={h}
                onChange={(e) => setH(e.target.value)}
                className="h-12 w-12 rounded-lg border border-white/10 bg-navy-950 text-center text-lg font-bold text-white outline-none focus:border-pitch-500"
              />
              <span className="text-slate-500">-</span>
              <input
                type="number"
                min={0}
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="h-12 w-12 rounded-lg border border-white/10 bg-navy-950 text-center text-lg font-bold text-white outline-none focus:border-pitch-500"
              />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={fin}
              onClick={() => setFin((v) => !v)}
              className="mx-auto mt-4 flex items-center gap-2 text-sm"
            >
              <span
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  fin ? "bg-pitch-500" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    fin ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </span>
              <span className={fin ? "text-white" : "text-slate-400"}>
                {fin ? "Partido terminó" : "En juego"}
              </span>
            </button>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs text-red-400">{msg}</span>
              <button
                onClick={save}
                disabled={pending}
                className="rounded-lg bg-pitch-500 px-5 py-2 text-sm font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-50"
              >
                {pending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
