"use client";

import { useState } from "react";
import Link from "next/link";

export type Notif = {
  id: string;
  title: string;
  desc?: string;
  href?: string;
  emoji: string;
};

export function NotificationsBell({ items }: { items: Notif[] }) {
  const [open, setOpen] = useState(false);
  const count = items.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5"
        aria-label="Notificaciones"
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-white/10 bg-navy-900 p-2 shadow-2xl">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Notificaciones
            </div>
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                Sin novedades por ahora 🎉
              </div>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className="flex gap-3 rounded-lg px-3 py-2 transition hover:bg-white/5">
                    <span className="text-lg">{n.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {n.title}
                      </div>
                      {n.desc && (
                        <div className="text-xs text-slate-400">{n.desc}</div>
                      )}
                    </div>
                  </div>
                );
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => setOpen(false)}>
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
