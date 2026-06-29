/**
 * Fuente GRATIS y sin key: openfootball/worldcup.json (dominio público).
 * Datos reales del Mundial 2026: resultados + goleadores (nombre + minuto).
 * Se actualiza por la comunidad durante el torneo (no es minuto a minuto).
 */
const URL_2026 =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

export type OFGoal = {
  name: string;
  minute: string | number;
  penalty?: boolean;
  owngoal?: boolean;
};
export type OFMatch = {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  score?: { ft?: [number, number]; ht?: [number, number] };
  goals1?: OFGoal[];
  goals2?: OFGoal[];
};

export type Scorer = {
  name: string;
  team: string; // nombre en inglés (openfootball)
  goals: number;
  penalties: number;
};

export type FinishedMatch = {
  date: string;
  team1: string;
  team2: string;
  ft: [number, number];
  round: string;
};

/** Equipos en inglés (openfootball) → nombre en nuestra BD (español). */
export const EN_TO_ES: Record<string, string> = {
  mexico: "México",
  southafrica: "Sudáfrica",
  southkorea: "Corea del Sur",
  korearepublic: "Corea del Sur",
  czechrepublic: "República Checa",
  canada: "Canadá",
  bosniaherzegovina: "Bosnia y Herzegovina",
  qatar: "Catar",
  switzerland: "Suiza",
  brazil: "Brasil",
  morocco: "Marruecos",
  haiti: "Haití",
  scotland: "Escocia",
  unitedstates: "Estados Unidos",
  usa: "Estados Unidos",
  paraguay: "Paraguay",
  australia: "Australia",
  turkey: "Turquía",
  turkiye: "Turquía",
  germany: "Alemania",
  curacao: "Curazao",
  ivorycoast: "Costa de Marfil",
  cotedivoire: "Costa de Marfil",
  ecuador: "Ecuador",
  netherlands: "Holanda",
  japan: "Japón",
  sweden: "Suecia",
  tunisia: "Túnez",
  belgium: "Bélgica",
  egypt: "Egipto",
  iran: "Irán",
  iriran: "Irán",
  newzealand: "Nueva Zelanda",
  spain: "España",
  capeverde: "Cabo Verde",
  saudiarabia: "Arabia Saudita",
  uruguay: "Uruguay",
  france: "Francia",
  senegal: "Senegal",
  iraq: "Irak",
  norway: "Noruega",
  argentina: "Argentina",
  algeria: "Argelia",
  austria: "Austria",
  jordan: "Jordania",
  portugal: "Portugal",
  drcongo: "RD Congo",
  congodr: "RD Congo",
  uzbekistan: "Uzbekistán",
  colombia: "Colombia",
  england: "Inglaterra",
  croatia: "Croacia",
  ghana: "Ghana",
  panama: "Panamá",
};

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Traduce un nombre de equipo inglés (openfootball) a nuestro nombre ES. */
export function toEsTeam(en: string): string {
  return EN_TO_ES[normalize(en)] ?? en;
}

export async function fetchWC2026(
  revalidate = 600,
): Promise<{ ok: boolean; matches: OFMatch[]; error?: string }> {
  try {
    const res = await fetch(URL_2026, { next: { revalidate } });
    if (!res.ok) return { ok: false, matches: [], error: `HTTP ${res.status}` };
    const json = (await res.json()) as { matches?: OFMatch[] };
    return { ok: true, matches: json.matches ?? [] };
  } catch (e) {
    return {
      ok: false,
      matches: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Tabla de goleadores: cuenta goles (incluye penales), excluye autogoles. */
export function topScorers(matches: OFMatch[]): Scorer[] {
  const by = new Map<string, Scorer>();
  for (const m of matches) {
    const add = (g: OFGoal, team: string) => {
      if (g.owngoal) return; // el autogol no acredita al jugador
      const key = `${normalize(g.name)}|${normalize(team)}`;
      const cur = by.get(key) ?? { name: g.name, team, goals: 0, penalties: 0 };
      cur.goals += 1;
      if (g.penalty) cur.penalties += 1;
      by.set(key, cur);
    };
    for (const g of m.goals1 ?? []) add(g, m.team1);
    for (const g of m.goals2 ?? []) add(g, m.team2);
  }
  return [...by.values()].sort(
    (a, b) => b.goals - a.goals || a.name.localeCompare(b.name),
  );
}

/** Últimos partidos con resultado, del más reciente al más antiguo. */
export function finishedMatches(matches: OFMatch[]): FinishedMatch[] {
  return matches
    .filter((m) => m.score?.ft)
    .map((m) => ({
      date: m.date,
      team1: m.team1,
      team2: m.team2,
      ft: m.score!.ft as [number, number],
      round: m.round,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
