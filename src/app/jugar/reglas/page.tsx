const SCORING = [
  {
    icon: "🎯",
    pts: "5 pts",
    title: "Resultado exacto",
    desc: "Pegas el marcador clavado (ej. pones 2-1 y queda 2-1).",
    color: "from-pitch-500/20 ring-pitch-500/40",
  },
  {
    icon: "✅",
    pts: "3 pts",
    title: "Solo el signo",
    desc: "Aciertas quién gana o si es empate (ej. pones 3-1 y queda 2-0).",
    color: "from-sky-500/20 ring-sky-500/40",
  },
  {
    icon: "🟡",
    pts: "1 pt",
    title: "Goles de un equipo",
    desc: "Aciertas cuántos goles hizo uno de los dos equipos, pero fallas el ganador.",
    color: "from-gold-400/20 ring-gold-400/40",
  },
  {
    icon: "❌",
    pts: "0 pts",
    title: "Nada",
    desc: "No le pegas ni al ganador ni a los goles de algún equipo.",
    color: "from-red-500/15 ring-red-500/30",
  },
];

const EXAMPLE = [
  { pred: "2 - 1", why: "Marcador exacto", pts: 5 },
  { pred: "3 - 0", why: "Acertaste que gana México (signo)", pts: 3 },
  { pred: "2 - 0", why: "Ganador + goles de México → gana el signo", pts: 3 },
  { pred: "2 - 4", why: "Goles de México sí, pero dijiste que ganaba Sudáfrica", pts: 1 },
  { pred: "0 - 1", why: "Goles de Sudáfrica sí, pero el ganador no", pts: 1 },
  { pred: "0 - 3", why: "Ni el ganador ni los goles", pts: 0 },
];

function badge(pts: number) {
  if (pts === 5) return "bg-pitch-500/20 text-pitch-500";
  if (pts === 3) return "bg-sky-500/20 text-sky-300";
  if (pts === 1) return "bg-gold-400/20 text-gold-400";
  return "bg-white/5 text-slate-400";
}

export default function ReglasPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-black text-white">Reglas y puntuación</h1>
      <p className="mt-1 text-slate-400">
        Cada partido se puntúa de forma independiente. ¡Máximo 5 puntos por
        partido!
      </p>

      {/* Tarjetas de puntuación */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
          Cómo se puntúa cada partido
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SCORING.map((s) => (
            <div
              key={s.title}
              className={`rounded-2xl bg-gradient-to-b ${s.color} to-transparent p-5 ring-1`}
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{s.icon}</span>
                <span className="font-mono text-lg font-bold text-white">
                  {s.pts}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ejemplo */}
      <section className="mt-10">
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wider text-slate-300">
          Ejemplo
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          El partido real queda{" "}
          <strong className="text-white">México 2 - 1 Sudáfrica</strong>. Según
          lo que hayas puesto:
        </p>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-navy-900/70 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Tu pronóstico</th>
                <th className="px-2 py-3 text-left font-medium">Por qué</th>
                <th className="px-4 py-3 text-right font-medium">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLE.map((e, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-3 font-mono font-bold tabular-nums text-white">
                    {e.pred}
                  </td>
                  <td className="px-2 py-3 text-slate-300">{e.why}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${badge(e.pts)}`}
                    >
                      {e.pts} pts
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reglas adicionales */}
      <section className="mt-10">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
          Importante
        </h2>
        <ul className="flex flex-col gap-3 text-sm text-slate-300">
          <Rule emoji="🚫">
            Los puntos <strong>no se suman</strong> entre sí: cada partido da{" "}
            <strong>máximo 5</strong>. Siempre cuenta el puntaje más alto que
            apliques.
          </Rule>
          <Rule emoji="🔒">
            <strong>Fase de grupos:</strong> se cierra para todos al empezar el
            Mundial. Después solo puedes ver tus pronósticos.
          </Rule>
          <Rule emoji="🏆">
            <strong>Eliminatorias:</strong> se habilitan ronda por ronda cuando
            se definen los cruces. Cada partido se puede predecir hasta su hora
            de inicio.
          </Rule>
          <Rule emoji="⚽">
            En eliminatorias cuenta el resultado de los <strong>90 minutos</strong>{" "}
            (o el fin del alargue). Los <strong>penales</strong> solo definen
            quién avanza, <strong>no dan puntos</strong>.
          </Rule>
          <Rule emoji="👀">
            Los pronósticos de los demás se <strong>revelan al empezar</strong>{" "}
            cada partido (antes nadie ve los tuyos).
          </Rule>
        </ul>
      </section>
    </main>
  );
}

function Rule({
  emoji,
  children,
}: {
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-white/10 bg-navy-900/50 p-3.5">
      <span className="text-lg">{emoji}</span>
      <span>{children}</span>
    </li>
  );
}
