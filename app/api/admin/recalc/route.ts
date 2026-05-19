import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { scoreBet } from "@/lib/scoring";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createAdminClient();
  const { data: matches } = await supabase.from("matches").select("id, home_score, away_score, status").eq("status", "FINISHED");
  if (!matches) return NextResponse.json({ updated: 0 });

  let count = 0;
  for (const m of matches) {
    if (m.home_score === null || m.away_score === null) continue;
    const { data: bets } = await supabase.from("bets").select("*").eq("match_id", m.id);
    for (const bet of bets || []) {
      const points = scoreBet(bet.home_score, bet.away_score, m.home_score, m.away_score);
      if (points !== bet.points) {
        await supabase.from("bets").update({ points }).eq("user_id", bet.user_id).eq("match_id", bet.match_id);
        count++;
      }
    }
  }

  return NextResponse.json({ updated: count });
}
