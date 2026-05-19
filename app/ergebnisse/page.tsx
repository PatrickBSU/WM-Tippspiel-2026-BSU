import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { flagOf } from "@/lib/data/teams";
import { STAGE_LABELS } from "@/lib/data/schedule";

export const dynamic = "force-dynamic";

export default async function ErgebnissePage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase.from("matches").select("*").lte("kickoff", new Date().toISOString()).order("kickoff", { ascending: false });
  const matchIds = (matches || []).map(m => m.id);

  let bets: any[] = [];
  if (matchIds.length > 0) {
    const { data } = await supabase.from("bets").select("match_id, home_score, away_score, points, user_id, profiles(display_name)").in("match_id", matchIds);
    bets = data || [];
  }

  const betsByMatch = new Map<number, any[]>();
  bets.forEach(b => {
    if (!betsByMatch.has(b.match_id)) betsByMatch.set(b.match_id, []);
    betsByMatch.get(b.match_id)!.push(b);
  });

  const stages = Array.from(new Set((matches || []).map(m => m.stage)));
  const selectedStage = searchParams.stage || (matches?.[0]?.stage);
  const filtered = (matches || []).filter(m => !selectedStage || m.stage === selectedStage);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Ergebnisse</h1>
      <p className="text-muted text-sm mb-6">Spiele mit Anpfiff in der Vergangenheit · Alle Tipps werden öffentlich</p>
      <div className="overflow-x-auto -mx-4 px-4 mb-6">
        <div className="flex gap-1 min-w-max">
          {stages.map(s => (<a key={s} href={`/ergebnisse?stage=${s}`} className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${s === selectedStage ? "bg-accent text-bg font-medium" : "text-muted hover:text-ink hover:bg-surface"}`}>{STAGE_LABELS[s] || s}</a>))}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.length === 0 && (<div className="text-muted text-center py-12">Noch keine Spiele angepfiffen.</div>)}
        {filtered.map(m => {
          const matchBets = (betsByMatch.get(m.id) || []).sort((a, b) => (b.points || 0) - (a.points || 0));
          const hasResult = m.home_score !== null && m.away_score !== null;
          return (
            <div key={m.id} className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-bg/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted">{new Date(m.kickoff).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="font-medium">{flagOf(m.home_team)} {m.home_team} – {m.away_team} {flagOf(m.away_team)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasResult ? (<span className="font-mono font-bold text-xl">{m.home_score} : {m.away_score}</span>) : (<span className="text-muted text-sm">läuft / kein Ergebnis</span>)}
                    <span className="text-xs text-muted">{matchBets.length} Tipps</span>
                  </div>
                </div>
              </div>
              {matchBets.length > 0 && (
                <div className="divide-y divide-border">
                  {matchBets.map((b, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                      <span>{b.profiles?.display_name || "?"}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-muted">{b.home_score} : {b.away_score}</span>
                        {b.points !== null && (<span className={`font-mono font-bold w-8 text-right ${b.points === 3 ? "text-win" : b.points === 1 ? "text-accent" : "text-muted"}`}>{b.points} P</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
