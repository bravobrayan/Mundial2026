/**
 * PÁGINA TEMPORAL DE PREVIEW — solo para revisar visualmente los estados
 * "en vivo" con datos de muestra. NO usa la base de datos. Borrar antes de
 * mergear a main.
 */
import { LiveMatchBanner } from "@/components/LiveMatchBanner";
import { LiveMatchCard } from "@/components/LiveMatchCard";

const ME = "me";

const enJuego = {
  id: 1,
  grp: "A",
  label: null,
  home: { name: "México", flag: "🇲🇽" },
  away: { name: "Argentina", flag: "🇦🇷" },
};
const finalizado = {
  id: 2,
  grp: "C",
  label: null,
  home: { name: "Brasil", flag: "🇧🇷" },
  away: { name: "Francia", flag: "🇫🇷" },
};

const members = [
  { user_id: ME, display_name: "Tú (Brayan)" },
  { user_id: "u2", display_name: "Ana" },
  { user_id: "u3", display_name: "Luis" },
  { user_id: "u4", display_name: "Carmen" },
];

const predsFinal = [
  { match_id: 2, user_id: "u2", display_name: "Ana", home_goals: 2, away_goals: 1, points: 5, revealed: true },
  { match_id: 2, user_id: ME, display_name: "Tú (Brayan)", home_goals: 2, away_goals: 0, points: 3, revealed: true },
  { match_id: 2, user_id: "u3", display_name: "Luis", home_goals: 1, away_goals: 1, points: 1, revealed: true },
  // Carmen no jugó
];
const predsEnJuego = [
  { match_id: 1, user_id: ME, display_name: "Tú (Brayan)", home_goals: 1, away_goals: 1, points: null, revealed: true },
  { match_id: 1, user_id: "u2", display_name: "Ana", home_goals: 0, away_goals: 2, points: null, revealed: true },
];

export default function PreviewPage() {
  return (
    <main className="bg-stadium min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10">
        <p className="rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm text-gold-400">
          Vista de PRUEBA con datos de muestra (no real). Solo para revisar el
          diseño de los estados “en vivo”.
        </p>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
            Banner del Home — “En juego” y “Final”
          </h2>
          <LiveMatchBanner
            matches={[enJuego, finalizado]}
            results={new Map([[2, { home_goals: 2, away_goals: 1 }]])}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
            Tarjeta de liga — “En juego” (sin resultado aún)
          </h2>
          <LiveMatchCard
            match={enJuego}
            members={members}
            preds={predsEnJuego}
            result={undefined}
            meId={ME}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">
            Tarjeta de liga — “Final” (con resultado y puntos)
          </h2>
          <LiveMatchCard
            match={finalizado}
            members={members}
            preds={predsFinal}
            result={{ home_goals: 2, away_goals: 1 }}
            meId={ME}
          />
        </section>
      </div>
    </main>
  );
}
