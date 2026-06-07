import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

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
    desc: "Aciertas cuántos goles hizo uno de los dos equipos.",
    color: "from-gold-400/20 ring-gold-400/40",
  },
  {
    icon: "❌",
    pts: "0 pts",
    title: "Nada",
    desc: "No se acumulan: cada partido da máximo 5 puntos.",
    color: "from-red-500/15 ring-red-500/30",
  },
];

const CALENDAR = [
  ["Fase de grupos", "72 partidos"],
  ["Dieciseisavos", "16 partidos"],
  ["Octavos", "8 partidos"],
  ["Cuartos", "4 partidos"],
  ["Semifinales", "2 partidos"],
  ["3er puesto + Final", "2 partidos"],
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-5 py-14 sm:py-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center">
        <Logo size={72} className="mb-5" />
        <span className="mb-4 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
          Copa Mundial 2026
        </span>
        <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
          La Quiniela del{" "}
          <span className="bg-gradient-to-r from-pitch-500 to-gold-400 bg-clip-text text-transparent">
            Mundial 2026
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-300">
          Predice los <strong className="text-white">104 partidos</strong>, arma
          tu propio cuadro hasta la final y compite por el primer lugar del
          ranking en vivo.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-slate-400">
            Arranca en
          </span>
          <Countdown />
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              href="/jugar"
              className="rounded-xl bg-pitch-500 px-7 py-3.5 font-semibold text-navy-950 transition hover:bg-pitch-600"
            >
              Ir a mi quiniela →
            </Link>
          ) : (
            <>
              <Link
                href="/registro"
                className="rounded-xl bg-pitch-500 px-7 py-3.5 font-semibold text-navy-950 transition hover:bg-pitch-600"
              >
                Crear mi quiniela
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-7 py-3.5 font-semibold text-white transition hover:bg-white/5"
              >
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Scoring */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          Sistema de puntuación
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <p className="mt-4 text-center text-sm text-slate-400">
          ⚠️ En eliminatorias cuenta el resultado de los 90 min (o fin del
          alargue). Los penales solo definen quién avanza, no dan puntos.
        </p>
      </section>

      {/* Calendar */}
      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          El camino a la final
        </h2>
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
          {CALENDAR.map(([stage, count]) => (
            <div
              key={stage}
              className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3 text-center"
            >
              <div className="text-sm font-semibold text-white">{stage}</div>
              <div className="text-xs text-slate-400">{count}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-8 text-center text-sm text-slate-500">
        Quiniela Mundial 2026 · Hecho para la banda ⚽
      </footer>
    </main>
  );
}
