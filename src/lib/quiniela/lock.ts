/** Un partido se bloquea al llegar su hora de inicio (kickoff). */
export function isMatchLocked(kickoff: string, now: number = Date.now()): boolean {
  return now >= new Date(kickoff).getTime();
}
