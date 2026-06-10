"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ActualizarClavePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const pass = String(fd.get("password") ?? "");
    const pass2 = String(fd.get("password2") ?? "");

    if (pass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (pass !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);

    if (error) {
      setError(
        error.message.toLowerCase().includes("session")
          ? "El enlace expiró. Pide uno nuevo desde 'Olvidaste tu contraseña'."
          : error.message,
      );
    } else {
      router.push("/jugar");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-white">Nueva contraseña</h1>
      <p className="mb-6 text-sm text-slate-400">
        Crea tu nueva contraseña para entrar.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-300">Nueva contraseña</span>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="new-password"
            className="rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-300">Repite la contraseña</span>
          <input
            name="password2"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="new-password"
            className="rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </>
  );
}
