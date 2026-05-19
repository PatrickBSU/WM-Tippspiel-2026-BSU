import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminPanel from "@/components/AdminPanel";
import ManualOverride from "@/components/ManualOverride";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Kein Zugriff</h1>
        <p className="text-muted">Nur Admins.</p>
      </div>
    );
  }

  const { count: matchCount } = await supabase.from("matches").select("*", { count: "exact", head: true });
  const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: betCount } = await supabase.from("bets").select("*", { count: "exact", head: true });

  const { data: specialResults } = await supabase
    .from("special_results")
    .select("*")
    .eq("id", 1)
    .single();

  const { data: matches } = await supabase
    .from("matches")
    .select("id, stage, kickoff, home_team, away_team, home_score, away_score, status")
    .order("kickoff", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tightest">Admin</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card label="Nutzer" value={String(userCount || 0)} />
        <Card label="Spiele" value={String(matchCount || 0)} />
        <Card label="Tipps" value={String(betCount || 0)} />
      </div>

      <AdminPanel specialResults={specialResults} />
      <ManualOverride matches={matches || []} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="text-3xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}
