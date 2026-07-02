import { createAdminClient } from "@/lib/supabase/server";
import { fetchWorldCupMatches, normalizeTeamName, fetchMatchDetail, extract90 } from "@/lib/football-data";
import { scoreBet } from "@/lib/scoring";

export interface SyncResult {
  ok: boolean;
  updated: number;
  bets: number;
  error?: string;
}

// football-data Stage-Namen -> interne Stage-Keys (tolerant, da WM-2026-Labels variieren koennen).
// Nach Start der KO-Phase pruefen, ob die Zuordnung zu den echten football-data-Stages passt.
function mapKnockoutStage(fdStage: string): string | null {
  const s = (fdStage || "").toUpperCase();
  if (s.includes("32")) return "ROUND_OF_32";
  if (s.includes("LAST_16") || s.includes("ROUND_OF_16") || s.includes("16")) return "ROUND_OF_16";
  if (s.includes("QUARTER")) return "QUARTER_FINAL";
  if (s.includes("SEMI")) return "SEMI_FINAL";
  if (s.includes("THIRD") || s.includes("3RD") || s.includes("PLAYOFF") || s.includes("PLAY_OFF")) return "THIRD_PLACE_FINAL";
  if (s.includes("FINAL")) return "FINAL";
  return null;
}

function isGroupMatch(fd: any): boolean {
  if (fd.group) return true;
  const s = (fd.stage || "").toUpperCase();
  return s.includes("GROUP") || s === "REGULAR_SEASON";
}

// Ungeordneter Schluessel fuer ein Team-Paar (Heim/Auswaerts-Reihenfolge egal).
function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
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

  // Gruppen-Spiele werden ueber ein UNGEORDNETES Team-Set zugeordnet. Heim/Auswaerts-Reihenfolge
  // kann zwischen Seed und football-data abweichen (z.B. Spanien-Kap Verde vs. Kap Verde-Spanien);
  // bei umgekehrter Orientierung werden die Tore unten passend getauscht.
  const groupByTeams = new Map<string, any>();
  for (const m of dbMatches) {
    if (m.stage && m.stage.indexOf("GROUP_") === 0) {
      groupByTeams.set(pairKey(m.home_team, m.away_team), m);
    }
  }

  // KO-Spiele werden ueber Stage + Reihenfolge zugeordnet (funktioniert auch solange Teams "TBD" sind).
  const koStages = ["ROUND_OF_32", "ROUND_OF_16", "QUARTER_FINAL", "SEMI_FINAL", "THIRD_PLACE_FINAL", "FINAL"];
  const fdKoByStage: Record<string, any[]> = {};
  for (const fd of fdMatches) {
    if (isGroupMatch(fd)) continue;
    const st = mapKnockoutStage(fd.stage);
    if (!st) continue;
    if (!fdKoByStage[st]) fdKoByStage[st] = [];
    fdKoByStage[st].push(fd);
  }
  const koByFdId = new Map<number, any>();
  for (const st of koStages) {
    const dbList = dbMatches.filter((m: any) => m.stage === st).sort((a: any, b: any) => a.id - b.id);
    const fdList = (fdKoByStage[st] || []).slice().sort((a: any, b: any) => {
      const ta = new Date(a.utcDate).getTime();
      const tb = new Date(b.utcDate).getTime();
      return ta !== tb ? ta - tb : a.id - b.id;
    });
    const n = Math.min(dbList.length, fdList.length);
    for (let i = 0; i < n; i++) koByFdId.set(fdList[i].id, dbList[i]);
  }

  let updated = 0;
  let recalculated = 0;

  for (const fd of fdMatches) {
    let dbMatch: any = null;
    const group = isGroupMatch(fd);
    let swapScores = false;

    if (group) {
      const homeDE = normalizeTeamName(fd.homeTeam ? fd.homeTeam.name : "");
      const awayDE = normalizeTeamName(fd.awayTeam ? fd.awayTeam.name : "");
      dbMatch = groupByTeams.get(pairKey(homeDE, awayDE)) || null;
      // Wenn die DB das Spiel andersherum fuehrt als football-data, Tore drehen.
      if (dbMatch && dbMatch.home_team !== homeDE) swapScores = true;
    } else {
      dbMatch = koByFdId.get(fd.id) || null;
    }
    if (!dbMatch) continue;

    // Bereits final gewertete Spiele nicht mehr anfassen (schuetzt manuelle Korrekturen,
    // spart API-Detailabrufe und verhindert erneutes Ueberschreiben mit Verlaengerungs-Ergebnissen).
    if (dbMatch.status === "FINISHED" && dbMatch.home_score !== null && dbMatch.away_score !== null) continue;

    const newData: any = { kickoff: fd.utcDate, status: fd.status, updated_at: new Date().toISOString() };

    // Nur bei KO-Spielen Team-Namen aus football-data uebernehmen, sobald die Paarung feststeht.
    // Gruppen-Namen bleiben unveraendert (verhindert Ueberschreiben mit englischen Namen).
    if (!group) {
      const homeName = fd.homeTeam ? fd.homeTeam.name : null;
      const awayName = fd.awayTeam ? fd.awayTeam.name : null;
      if (homeName && awayName) {
        newData.home_team = normalizeTeamName(homeName);
        newData.away_team = normalizeTeamName(awayName);
      }
    }

    if (fd.status === "FINISHED" && fd.score.fullTime.home !== null && fd.score.fullTime.away !== null) {
      // Tore immer in DB-Orientierung schreiben (so wie die Nutzer getippt haben).
      // KO-Spiele nach regulaerer Spielzeit (90 Min) bewerten, nicht nach Verlaengerung/Elfmeter:
      // fullTime enthaelt bei duration != REGULAR das Endergebnis inkl. ET/Elfmeter, 90 Min steht in regularTime.
      let sHome = fd.score.fullTime.home;
      let sAway = fd.score.fullTime.away;
      if (!group) {
        // 90-Min-Ergebnis ermitteln; der Listen-Endpoint foldet duration/regularTime
        // teils weg -> dann einmalig das Match-Detail nachladen.
        let s90 = extract90(fd.score);
        if (!s90 || !fd.score.duration) {
          try {
            const detail = await fetchMatchDetail(apiKey, fd.id);
            const d90 = extract90(detail && detail.score);
            if (d90) s90 = d90;
          } catch (e) {
            // Detail nicht verfuegbar -> fullTime als Fallback
          }
        }
        if (s90) { sHome = s90.home; sAway = s90.away; }
      }
      newData.home_score = swapScores ? sAway : sHome;
      newData.away_score = swapScores ? sHome : sAway;
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
