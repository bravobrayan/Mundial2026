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
