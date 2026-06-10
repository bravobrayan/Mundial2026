"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "./actions";

export function AuthForm({
  mode,
  next,
  onSwitchMode,
  onForgot,
}: {
  mode: "login" | "signup";
  next?: string;
  /** Si se pasa, el enlace de cambiar (login↔registro) llama a esto en vez de navegar. */
  onSwitchMode?: () => void;
  /** Si se pasa, "¿Olvidaste tu contraseña?" llama a esto en vez de navegar. */
  onForgot?: () => void;
}) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "signup" && (
        <Field
          label="Nombre (visible en el ranking)"
          name="name"
          type="text"
          placeholder="Ej. Brayan P."
          autoComplete="name"
        />
      )}
      <Field
        label="Correo"
        name="email"
        type="email"
        placeholder="tucorreo@ejemplo.com"
        autoComplete="email"
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />
      {next && <input type="hidden" name="next" value={next} />}

      {mode === "login" && (
        <div className="-mt-1 text-right">
          {onForgot ? (
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-slate-400 transition hover:text-gold-400"
            >
              ¿Olvidaste tu contraseña?
            </button>
          ) : (
            <Link
              href="/recuperar"
              className="text-xs text-slate-400 transition hover:text-gold-400"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-pitch-500 px-4 py-3 font-semibold text-navy-950 transition hover:bg-pitch-600 disabled:opacity-60"
      >
        {pending
          ? "Un momento…"
          : mode === "login"
            ? "Entrar"
            : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-slate-400">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta? <SwitchLink onSwitchMode={onSwitchMode} href="/registro" label="Regístrate" />
          </>
        ) : (
          <>
            ¿Ya tienes cuenta? <SwitchLink onSwitchMode={onSwitchMode} href="/login" label="Inicia sesión" />
          </>
        )}
      </p>
    </form>
  );
}

function SwitchLink({
  onSwitchMode,
  href,
  label,
}: {
  onSwitchMode?: () => void;
  href: string;
  label: string;
}) {
  if (onSwitchMode) {
    return (
      <button
        type="button"
        onClick={onSwitchMode}
        className="text-gold-400 hover:underline"
      >
        {label}
      </button>
    );
  }
  return (
    <Link href={href} className="text-gold-400 hover:underline">
      {label}
    </Link>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-300">{label}</span>
      <input
        {...props}
        required
        className="rounded-xl border border-white/10 bg-navy-900/60 px-3.5 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-pitch-500 focus:ring-2 focus:ring-pitch-500/30"
      />
    </label>
  );
}
