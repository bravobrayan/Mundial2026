"use client";

import { useState, useTransition } from "react";
import { expelMember } from "./actions";

export function ExpelButton({
  leagueId,
  userId,
  name,
}: {
  leagueId: string;
  userId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onClick() {
    if (
      !confirm(
        `¿Expulsar a ${name} de la liga?\nSe borrarán sus pronósticos en esta liga.`,
      )
    )
      return;
    setErr(null);
    start(async () => {
      const r = await expelMember(leagueId, userId);
      if (r?.error) setErr(r.error);
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        onClick={onClick}
        disabled={pending}
        title={`Expulsar a ${name}`}
        className="rounded px-2 py-0.5 text-xs text-red-300/60 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      >
        {pending ? "…" : "Expulsar"}
      </button>
      {err && <span className="text-[10px] text-red-300">{err}</span>}
    </span>
  );
}
