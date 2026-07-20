export const POINTS_EXACT = 3;
export const POINTS_TENDENCY = 1;
export const POINTS_CHAMPION = 15;
export const POINTS_TOP_SCORER = 10;
export const POINTS_PER_GROUP_WINNER = 2;

// Normalisiert Namen für den Vergleich: Akzente/Diakritika entfernen,
// Groß-/Kleinschreibung, Rand- und Mehrfach-Leerzeichen egalisieren.
// So zählt z. B. "Kylian Mbappé", "kylian mbappe" oder "Kylian  Mbappe"
// alle als korrekt, wenn das Ist-Ergebnis "Kylian Mbappe" ist.
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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
  return normalizeName(tip) === normalizeName(actual) ? POINTS_TOP_SCORER : 0;
}

export function scoreGroupWinners(tip: Record<string, string>, actual: Record<string, string>): number {
  let pts = 0;
  for (const [grp, winner] of Object.entries(actual)) {
    if (tip[grp] === winner) pts += POINTS_PER_GROUP_WINNER;
  }
  return pts;
}
