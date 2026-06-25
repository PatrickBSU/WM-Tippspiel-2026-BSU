import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const champion = body.champion || null;
  const top_scorer = body.top_scorer || null;
  const group_winners = body.group_winners ?? {};

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("special_results")
    .update({ champion, top_scorer, group_winners, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
