"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const email = String(
      new FormData(e.currentTarget).get("email") ?? "",
    ).trim();
    if (!email) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-clave`,
    });
    setLoading(false);

    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="mb-1 text-xl font-bold text-white">Revisa tu correo 📩</h1>
        <p className="mb-6 text-sm text-slate-400">
          Si ese correo está registrado, te enviamos un enlace para crear una
          nueva contraseña. Ábrelo desde este dispositivo.
        </p>
        <Link
          href="/login"
          className="text-sm text-gold-400 hover:underline"
        >
          ← Volver a iniciar sesión
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold text-white">
        Recuperar contraseña
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Escribe tu correo y te enviamos un enlace para crear una nueva.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-300">Correo</span>
          <input
            name="email"
            type="email"
            required
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
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
          {loading ? "Enviando…" : "Enviar enlace"}
        </button>

        <Link
          href="/login"
          className="text-center text-sm text-slate-400 hover:text-gold-400"
        >
          ← Volver
        </Link>
      </form>
    </>
  );
}
