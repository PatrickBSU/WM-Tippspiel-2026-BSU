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

export function normalizeTeamName(englishName: string): string {
  return EN_TO_DE[englishName] || englishName;
}
