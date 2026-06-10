"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthForm } from "@/app/(auth)/AuthForm";
import { createClient } from "@/lib/supabase/client";

type View = "login" | "signup" | "forgot" | "sent";

const CTA =
  "rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-12 py-4 text-lg font-bold uppercase tracking-wide text-white shadow-xl shadow-orange-500/30 transition hover:brightness-110";

export function LandingAuth({ loggedIn }: { loggedIn: boolean }) {
  const [view, setView] = useState<View | null>(null);

  if (loggedIn) {
    return (
      <div className="mt-10 flex flex-col items-center gap-4">
        <Link href="/jugar" className={CTA}>
          Ir a mi quiniela
        </Link>
        <p className="max-w-xs text-sm text-slate-400">
          ¡Listo para competir! Entra a llenar tus pronósticos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-10 flex flex-col items-center gap-4">
        <button onClick={() => setView("login")} className={CTA}>
          Inicia sesión
        </button>
        <p className="max-w-xs text-sm text-slate-400">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => setView("signup")}
            className="font-semibold text-white underline-offset-4 hover:underline"
          >
            Regístrate
          </button>{" "}
          para competir con tus amigos.
        </p>
      </div>

      {view && (
        <ModalShell onClose={() => setView(null)}>
          {view === "login" && (
            <>
              <h2 className="mb-1 text-xl font-bold text-white">
                Iniciar sesión
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Entra para ver y editar tus pronósticos.
              </p>
              <AuthForm
                mode="login"
                onSwitchMode={() => setView("signup")}
                onForgot={() => setView("forgot")}
              />
            </>
          )}

          {view === "signup" && (
            <>
              <h2 className="mb-1 text-xl font-bold text-white">Crear cuenta</h2>
              <p className="mb-6 text-sm text-slate-400">
                Regístrate para llenar tu quiniela antes del primer partido.
              </p>
              <AuthForm mode="signup" onSwitchMode={() => setView("login")} />
            </>
          )}

          {view === "forgot" && (
            <ForgotView
              onBack={() => setView("login")}
              onSent={() => setView("sent")}
            />
          )}

          {view === "sent" && (
            <>
              <h2 className="mb-1 text-xl font-bold text-white">
                Revisa tu correo 📩
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Si ese correo está registrado, te enviamos un enlace para crear
                una nueva contraseña. Ábrelo desde este dispositivo.
              </p>
              <button
                onClick={() => setView("login")}
                className="text-sm text-gold-400 hover:underline"
              >
                ← Volver a iniciar sesión
              </button>
            </>
          )}
        </ModalShell>
      )}
    </>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-navy-900 p-7 text-left shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function ForgotView({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: () => void;
}) {
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
    else onSent();
  }

  return (
    <>
      <h2 className="mb-1 text-xl font-bold text-white">
        Recuperar contraseña
      </h2>
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
        <button
          type="button"
          onClick={onBack}
          className="text-center text-sm text-slate-400 hover:text-gold-400"
        >
          ← Volver
        </button>
      </form>
    </>
  );
}
