import { EN_TO_DE } from "./data/teams";

const BASE = "https://api.football-data.org/v4";

interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    duration?: string;
    fullTime: { home: number | null; away: number | null };
    regularTime?: { home: number | null; away: number | null } | null;
  };
}

export async function fetchWorldCupMatches(apiKey: string): Promise<FDMatch[]> {
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY fehlt");
  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { matches: FDMatch[] };
  return data.matches;
}

// Einzelnes Spiel abrufen: Detail-Endpoint liefert den vollstaendigen score-Node
// (duration/regularTime koennen im Listen-Endpoint gefoldet/weggelassen sein).
export async function fetchMatchDetail(apiKey: string, matchId: number): Promise<any> {
  const res = await fetch(`${BASE}/matches/${matchId}`, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data && data.match) ? data.match : data;
}

// Score-Teilobjekt tolerant lesen (v4 nutzt home/away, Doku-Beispiele teils homeTeam/awayTeam).
function pickScore(node: any): { home: number; away: number } | null {
  if (!node) return null;
  const h = (node.home !== undefined && node.home !== null) ? node.home : node.homeTeam;
  const a = (node.away !== undefined && node.away !== null) ? node.away : node.awayTeam;
  return (typeof h === "number" && typeof a === "number") ? { home: h, away: a } : null;
}

// 90-Minuten-Ergebnis aus einem score-Node ermitteln. null = nicht bestimmbar.
export function extract90(score: any): { home: number; away: number } | null {
  if (!score) return null;
  const ft = pickScore(score.fullTime);
  if (score.duration === "REGULAR") return ft;
  const reg = pickScore(score.regularTime);
  if (reg) return reg;
  if (score.duration === "EXTRA_TIME" || score.duration === "PENALTY_SHOOTOUT") {
    const et = pickScore(score.extraTime);
    const pen = pickScore(score.penalties);
    if (ft && (et || pen)) {
      return {
        home: ft.home - (et ? et.home : 0) - (pen ? pen.home : 0),
        away: ft.away - (et ? et.away : 0) - (pen ? pen.away : 0),
      };
    }
  }
  return null;
}

export function normalizeTeamName(englishName: string): string {
  return EN_TO_DE[englishName] || englishName;
}
