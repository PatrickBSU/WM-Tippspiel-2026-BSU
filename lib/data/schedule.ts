import { GROUPS } from "./teams";

export interface MatchSeed {
  id: number;
  stage: string;
  group_code: string | null;
  matchday: number | null;
  kickoff: string;
  home_team: string;
  away_team: string;
}

function isoUTC(year: number, month: number, day: number, hourUTC: number): string {
  return new Date(Date.UTC(year, month - 1, day, hourUTC, 0, 0)).toISOString();
}

export function generateGroupStage(): MatchSeed[] {
  const matches: MatchSeed[] = [];
  let id = 1;

  const matchdayDates = [
    ["2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15", "2026-06-15"],
    ["2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21"],
    ["2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-27", "2026-06-27"],
  ];
  const slotHoursUTC = [16, 19, 22, 1];

  const pairings = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[3, 0], [1, 2]],
  ];

  for (let md = 0; md < 3; md++) {
    let dayIdx = 0;
    let slotIdx = 0;
    for (const [groupCode, teams] of Object.entries(GROUPS)) {
      for (const [hIdx, aIdx] of pairings[md]) {
        const dateStr = matchdayDates[md][dayIdx];
        const [y, m, d] = dateStr.split("-").map(Number);
        const hour = slotHoursUTC[slotIdx];
        const kickoff = isoUTC(y, m, d, hour);
        matches.push({
          id: id++,
          stage: `GROUP_${groupCode}`,
          group_code: groupCode,
          matchday: md + 1,
          kickoff,
          home_team: teams[hIdx],
          away_team: teams[aIdx],
        });
        slotIdx++;
        if (slotIdx >= slotHoursUTC.length) {
          slotIdx = 0;
          dayIdx = Math.min(dayIdx + 1, matchdayDates[md].length - 1);
        }
      }
    }
  }
  return matches;
}

export function generateKnockoutStage(startId: number): MatchSeed[] {
  const matches: MatchSeed[] = [];
  let id = startId;

  const stages: { stage: string; count: number; date: string }[] = [
    { stage: "ROUND_OF_32", count: 16, date: "2026-06-28" },
    { stage: "ROUND_OF_16", count: 8, date: "2026-07-04" },
    { stage: "QUARTER_FINAL", count: 4, date: "2026-07-09" },
    { stage: "SEMI_FINAL", count: 2, date: "2026-07-14" },
    { stage: "THIRD_PLACE_FINAL", count: 1, date: "2026-07-18" },
    { stage: "FINAL", count: 1, date: "2026-07-19" },
  ];

  for (const { stage, count, date } of stages) {
    const [y, m, d] = date.split("-").map(Number);
    for (let i = 0; i < count; i++) {
      matches.push({
        id: id++,
        stage,
        group_code: null,
        matchday: null,
        kickoff: isoUTC(y, m, d, 19),
        home_team: "TBD",
        away_team: "TBD",
      });
    }
  }
  return matches;
}

export function generateFullSchedule(): MatchSeed[] {
  const group = generateGroupStage();
  const ko = generateKnockoutStage(group.length + 1);
  return [...group, ...ko];
}

export const STAGE_LABELS: Record<string, string> = {
  GROUP_A: "Gruppe A", GROUP_B: "Gruppe B", GROUP_C: "Gruppe C", GROUP_D: "Gruppe D",
  GROUP_E: "Gruppe E", GROUP_F: "Gruppe F", GROUP_G: "Gruppe G", GROUP_H: "Gruppe H",
  GROUP_I: "Gruppe I", GROUP_J: "Gruppe J", GROUP_K: "Gruppe K", GROUP_L: "Gruppe L",
  ROUND_OF_32: "Sechzehntelfinale",
  ROUND_OF_16: "Achtelfinale",
  QUARTER_FINAL: "Viertelfinale",
  SEMI_FINAL: "Halbfinale",
  THIRD_PLACE_FINAL: "Spiel um Platz 3",
  FINAL: "Finale",
};
