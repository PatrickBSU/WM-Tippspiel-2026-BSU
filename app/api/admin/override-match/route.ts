import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { scoreBet } from "@/lib/scoring";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { match_id, home_score, away_score, home_team, away_team } = body;
  if (typeof match_id !== "number") return NextResponse.json({ error: "match_id fehlt" }, { status: 400 });

  const supabase = createAdminClient();
  const update: any = { updated_at: new Date().toISOString() };

  if (typeof home_team === "string") update.home_team = home_team;
  if (typeof away_team === "string") update.away_team = away_team;

  if (typeof home_score === "number" && typeof away_score === "number") {
    update.home_score = home_score;
    update.away_score = away_score;
    update.status = "FINISHED";
  } else if (home_score === null && away_score === null) {
    update.home_score = null;
    update.away_score = null;
    update.status = "SCHEDULED";
  }

  const { error } = await supabase.from("matches").update(update).eq("id", match_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let recalculated = 0;
  if (update.home_score !== undefined && update.home_score !== null) {
    const { data: bets } = await supabase.from("bets").select("*").eq("match_id", match_id);
    for (const bet of bets || []) {
      const points = scoreBet(bet.home_score, bet.away_score, update.home_score, update.away_score);
      await supabase.from("bets").update({ points }).eq("user_id", bet.user_id).eq("match_id", bet.match_id);
      recalculated++;
    }
  } else if (update.home_score === null) {
    await supabase.from("bets").update({ points: null }).eq("match_id", match_id);
  }

  return NextResponse.json({ ok: true, bets: recalculated });
}
