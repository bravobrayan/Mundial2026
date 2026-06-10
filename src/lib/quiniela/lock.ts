/** Un partido se bloquea al llegar su hora de inicio (kickoff). */
export function isMatchLocked(kickoff: string, now: number = Date.now()): boolean {
  return now >= new Date(kickoff).getTime();
}

/**
 * Cierre GLOBAL de la fase de grupos: al iniciar el 1er partido del Mundial
 * (11-jun 15:00 UTC-4). Después de esto, ningún grupo se puede modificar.
 */
export const GROUP_LOCK_AT = new Date("2026-06-11T19:00:00Z");
export function isGroupLocked(now: number = Date.now()): boolean {
  return now >= GROUP_LOCK_AT.getTime();
}
