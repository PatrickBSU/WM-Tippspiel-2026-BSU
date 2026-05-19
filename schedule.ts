import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RanglistePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false });

  const rows = leaderboard || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Rangliste</h1>
      <p className="text-muted text-sm mb-6">
        Tagesaktuelle Auswertung · {rows.length} Tipper · zuletzt aktualisiert: {new Date().toLocaleString("de-AT")}
      </p>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-4 py-3 font-mono text-xs text-muted uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 font-mono text-xs text-muted uppercase tracking-wider">Tipper</th>
                <th className="text-right px-3 py-3 font-mono text-xs text-muted uppercase tracking-wider">Spiele</th>
                <th className="text-right px-3 py-3 font-mono text-xs text-muted uppercase tracking-wider hidden sm:table-cell">Volltreffer</th>
                <th className="text-right px-3 py-3 font-mono text-xs text-muted uppercase tracking-wider hidden md:table-cell">WM</th>
                <th className="text-right px-3 py-3 font-mono text-xs text-muted uppercase tracking-wider hidden md:table-cell">Schütze</th>
                <th className="text-right px-3 py-3 font-mono text-xs text-muted uppercase tracking-wider hidden md:table-cell">Gruppen</th>
                <th className="text-right px-4 py-3 font-mono text-xs text-muted uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isCurrentUser = r.id === user.id;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-border last:border-0 ${isCurrentUser ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono">
                      {i === 0 && "🥇"}
                      {i === 1 && "🥈"}
                      {i === 2 && "🥉"}
                      {i > 2 && <span className="text-muted">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.display_name}
                      {isCurrentUser && <span className="ml-2 text-xs text-accent">(du)</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">{r.match_points}</td>
                    <td className="px-3 py-3 text-right font-mono hidden sm:table-cell text-muted">{r.exact_hits}</td>
                    <td className="px-3 py-3 text-right font-mono hidden md:table-cell text-muted">{r.champion_points}</td>
                    <td className="px-3 py-3 text-right font-mono hidden md:table-cell text-muted">{r.top_scorer_points}</td>
                    <td className="px-3 py-3 text-right font-mono hidden md:table-cell text-muted">{r.group_winners_points}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-lg">{r.total_points}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted">
                    Noch keine Teilnehmer
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted">
        Spalten: <strong>Spiele</strong> = Punkte aus 104 WM-Spielen · <strong>Volltreffer</strong> = Anzahl exakt richtiger Ergebnisse · <strong>WM</strong>/<strong>Schütze</strong>/<strong>Gruppen</strong> = Sonderwetten-Punkte
      </div>
    </div>
  );
}
