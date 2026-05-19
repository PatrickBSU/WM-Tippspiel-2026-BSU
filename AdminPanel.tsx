import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { flagOf } from "@/lib/data/teams";

export default async function Dashboard({ userId }: { userId: string }) {
  const supabase = createClient();

  // Profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();

  // Eigene Position in Rangliste
  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("id, display_name, total_points, exact_hits")
    .order("total_points", { ascending: false });
  const myRank = (leaderboard || []).findIndex(r => r.id === userId) + 1;
  const me = (leaderboard || []).find(r => r.id === userId);
  const totalUsers = leaderboard?.length || 0;

  // Nächste 5 Spiele (ab jetzt)
  const { data: nextMatches } = await supabase
    .from("matches")
    .select("*")
    .gt("kickoff", new Date().toISOString())
    .order("kickoff", { ascending: true })
    .limit(5);

  // Letzte 3 beendete Spiele
  const { data: recentMatches } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "FINISHED")
    .order("kickoff", { ascending: false })
    .limit(3);

  // Eigene Tipps für die nächsten Spiele
  const nextIds = (nextMatches || []).map(m => m.id);
  const { data: myBets } = nextIds.length > 0
    ? await supabase.from("bets").select("*").eq("user_id", userId).in("match_id", nextIds)
    : { data: [] };
  const betMap = new Map((myBets || []).map(b => [b.match_id, b]));

  // Tipp-Statistik
  const { count: totalMatches } = await supabase.from("matches").select("*", { count: "exact", head: true });
  const { count: myBetCount } = await supabase.from("bets").select("*", { count: "exact", head: true }).eq("user_id", userId);

  // Deadline für Sonderwetten
  const deadline = process.env.NEXT_PUBLIC_TIPP_DEADLINE
    ? new Date(process.env.NEXT_PUBLIC_TIPP_DEADLINE)
    : new Date("2026-06-11T20:00:00+02:00");
  const daysUntil = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="text-accent text-sm font-mono mb-1">SERVUS</div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tightest">
          {profile?.display_name || "Tipper"}
        </h1>
      </div>

      {/* Stat-Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Dein Rang"
          value={myRank > 0 ? `${myRank}.` : "–"}
          sub={totalUsers > 0 ? `von ${totalUsers}` : ""}
          highlight={myRank <= 3 && myRank > 0}
        />
        <StatCard
          label="Gesamtpunkte"
          value={String(me?.total_points || 0)}
          sub={`${me?.exact_hits || 0} Volltreffer`}
        />
        <StatCard
          label="Getippt"
          value={`${myBetCount || 0}`}
          sub={`von ${totalMatches || 0} Spielen`}
        />
        <StatCard
          label={daysUntil > 0 ? "Tage bis WM" : "WM läuft"}
          value={daysUntil > 0 ? String(daysUntil) : "🔴"}
          sub={daysUntil > 0 ? deadline.toLocaleDateString("de-AT") : "live"}
        />
      </div>

      {/* Nächste Spiele */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-2xl font-bold tracking-tightest">Nächste Spiele</h2>
          <Link href="/tippen" className="text-sm text-accent hover:underline">
            Alle Spiele →
          </Link>
        </div>
        <div className="space-y-2">
          {(nextMatches || []).map(m => {
            const bet = betMap.get(m.id);
            const kickoff = new Date(m.kickoff);
            return (
              <Link
                key={m.id}
                href={`/tippen?stage=${m.stage}`}
                className="block bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-mono w-24">
                      {kickoff.toLocaleString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      <br />
                      <span className="text-ink">{kickoff.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                    <span className="font-medium">
                      {flagOf(m.home_team)} {m.home_team} – {m.away_team} {flagOf(m.away_team)}
                    </span>
                  </div>
                  <div className="text-sm">
                    {bet ? (
                      <span className="font-mono text-accent">
                        Dein Tipp: {bet.home_score} : {bet.away_score}
                      </span>
                    ) : (
                      <span className="text-muted">noch nicht getippt</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
          {(!nextMatches || nextMatches.length === 0) && (
            <div className="text-muted text-center py-8 bg-surface border border-border rounded-lg">
              Keine Spiele eingeplant. Admin muss Spielplan importieren.
            </div>
          )}
        </div>
      </section>

      {/* Letzte Ergebnisse */}
      {recentMatches && recentMatches.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-2xl font-bold tracking-tightest">Letzte Ergebnisse</h2>
            <Link href="/ergebnisse" className="text-sm text-accent hover:underline">
              Alle Ergebnisse →
            </Link>
          </div>
          <div className="space-y-2">
            {recentMatches.map(m => (
              <div key={m.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
                <span className="font-medium">
                  {flagOf(m.home_team)} {m.home_team} – {m.away_team} {flagOf(m.away_team)}
                </span>
                <span className="font-mono font-bold">{m.home_score} : {m.away_score}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-surface border rounded-lg p-4 ${highlight ? "border-accent" : "border-border"}`}>
      <div className="text-xs text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-display text-3xl font-bold ${highlight ? "text-accent" : ""}`}>{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}
