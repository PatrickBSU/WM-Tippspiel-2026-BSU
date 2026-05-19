import { createAdminClient } from "@/lib/supabase/server";
import { fetchWorldCupMatches, normalizeTeamName } from "@/lib/football-data";
import { scoreBet } from "@/lib/scoring";

export interface SyncResult {
  ok: boolean;
  updated: number;
  bets: number;
  error?: string;
}

export async function runSync(): Promise<SyncResult> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return { ok: false, updated: 0, bets: 0, error: "FOOTBALL_DATA_API_KEY fehlt" };

  const supabase = createAdminClient();
  const { data: dbMatches } = await supabase.from("matches").select("*");
  if (!dbMatches) return { ok: false, updated: 0, bets: 0, error: "Keine Spiele in DB" };

  let fdMatches;
  try {
    fdMatches = await fetchWorldCupMatches(apiKey);
  } catch (e: any) {
    return { ok: false, updated: 0, bets: 0, error: e.message };
  }

  let updated = 0;
  let recalculated = 0;

  for (const fd of fdMatches) {
    const homeDE = normalizeTeamName(fd.homeTeam.name);
    const awayDE = normalizeTeamName(fd.awayTeam.name);
    const dbMatch = dbMatches.find(m => m.home_team === homeDE && m.away_team === awayDE && Math.abs(new Date(m.kickoff).getTime() - new Date(fd.utcDate).getTime()) < 7 * 24 * 60 * 60 * 1000);
    if (!dbMatch) continue;

    const newData: any = { kickoff: fd.utcDate, status: fd.status, updated_at: new Date().toISOString() };
    if (fd.status === "FINISHED" && fd.score.fullTime.home !== null && fd.score.fullTime.away !== null) {
      newData.home_score = fd.score.fullTime.home;
      newData.away_score = fd.score.fullTime.away;
    }

    await supabase.from("matches").update(newData).eq("id", dbMatch.id);
    updated++;

    if (newData.home_score !== undefined && newData.away_score !== undefined) {
      const { data: bets } = await supabase.from("bets").select("*").eq("match_id", dbMatch.id);
      for (const bet of bets || []) {
        const points = scoreBet(bet.home_score, bet.away_score, newData.home_score, newData.away_score);
        await supabase.from("bets").update({ points }).eq("user_id", bet.user_id).eq("match_id", bet.match_id);
        recalculated++;
      }
    }
  }

  return { ok: true, updated, bets: recalculated };
}
