"use client";

import { useState } from "react";

export function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `¡Únete a mi quiniela del Mundial 2026! Código: ${code} · ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-lg border border-gold-400/30 bg-gold-400/10 px-4 py-2 font-mono text-xl font-bold tracking-[0.3em] text-gold-400">
        {code}
      </span>
      <button
        onClick={copy}
        className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
      >
        {copied ? "¡Copiado! ✓" : "Copiar invitación"}
      </button>
    </div>
  );
}
