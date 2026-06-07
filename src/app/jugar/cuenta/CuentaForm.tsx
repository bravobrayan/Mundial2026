"use client";

import { useActionState } from "react";
import { updateName, type CuentaState } from "./actions";

export function CuentaForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState<CuentaState, FormData>(
    updateName,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-300">
          Nombre (visible en el ranking)
        </span>
        <input
          name="name"
          type="text"
          defaultValue={initialName}
          required
          className="rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-3 text-slate-100 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
        />
      </label>

      {state?.error && (
        <p className="text-sm text-red-300">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-pitch-500">Nombre actualizado ✓</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 self-start rounded-xl bg-pitch-500 px-5 py-2.5 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
