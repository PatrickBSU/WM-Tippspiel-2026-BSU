import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Flag from "@/components/Flag";
import { STAGE_LABELS } from "@/lib/data/schedule";
import { GROUPS } from "@/lib/data/teams";
import { normalizeName } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function ErgebnissePage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase.from("matches").select("*").lte("kickoff", new Date().toISOString()).order("kickoff", { ascending: false });
  const matchIds = (matches || []).map(m => m.id);

  let bets: any[] = [];
  if (matchIds.length > 0) {
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data } = await supabase.from("bets").select("match_id, home_score, away_score, points, user_id, profiles(display_name)").in("match_id", matchIds).range(from, from + PAGE - 1);
      if (!data || data.length === 0) break;
      bets = bets.concat(data);
      if (data.length < PAGE) break;
    }
  }

  const betsByMatch = new Map<number, any[]>();
  bets.forEach(b => {
    if (!betsByMatch.has(b.match_id)) betsByMatch.set(b.match_id, []);
    betsByMatch.get(b.match_id)!.push(b);
  });

  const { data: specialResults } = await supabase.from("special_results").select("champion, top_scorer, group_winners").eq("id", 1).single();
  const { data: specialBets } = await supabase.from("special_bets").select("champion, top_scorer, group_winners, profiles(display_name)");

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
                    <span className="text-sm font-mono text-muted">{new Date(m.kickoff).toLocaleString("de-AT", { timeZone: "Europe/Vienna",  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="font-medium inline-flex items-center gap-1"><Flag team={m.home_team} /> {m.home_team} – {m.away_team} <Flag team={m.away_team} /></span>
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
      {(() => {
        const champion = specialResults?.champion ?? null;
        if (!champion) return null;
        const tips = (specialBets ?? [])
          .map((b: any) => ({ name: b.profiles?.display_name ?? "?", pick: b.champion ?? null }))
          .filter((t: any) => t.pick)
          .sort((a: any, b: any) => {
            const ca = a.pick === champion ? 0 : 1;
            const cb = b.pick === champion ? 0 : 1;
            if (ca !== cb) return ca - cb;
            return String(a.name).localeCompare(String(b.name));
          });
        const correctCount = tips.filter((t: any) => t.pick === champion).length;
        return (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-tightest mb-1">Weltmeister</h2>
            <p className="text-muted text-sm mb-4">Wer hat den Weltmeister richtig getippt? · 15 Punkte</p>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-bg/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium inline-flex items-center gap-1"><Flag team={champion} /> {champion}</span>
                  <span className="text-xs text-muted">{correctCount} / {tips.length} richtig</span>
                </div>
              </div>
              {tips.length > 0 && (
                <div className="divide-y divide-border">
                  {tips.map((t: any, i: number) => {
                    const ok = t.pick === champion;
                    return (
                      <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                        <span>{t.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center gap-1 font-mono text-muted"><Flag team={t.pick} /> {t.pick}</span>
                          <span className={`font-mono font-bold w-8 text-right ${ok ? "text-win" : "text-muted"}`}>{ok ? 15 : 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {(() => {
        const topScorer = specialResults?.top_scorer ?? null;
        if (!topScorer) return null;
        const norm = (s: string) => normalizeName(s);
        const tips = (specialBets ?? [])
          .map((b: any) => ({ name: b.profiles?.display_name ?? "?", pick: b.top_scorer ?? null }))
          .filter((t: any) => t.pick)
          .sort((a: any, b: any) => {
            const ca = norm(a.pick) === norm(topScorer) ? 0 : 1;
            const cb = norm(b.pick) === norm(topScorer) ? 0 : 1;
            if (ca !== cb) return ca - cb;
            return String(a.name).localeCompare(String(b.name));
          });
        const correctCount = tips.filter((t: any) => norm(t.pick) === norm(topScorer)).length;
        return (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-tightest mb-1">Torschützenkönig</h2>
            <p className="text-muted text-sm mb-4">Wer hat den Torschützenkönig richtig getippt? · 10 Punkte</p>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border bg-bg/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-medium">{topScorer}</span>
                  <span className="text-xs text-muted">{correctCount} / {tips.length} richtig</span>
                </div>
              </div>
              {tips.length > 0 && (
                <div className="divide-y divide-border">
                  {tips.map((t: any, i: number) => {
                    const ok = norm(t.pick) === norm(topScorer);
                    return (
                      <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                        <span>{t.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-muted">{t.pick}</span>
                          <span className={`font-mono font-bold w-8 text-right ${ok ? "text-win" : "text-muted"}`}>{ok ? 10 : 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      {(() => {
        const actualGW: Record<string, string> = (specialResults?.group_winners as Record<string, string>) ?? {};
        const decided = Object.entries(GROUPS).filter(([code]) => actualGW[code]);
        if (decided.length === 0) return null;
        return (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold tracking-tightest mb-1">Gruppensieger</h2>
            <p className="text-muted text-sm mb-4">Wer hat den Gruppensieger richtig getippt? · 2 Punkte je Treffer</p>
            <div className="space-y-4">
              {decided.map(([code]) => {
                const winner = actualGW[code];
                const tips = (specialBets ?? [])
                  .map((b: any) => ({ name: b.profiles?.display_name ?? "?", pick: b.group_winners?.[code] ?? null }))
                  .filter((t: any) => t.pick)
                  .sort((a: any, b: any) => {
                    const ca = a.pick === winner ? 0 : 1;
                    const cb = b.pick === winner ? 0 : 1;
                    if (ca !== cb) return ca - cb;
                    return String(a.name).localeCompare(String(b.name));
                  });
                const correctCount = tips.filter((t: any) => t.pick === winner).length;
                return (
                  <div key={code} className="bg-surface border border-border rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-border bg-bg/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted">Gruppe {code}</span>
                          <span className="font-medium inline-flex items-center gap-1"><Flag team={winner} /> {winner}</span>
                        </div>
                        <span className="text-xs text-muted">{correctCount} / {tips.length} richtig</span>
                      </div>
                    </div>
                    {tips.length > 0 && (
                      <div className="divide-y divide-border">
                        {tips.map((t: any, i: number) => {
                          const ok = t.pick === winner;
                          return (
                            <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                              <span>{t.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="inline-flex items-center gap-1 font-mono text-muted"><Flag team={t.pick} /> {t.pick}</span>
                                <span className={`font-mono font-bold w-8 text-right ${ok ? "text-win" : "text-muted"}`}>{ok ? 2 : 0}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
