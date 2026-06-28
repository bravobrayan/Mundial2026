/**
 * Mapa FIJO del cuadro del Mundial 2026 (estructura oficial de avance).
 * Para cada partido de eliminatoria, a qué partido/lado va su GANADOR.
 * Sirve para que, al cargar el resultado real de un partido, el ganador
 * (y en semis el perdedor → 3er puesto) se coloque solo en la ronda siguiente.
 *
 * Estructura:
 *   Octavos:  90=G73/G75 · 89=G74/G77 · 91=G76/G78 · 92=G79/G80
 *             93=G83/G84 · 94=G81/G82 · 95=G86/G88 · 96=G85/G87
 *   Cuartos:  97=G89/G90 · 98=G93/G94 · 99=G91/G92 · 100=G95/G96
 *   Semis:    101=G97/G98 · 102=G99/G100
 *   3er/Final:103=P101/P102 · 104=G101/G102
 */
export type Slot = { match: number; slot: "home" | "away" };

export const WINNER_TO: Record<number, Slot> = {
  // → Octavos
  73: { match: 90, slot: "home" },
  75: { match: 90, slot: "away" },
  74: { match: 89, slot: "home" },
  77: { match: 89, slot: "away" },
  76: { match: 91, slot: "home" },
  78: { match: 91, slot: "away" },
  79: { match: 92, slot: "home" },
  80: { match: 92, slot: "away" },
  83: { match: 93, slot: "home" },
  84: { match: 93, slot: "away" },
  81: { match: 94, slot: "home" },
  82: { match: 94, slot: "away" },
  86: { match: 95, slot: "home" },
  88: { match: 95, slot: "away" },
  85: { match: 96, slot: "home" },
  87: { match: 96, slot: "away" },
  // → Cuartos
  89: { match: 97, slot: "home" },
  90: { match: 97, slot: "away" },
  93: { match: 98, slot: "home" },
  94: { match: 98, slot: "away" },
  91: { match: 99, slot: "home" },
  92: { match: 99, slot: "away" },
  95: { match: 100, slot: "home" },
  96: { match: 100, slot: "away" },
  // → Semis
  97: { match: 101, slot: "home" },
  98: { match: 101, slot: "away" },
  99: { match: 102, slot: "home" },
  100: { match: 102, slot: "away" },
  // → Final
  101: { match: 104, slot: "home" },
  102: { match: 104, slot: "away" },
};

/** Perdedores de semifinales → partido por el 3er puesto (103). */
export const LOSER_TO: Record<number, Slot> = {
  101: { match: 103, slot: "home" },
  102: { match: 103, slot: "away" },
};
