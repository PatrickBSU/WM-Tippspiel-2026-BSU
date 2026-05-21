import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import { STAGE_LABELS } from "@/lib/data/schedule";

export const dynamic = "force-dynamic";

export default async function TippenPage({ searchParams }: { searchParams: { stage?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase.from("matches").select("*").order("kickoff", { ascending: true });
  const { data: bets } = await supabase.from("bets").select("*").eq("user_id", user.id);
  const betMap = new Map((bets || []).map(b => [b.match_id, b]));

  const grouped: Record<string, typeof matches> = {};
  (matches || []).forEach(m => {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage]!.push(m);
  });

  const STAGE_ORDER = [
    "Gruppe A","Gruppe B","Gruppe C","Gruppe D","Gruppe E","Gruppe F",
    "Gruppe G","Gruppe H","Gruppe I","Gruppe J","Gruppe K","Gruppe L",
    "Achtelfinale","Viertelfinale","Halbfinale","Spiel um Platz 3","Finale"
  ];
  const stages = Object.keys(grouped).sort((a, b) => {
    const ia = STAGE_ORDER.indexOf(a);
    const ib = STAGE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const selectedStage = searchParams.stage && grouped[searchParams.stage] ? searchParams.stage : stages[0];
  const totalMatches = matches?.length || 0;
  const betCount = bets?.length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tightest">Tippen</h1>
          <p className="text-muted text-sm mt-1">{betCount} von {totalMatches} Spielen getippt Ã· Auto-Speicherung</p>
        </div>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 mb-6">
        <div className="flex gap-1 min-w-max">
          {stages.map(s => (
            <a key={s} href={`/tippen?stage=${s}`} className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${s === selectedStage ? "bg-accent text-bg font-medium" : "text-muted hover:text-ink hover:bg-surface"}`}>
              {STAGE_LABELS[s] || s}
            </a>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {(grouped[selectedStage] || []).map(m => (<MatchCard key={m.id} match={m} initialBet={betMap.get(m.id) || null} />))}
        {(!grouped[selectedStage] || grouped[selectedStage].length === 0) && (
          <div className="text-muted text-center py-12">Keine Spiele vorhanden. Admin muss Spielplan importieren.</div>
        )}
      </div>
    </div>
  );
}
