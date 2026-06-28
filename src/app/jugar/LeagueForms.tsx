"use client";

import { useActionState } from "react";
import {
  createLeague,
  joinLeague,
  type LeagueActionState,
} from "./leagues-actions";

export function CreateLeagueForm() {
  const [state, action, pending] = useActionState<LeagueActionState, FormData>(
    createLeague,
    null,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="name"
        type="text"
        required
        placeholder="Ej. Los cracks del barrio"
        className="rounded-xl border border-white/10 bg-navy-950 px-3.5 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
      />
      <label className="text-xs font-medium text-slate-400">
        Tipo de liga
        <select
          name="type"
          defaultValue="grupos"
          className="mt-1 w-full rounded-xl border border-white/10 bg-navy-950 px-3.5 py-3 text-slate-100 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
        >
          <option value="grupos">Fase de grupos (5/3/1)</option>
          <option value="eliminatorias">
            Eliminatorias (120&apos; + bonus penales)
          </option>
        </select>
      </label>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear liga"}
      </button>
    </form>
  );
}

export function JoinLeagueForm() {
  const [state, action, pending] = useActionState<LeagueActionState, FormData>(
    joinLeague,
    null,
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="code"
        type="text"
        required
        placeholder="Código (ej. X7K2AB)"
        autoCapitalize="characters"
        className="rounded-xl border border-white/10 bg-navy-950 px-3.5 py-3 font-mono uppercase tracking-widest text-slate-100 placeholder:text-slate-500 placeholder:normal-case placeholder:tracking-normal outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30"
      />
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button
        disabled={pending}
        className="rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-3 font-semibold text-gold-400 transition hover:bg-gold-400/20 disabled:opacity-60"
      >
        {pending ? "Uniéndote…" : "Unirme con código"}
      </button>
    </form>
  );
}
