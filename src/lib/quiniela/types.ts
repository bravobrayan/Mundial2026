export const GROUPS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupLetter = (typeof GROUPS)[number];

export type Team = {
  id: number;
  name: string;
  grp: string;
  flag: string | null;
};

export type Match = {
  id: number;
  stage: string;
  grp: string | null;
  matchday: number | null;
  kickoff: string;
  stadium: string | null;
  city: string | null;
  country: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  label: string | null;
};

export type ScorePrediction = {
  home: number | null;
  away: number | null;
  /** Eliminatorias: equipo que el usuario cree que pasa por penales (si predijo empate). */
  advance?: number | null;
};

/** Predicciones indexadas por match_id. */
export type PredMap = Record<number, ScorePrediction>;
