import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runSync } from "@/lib/sync";

export async function POST() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await runSync();
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ updated: result.updated, bets: result.bets });
}
