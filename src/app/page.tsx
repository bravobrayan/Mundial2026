import Link from "next/link";
import { Countdown } from "@/components/Countdown";
import { Logo } from "@/components/Logo";
import { HeroBackground } from "@/components/HeroBackground";
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
    <main className="flex flex-col">
      {/* ===== Hero a pantalla completa ===== */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center">
        <HeroBackground />

        <div className="absolute top-6 left-1/2 z-10 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-slate-300">
          Creado por <span className="font-semibold text-gold-400">Brayan Bravo</span>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <Logo size={96} className="mb-6 drop-shadow-2xl" />

          <h1 className="text-5xl font-black leading-none tracking-tight text-white drop-shadow-lg sm:text-7xl">
            WORLD CUP
          </h1>
          <span className="mt-1 bg-gradient-to-b from-cyan-300 to-blue-600 bg-clip-text text-6xl font-black leading-none tracking-tight text-transparent sm:text-8xl">
            2026
          </span>
          <span className="mt-4 text-sm font-medium uppercase tracking-[0.5em] text-slate-300">
            La Quiniela
          </span>

          <div className="mt-10 flex flex-col items-center gap-4">
            {user ? (
              <Link
                href="/jugar"
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-12 py-4 text-lg font-bold uppercase tracking-wide text-white shadow-xl shadow-orange-500/30 transition hover:brightness-110"
              >
                Ir a mi quiniela
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-12 py-4 text-lg font-bold uppercase tracking-wide text-white shadow-xl shadow-orange-500/30 transition hover:brightness-110"
              >
                Inicia sesión
              </Link>
            )}
            <p className="max-w-xs text-sm text-slate-400">
              {user ? (
                "¡Listo para competir! Entra a llenar tus pronósticos."
              ) : (
                <>
                  ¿No tienes cuenta?{" "}
                  <Link
                    href="/registro"
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Regístrate
                  </Link>{" "}
                  para competir con tus amigos.
                </>
              )}
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-slate-400">
              Arranca en
            </span>
            <Countdown />
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-slate-400">
          ↓
        </div>
      </section>

      {/* ===== Contenido (scroll) ===== */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-5 py-20">
        {/* Puntuación */}
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

        {/* Calendario */}
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
      </div>
    </main>
  );
}
