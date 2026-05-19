import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { scoreChampion, scoreTopScorer, scoreGroupWinners } from "@/lib/scoring";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createAdminClient();

  const { data: results } = await supabase
    .from("special_results")
    .select("*")
    .eq("id", 1)
    .single();

  if (!results) return NextResponse.json({ error: "Keine Sonderwetten-Ergebnisse" }, { status: 400 });

  const { data: bets } = await supabase.from("special_bets").select("*");
  let updated = 0;

  for (const bet of bets || []) {
    const cp = scoreChampion(bet.champion, results.champion);
    const tp = scoreTopScorer(bet.top_scorer, results.top_scorer);
    const gp = scoreGroupWinners(bet.group_winners || {}, results.group_winners || {});
    await supabase
      .from("special_bets")
      .update({
        champion_points: cp,
        top_scorer_points: tp,
        group_winners_points: gp,
      })
      .eq("user_id", bet.user_id);
    updated++;
  }

  return NextResponse.json({ updated });
}
