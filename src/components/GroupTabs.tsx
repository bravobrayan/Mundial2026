import Link from "next/link";
import { GROUPS } from "@/lib/quiniela/types";

export function GroupTabs({
  leagueId,
  active,
  completed,
}: {
  leagueId: string;
  active: string;
  completed: Set<string>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {GROUPS.map((g) => {
        const isActive = g === active;
        const done = completed.has(g);
        return (
          <Link
            key={g}
            href={`/liga/${leagueId}/grupos/${g}`}
            className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition ${
              isActive
                ? "bg-pitch-500 text-navy-950"
                : "border border-white/10 bg-navy-900/60 text-slate-200 hover:bg-navy-800"
            }`}
          >
            {g}
            {done && !isActive && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pitch-500 text-[9px] text-navy-950">
                ✓
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
