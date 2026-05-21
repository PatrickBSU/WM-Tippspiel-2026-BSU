"use client";

import { useState } from "react";
import { ALL_TEAMS, flagOf } from "@/lib/data/teams";

interface Match {
  id: number;
  stage: string;
  kickoff: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

export default function ManualOverride({ matches }: { matches: Match[] }) {
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const selected = matches.find(m => m.id === selectedId);
  const isKO = selected && !selected.stage.startsWith("GROUP_");

  function selectMatch(id: number | "") {
    setSelectedId(id);
    setMsg("");
    const m = matches.find(x => x.id === id);
    if (m) {
      setHomeScore(m.home_score !== null ? String(m.home_score) : "");
      setAwayScore(m.away_score !== null ? String(m.away_score) : "");
      setHomeTeam(m.home_team);
      setAwayTeam(m.away_team);
    }
  }

  async function save() {
    if (!selectedId) return;
    setBusy(true);
    setMsg("");
    const payload: any = { match_id: selectedId };

    if (isKO && (homeTeam !== selected!.home_team || awayTeam !== selected!.away_team)) {
      payload.home_team = homeTeam;
      payload.away_team = awayTeam;
    }
    if (homeScore !== "" && awayScore !== "") {
      payload.home_score = parseInt(homeScore, 10);
      payload.away_score = parseInt(awayScore, 10);
    }

    const res = await fetch("/api/admin/override-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setMsg(res.ok ? `✓ Gespeichert. ${data.bets} Tipps neu bewertet.` : `✗ ${data.error}`);
    setBusy(false);
  }

  async function reset() {
    if (!selectedId) return;
    if (!confirm("Ergebnis wirklich zurücksetzen? Alle Punkte für dieses Spiel werden auf null gesetzt.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/override-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: selectedId, home_score: null, away_score: null }),
    });
    const data = await res.json();
    setMsg(res.ok ? "✓ Ergebnis zurückgesetzt" : `✗ ${data.error}`);
    setHomeScore("");
    setAwayScore("");
    setBusy(false);
  }

  return (
    <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="font-display font-bold text-xl">Manuelles Spiel-Override</h2>
        <p className="text-sm text-muted mt-1">
          Für K.O.-Phase Teams setzen, falsche Ergebnisse korrigieren, Resultate manuell eintragen wenn API ausfällt.
        </p>
      </div>

      <select
        value={selectedId}
        onChange={e => selectMatch(e.target.value ? parseInt(e.target.value, 10) : "")}
        className="w-full px-3 py-2 bg-bg border border-border rounded-md"
      >
        <option value="">– Spiel wählen –</option>
        {matches.map(m => {
          const date = new Date(m.kickoff).toLocaleDateString("de-AT", { timeZone: "Europe/Vienna",  day: "2-digit", month: "2-digit" });
          const score = m.home_score !== null ? ` [${m.home_score}:${m.away_score}]` : "";
          return (
            <option key={m.id} value={m.id}>
              {date} {m.stage}: {m.home_team} – {m.away_team}{score}
            </option>
          );
        })}
      </select>

      {selected && (
        <div className="space-y-4 pt-2 border-t border-border">
          {isKO && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted block mb-1">Heim-Team</label>
                <select value={homeTeam} onChange={e => setHomeTeam(e.target.value)} className="w-full px-2 py-1.5 bg-bg border border-border rounded-md text-sm">
                  <option value="TBD">TBD</option>
                  {ALL_TEAMS.map(t => <option key={t} value={t}>{flagOf(t)} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Auswärts-Team</label>
                <select value={awayTeam} onChange={e => setAwayTeam(e.target.value)} className="w-full px-2 py-1.5 bg-bg border border-border rounded-md text-sm">
                  <option value="TBD">TBD</option>
                  {ALL_TEAMS.map(t => <option key={t} value={t}>{flagOf(t)} {t}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted block mb-1">Endergebnis</label>
            <div className="flex items-center gap-3">
              <span className="flex-1 text-right text-sm">{flagOf(homeTeam)} {homeTeam}</span>
              <input type="number" min={0} max={20} value={homeScore} onChange={e => setHomeScore(e.target.value)} className="w-16 score-input" />
              <span className="text-muted">:</span>
              <input type="number" min={0} max={20} value={awayScore} onChange={e => setAwayScore(e.target.value)} className="w-16 score-input" />
              <span className="flex-1 text-sm">{awayTeam} {flagOf(awayTeam)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={save} disabled={busy} className="px-4 py-2 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 text-sm">
              {busy ? "..." : "Speichern & Punkte vergeben"}
            </button>
            {selected.home_score !== null && (
              <button onClick={reset} disabled={busy} className="px-4 py-2 bg-bg border border-loss/40 text-loss rounded-md hover:bg-loss/10 disabled:opacity-50 text-sm">
                Ergebnis zurücksetzen
              </button>
            )}
          </div>
          {msg && <div className={`text-sm ${msg.startsWith("✓") ? "text-win" : "text-loss"}`}>{msg}</div>}
        </div>
      )}
    </section>
  );
}
