"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Pop-up que anuncia la apertura de una ronda de eliminatorias al entrar a la
 * liga, con botón directo al cuadro. Se muestra CADA vez que se entra a la
 * liga mientras al usuario le falten pronósticos de esa ronda (lo decide el
 * servidor: si ya completó todo, ni se renderiza). "Después" solo lo cierra.
 */
export function RoundAnnouncement({
  leagueId,
  title,
  missing,
}: {
  leagueId: string;
  title: string;
  missing: number;
}) {
  const [show, setShow] = useState(true);

  const dismiss = () => setShow(false);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full rounded-t-2xl border border-gold-400/30 bg-navy-900 p-6 text-center sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl">🏆</div>
        <h2 className="mt-2 text-xl font-black text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-300">
          Los cruces ya están definidos y puedes pronosticar.{" "}
          <strong className="text-white">
            Te {missing === 1 ? "falta" : "faltan"} {missing}{" "}
            {missing === 1 ? "partido" : "partidos"}
          </strong>{" "}
          — cada uno se cierra cuando empieza.
        </p>
        <Link
          href={`/liga/${leagueId}/cuadro`}
          onClick={dismiss}
          className="mt-5 block w-full rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600"
        >
          Llenar mis pronósticos →
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full rounded-xl px-4 py-2 text-sm text-slate-400 transition hover:bg-white/5"
        >
          Después
        </button>
      </div>
    </div>
  );
}
