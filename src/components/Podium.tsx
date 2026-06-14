export type PodiumRow = {
  user_id: string;
  display_name: string;
  points: number;
  exactos?: number;
};

/**
 * Podio visual del top 3 de una liga (estilo Mundial).
 * El 1° va al centro y elevado; 2° a la izquierda, 3° a la derecha.
 * Resalta al usuario actual (meId).
 */
export function Podium({
  rows,
  meId,
}: {
  rows: PodiumRow[];
  meId: string;
}) {
  if (rows.length === 0) return null;

  const top = rows.slice(0, 3);
  // Orden visual: 2 - 1 - 3 (en pantallas chicas se reordena con CSS)
  const order = [top[1], top[0], top[2]].filter(Boolean) as PodiumRow[];

  const styleFor = (place: number) => {
    if (place === 1)
      return {
        medal: "🥇",
        ring: "ring-gold-400/60",
        glow: "from-gold-400/25",
        bar: "h-24 sm:h-28",
        accent: "text-gold-400",
      };
    if (place === 2)
      return {
        medal: "🥈",
        ring: "ring-slate-300/50",
        glow: "from-slate-300/15",
        bar: "h-16 sm:h-20",
        accent: "text-slate-200",
      };
    return {
      medal: "🥉",
      ring: "ring-amber-700/50",
      glow: "from-amber-700/20",
      bar: "h-12 sm:h-16",
      accent: "text-amber-500",
    };
  };

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4">
      {order.map((r) => {
        const place = top.indexOf(r) + 1;
        const s = styleFor(place);
        const me = r.user_id === meId;
        const initial = (r.display_name?.[0] ?? "?").toUpperCase();
        return (
          <div
            key={r.user_id}
            className={`flex w-1/3 max-w-[140px] flex-col items-center ${
              place === 1 ? "order-2" : place === 2 ? "order-1" : "order-3"
            }`}
          >
            <div className="mb-1 text-2xl">{s.medal}</div>
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-xl font-black text-white ring-2 ${s.ring} ${
                me ? "outline outline-2 outline-pitch-500" : ""
              }`}
            >
              {initial}
            </div>
            <div className="mt-2 w-full truncate text-center text-xs font-semibold text-white">
              {r.display_name}
              {me && <span className="ml-1 text-[10px] text-pitch-500">(tú)</span>}
            </div>
            <div className={`text-lg font-black tabular-nums ${s.accent}`}>
              {r.points}
              <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                pts
              </span>
            </div>
            <div
              className={`mt-1 w-full rounded-t-xl bg-gradient-to-b ${s.glow} to-transparent ${s.bar} border-x border-t border-white/10`}
            />
          </div>
        );
      })}
    </div>
  );
}
