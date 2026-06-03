"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Flag from "@/components/Flag";

interface Match {
  id: number;
  kickoff: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface Bet {
  match_id: number;
  home_score: number;
  away_score: number;
  points: number | null;
}

interface Props {
  match: Match;
  initialBet: Bet | null;
}

export default function MatchCard({ match, initialBet }: Props) {
  const [home, setHome] = useState<string>(initialBet ? String(initialBet.home_score) : "");
  const [away, setAway] = useState<string>(initialBet ? String(initialBet.away_score) : "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const kickoff = new Date(match.kickoff);
  const isLocked = kickoff.getTime() <= Date.now();
  const isPlayed = match.status === "FINISHED";

  useEffect(() => {
    if (!home || !away || isLocked) return;
    const hN = parseInt(home, 10);
    const aN = parseInt(away, 10);
    if (isNaN(hN) || isNaN(aN) || hN < 0 || aN < 0) return;
    if (initialBet && initialBet.home_score === hN && initialBet.away_score === aN) return;

    const t = setTimeout(async () => {
      setStatus("saving");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("bets").upsert({
        user_id: user.id,
        match_id: match.id,
        home_score: hN,
        away_score: aN,
      });
      setStatus(error ? "error" : "saved");
      setTimeout(() => setStatus("idle"), 1500);
    }, 800);
    return () => clearTimeout(t);
  }, [home, away, match.id, initialBet, isLocked]);

  return (
    <div className={`bg-surface border border-border rounded-lg p-4 ${isLocked ? "opacity-90" : ""}`}>
      <div className="flex items-center justify-between mb-3 text-xs text-muted">
        <span>{new Intl.DateTimeFormat("de-AT", { timeZone: "Europe/Vienna", weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(kickoff)}</span>
        <span className="font-mono">
          {isPlayed ? "â Beendet" : isLocked ? "ð Gestartet" : status === "saved" ? "â Gespeichert" : status === "saving" ? "..." : ""}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-right">
          <Flag team={match.home_team} className="mr-2" />
          <span className="font-medium">{match.home_team}</span>
        </div>

        <div className="flex items-center gap-2">
          <input type="number" min={0} max={20} value={home} onChange={e => setHome(e.target.value)} disabled={isLocked} className="score-input" />
          <span className="text-muted">:</span>
          <input type="number" min={0} max={20} value={away} onChange={e => setAway(e.target.value)} disabled={isLocked} className="score-input" />
        </div>

        <div className="flex-1">
          <span className="font-medium">{match.away_team}</span>
          <Flag team={match.away_team} className="ml-2" />
        </div>
      </div>

      {isPlayed && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted">Ergebnis</span>
          <span className="font-mono font-bold">{match.home_score} : {match.away_score}</span>
          {initialBet && initialBet.points !== null && (
            <span className={`font-mono font-bold ${initialBet.points === 3 ? "text-win" : initialBet.points === 1 ? "text-accent" : "text-muted"}`}>
              {initialBet.points} P
            </span>
          )}
        </div>
      )}
    </div>
  );
}
