/**
 * Puntúa un pronóstico contra el resultado real.
 * Réplica EXACTA de public.score_prediction(ph,pa,rh,ra) en SQL:
 *   5 = marcador exacto · 3 = mismo signo (ganador/empate) ·
 *   1 = acertó los goles de un equipo · 0 = nada.
 */
export function scoreLine(
  ph: number | null,
  pa: number | null,
  rh: number | null,
  ra: number | null,
): number {
  if (ph == null || pa == null || rh == null || ra == null) return 0;
  if (ph === rh && pa === ra) return 5;
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return 3;
  if (ph === rh || pa === ra) return 1;
  return 0;
}

/**
 * Bonus de penales (+3). Réplica EXACTA de public.penalty_bonus(...) en SQL.
 * +3 si el usuario predijo empate (ph === pa), el partido real fue empate
 * (rh === ra → fue a penales) y acertó qué selección avanzó (pAdv === rAdv).
 */
export function penaltyBonus(
  ph: number | null,
  pa: number | null,
  pAdv: number | null,
  rh: number | null,
  ra: number | null,
  rAdv: number | null,
): number {
  if (ph == null || pa == null || rh == null || ra == null) return 0;
  if (ph === pa && rh === ra && pAdv != null && pAdv === rAdv) return 3;
  return 0;
}
