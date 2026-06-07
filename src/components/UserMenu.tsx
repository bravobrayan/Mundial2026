"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

export type NavLink = { href: string; label: string };

export function UserMenu({
  name,
  email,
  navLinks,
}: {
  name: string;
  email: string;
  navLinks: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const initial = (name.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pitch-500 to-gold-400 text-sm font-bold text-navy-950 ring-2 ring-white/10 transition hover:brightness-110"
        aria-label="Menú de usuario"
      >
        {initial}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-white/10 bg-navy-900 p-2 shadow-2xl">
            <div className="px-3 py-2">
              <div className="truncate text-sm font-semibold text-white">
                {name}
              </div>
              <div className="truncate text-xs text-slate-400">{email}</div>
            </div>

            {/* Navegación (solo en móvil; en escritorio va en la barra) */}
            <div className="sm:hidden">
              <div className="my-1 border-t border-white/10" />
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="my-1 border-t border-white/10" />
            <Link
              href="/jugar/cuenta"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
            >
              Mi cuenta
            </Link>
            <form action={logout}>
              <button className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-300 transition hover:bg-white/5">
                Cerrar sesión
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
