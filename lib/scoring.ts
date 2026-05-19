export const POINTS_EXACT = 3;
export const POINTS_TENDENCY = 1;
export const POINTS_CHAMPION = 15;
export const POINTS_TOP_SCORER = 10;
export const POINTS_PER_GROUP_WINNER = 2;

export function scoreBet(tipHome: number, tipAway: number, resHome: number, resAway: number): number {
  if (tipHome === resHome && tipAway === resAway) return POINTS_EXACT;
  const tipTendency = Math.sign(tipHome - tipAway);
  const resTendency = Math.sign(resHome - resAway);
  if (tipTendency === resTendency) return POINTS_TENDENCY;
  return 0;
}

export function scoreChampion(tip: string | null, actual: string | null): number {
  if (!tip || !actual) return 0;
  return tip === actual ? POINTS_CHAMPION : 0;
}

export function scoreTopScorer(tip: string | null, actual: string | null): number {
  if (!tip || !actual) return 0;
  return tip.trim().toLowerCase() === actual.trim().toLowerCase() ? POINTS_TOP_SCORER : 0;
}

export function scoreGroupWinners(tip: Record<string, string>, actual: Record<string, string>): number {
  let pts = 0;
  for (const [grp, winner] of Object.entries(actual)) {
    if (tip[grp] === winner) pts += POINTS_PER_GROUP_WINNER;
  }
  return pts;
}
