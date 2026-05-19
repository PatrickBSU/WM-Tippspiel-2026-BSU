import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { generateFullSchedule } from "@/lib/data/schedule";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createAdminClient();
  const matches = generateFullSchedule();

  const { error, count } = await supabase.from("matches").upsert(matches, { onConflict: "id", count: "exact" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inserted: count || matches.length });
}
