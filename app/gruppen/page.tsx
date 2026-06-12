import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Flag from "@/components/Flag";
import { GROUPS } from "@/lib/data/teams";

export const dynamic = "force-dynamic";

interface Row {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

function buildTable(teams: string[], matches: any[]): Row[] {
  const rows = new Map<string, Row>();
  teams.forEach(t => rows.set(t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
  for (const m of matches) {
    if (m.home_score === null || m.away_score === null) continue;
    const h = rows.get(m.home_team);
    const a = rows.get(m.away_team);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.won++; a.lost++; h.points += 3; }
    else if (m.home_score < m.away_score) { a.won++; h.lost++; a.points += 3; }
    else { h.drawn++; a.drawn++; h.points += 1; a.points += 1; }
  }
  const arr = Array.from(rows.values());
  arr.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    const dx = x.gf - x.ga;
    const dy = y.gf - y.ga;
    if (dy !== dx) return dy - dx;
    if (y.gf !== x.gf) return y.gf - x.gf;
    const duel = matches.find(m => m.home_score !== null && m.away_score !== null && ((m.home_team === x.team && m.away_team === y.team) || (m.home_team === y.team && m.away_team === x.team)));
    if (duel) {
      const xg = duel.home_team === x.team ? duel.home_score : duel.away_score;
      const yg = duel.home_team === y.team ? duel.home_score : duel.away_score;
      if (yg !== xg) return yg - xg;
    }
    return x.team.localeCompare(y.team, "de");
  });
  return arr;
}

function diffLabel(r: Row): string {
  const d = r.gf - r.ga;
  return d > 0 ? "+" + d : String(d);
}

export default async function GruppenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .not("group_code", "is", null)
    .order("kickoff", { ascending: true });

  const tables = Object.entries(GROUPS).map(([code, teams]) => ({
    code,
    rows: buildTable(teams, (matches || []).filter(m => m.group_code === code)),
  }));

  const thirds = tables
    .map(t => ({ code: t.code, row: t.rows[2] }))
    .filter(t => !!t.row)
    .sort((a, b) =>
      b.row.points - a.row.points ||
      (b.row.gf - b.row.ga) - (a.row.gf - a.row.ga) ||
      b.row.gf - a.row.gf ||
      a.row.team.localeCompare(b.row.team, "de")
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Gruppen</h1>
      <p className="text-muted text-sm mb-6">Aktuelle Tabellenstände · Erster und Zweiter jeder Gruppe sowie die 8 besten Dritten erreichen das Sechzehntelfinale</p>
      <div className="grid md:grid-cols-2 gap-4">
        {tables.map(({ code, rows }) => (
          <div key={code} className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-bg/30 font-display font-bold">Gruppe {code}</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs">
                  <th className="text-left font-normal pl-4 py-1.5 w-7">#</th>
                  <th className="text-left font-normal">Team</th>
                  <th className="text-center font-normal w-8">Sp</th>
                  <th className="text-center font-normal w-7">S</th>
                  <th className="text-center font-normal w-7">U</th>
                  <th className="text-center font-normal w-7">N</th>
                  <th className="text-center font-normal w-12">Tore</th>
                  <th className="text-center font-normal w-9">+/-</th>
                  <th className="text-center font-normal w-10 pr-4">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.team} className={"border-t border-border " + (i < 2 ? "bg-win/5" : "")}>
                    <td className={"pl-4 py-1.5 font-mono text-xs " + (i < 2 ? "text-win font-bold" : "text-muted")}>{i + 1}</td>
                    <td className="font-medium"><span className="inline-flex items-center gap-1.5"><Flag team={r.team} /> {r.team}</span></td>
                    <td className="text-center font-mono">{r.played}</td>
                    <td className="text-center font-mono">{r.won}</td>
                    <td className="text-center font-mono">{r.drawn}</td>
                    <td className="text-center font-mono">{r.lost}</td>
                    <td className="text-center font-mono">{r.gf}:{r.ga}</td>
                    <td className="text-center font-mono">{diffLabel(r)}</td>
                    <td className="text-center font-mono font-bold pr-4">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-bg/30 font-display font-bold">Beste Gruppendritte</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs">
              <th className="text-left font-normal pl-4 py-1.5 w-7">#</th>
              <th className="text-left font-normal w-20">Gruppe</th>
              <th className="text-left font-normal">Team</th>
              <th className="text-center font-normal w-8">Sp</th>
              <th className="text-center font-normal w-12">Tore</th>
              <th className="text-center font-normal w-9">+/-</th>
              <th className="text-center font-normal w-10 pr-4">Pkt</th>
            </tr>
          </thead>
          <tbody>
            {thirds.map((t, i) => (
              <tr key={t.row.team} className={"border-t border-border " + (i < 8 ? "bg-win/5" : "")}>
                <td className={"pl-4 py-1.5 font-mono text-xs " + (i < 8 ? "text-win font-bold" : "text-muted")}>{i + 1}</td>
                <td className="font-mono text-xs text-muted">{t.code}</td>
                <td className="font-medium"><span className="inline-flex items-center gap-1.5"><Flag team={t.row.team} /> {t.row.team}</span></td>
                <td className="text-center font-mono">{t.row.played}</td>
                <td className="text-center font-mono">{t.row.gf}:{t.row.ga}</td>
                <td className="text-center font-mono">{diffLabel(t.row)}</td>
                <td className="text-center font-mono font-bold pr-4">{t.row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-2 text-xs text-muted border-t border-border">Reihung: Punkte, Tordifferenz, erzielte Tore. Grün hinterlegt = aktuell fürs Sechzehntelfinale qualifiziert.</p>
      </div>
    </div>
  );
}
