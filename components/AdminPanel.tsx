"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GROUPS, ALL_TEAMS, flagOf } from "@/lib/data/teams";

interface SpecialResults {
  champion: string | null;
  top_scorer: string | null;
  group_winners: Record<string, string>;
}

export default function AdminPanel({ specialResults }: { specialResults: SpecialResults | null }) {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const [champion, setChampion] = useState(specialResults?.champion || "");
  const [topScorer, setTopScorer] = useState(specialResults?.top_scorer || "");
  const [groupWinners, setGroupWinners] = useState<Record<string, string>>(
    specialResults?.group_winners || {}
  );

  function addLog(msg: string) {
    setLog(l => [...l, `[${new Date().toLocaleTimeString("de-AT", { timeZone: "Europe/Vienna" })}] ${msg}`]);
  }

  async function seedSchedule() {
    setBusy(true);
    addLog("Erzeuge Spielplan...");
    const res = await fetch("/api/admin/seed-schedule", { method: "POST" });
    const data = await res.json();
    addLog(res.ok ? `✓ ${data.inserted} Spiele eingefügt` : `✗ Fehler: ${data.error}`);
    setBusy(false);
  }

  async function syncResults() {
    setBusy(true);
    addLog("Synchronisiere mit football-data.org...");
    const res = await fetch("/api/admin/sync-results", { method: "POST" });
    const data = await res.json();
    addLog(res.ok ? `✓ ${data.updated} Spiele aktualisiert, ${data.bets} Tipps neu bewertet` : `✗ ${data.error}`);
    setBusy(false);
  }

  async function recalc() {
    setBusy(true);
    addLog("Berechne alle Punkte neu...");
    const res = await fetch("/api/admin/recalc", { method: "POST" });
    const data = await res.json();
    addLog(res.ok ? `✓ ${data.updated} Tipps neu bewertet` : `✗ ${data.error}`);
    setBusy(false);
  }

  async function saveSpecial() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("special_results")
      .update({
        champion: champion || null,
        top_scorer: topScorer || null,
        group_winners: groupWinners,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    addLog(error ? `✗ ${error.message}` : "✓ Sonderwetten-Ergebnisse gespeichert");
    if (!error) {
      const res = await fetch("/api/admin/recalc-special", { method: "POST" });
      const data = await res.json();
      addLog(res.ok ? `✓ ${data.updated} Sonderwetten neu bewertet` : `✗ ${data.error}`);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-border rounded-lg p-6 space-y-3">
        <h2 className="font-display font-bold text-xl mb-2">Aktionen</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={seedSchedule} disabled={busy} className="px-4 py-2 bg-bg border border-border rounded-md hover:border-accent disabled:opacity-50 text-sm">
            Spielplan generieren
          </button>
          <button onClick={syncResults} disabled={busy} className="px-4 py-2 bg-bg border border-border rounded-md hover:border-accent disabled:opacity-50 text-sm">
            Ergebnisse synchronisieren
          </button>
          <button onClick={recalc} disabled={busy} className="px-4 py-2 bg-bg border border-border rounded-md hover:border-accent disabled:opacity-50 text-sm">
            Punkte neu berechnen
          </button>
        </div>
        <p className="text-xs text-muted">
          "Spielplan generieren" nur einmal initial. "Ergebnisse synchronisieren" zieht von football-data.org und bewertet automatisch.
        </p>
      </section>

      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <h2 className="font-display font-bold text-xl">Sonderwetten-Ergebnisse pflegen</h2>
        <p className="text-sm text-muted">Sobald bekannt, hier eintragen. Punkte werden automatisch vergeben.</p>

        <div>
          <label className="text-sm text-muted block mb-1">Weltmeister</label>
          <select value={champion} onChange={e => setChampion(e.target.value)} className="w-full px-3 py-2 bg-bg border border-border rounded-md">
            <option value="">– offen –</option>
            {ALL_TEAMS.map(t => <option key={t} value={t}>{flagOf(t)} {t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted block mb-1">Torschützenkönig</label>
          <input type="text" value={topScorer} onChange={e => setTopScorer(e.target.value)} placeholder="z.B. Kylian Mbappé" className="w-full px-3 py-2 bg-bg border border-border rounded-md" />
        </div>

        <div>
          <label className="text-sm text-muted block mb-2">Gruppensieger</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.entries(GROUPS).map(([code, teams]) => (
              <div key={code}>
                <div className="text-xs text-muted mb-1">Gruppe {code}</div>
                <select
                  value={groupWinners[code] || ""}
                  onChange={e => setGroupWinners({ ...groupWinners, [code]: e.target.value })}
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded-md text-sm"
                >
                  <option value="">– offen –</option>
                  {teams.map(t => <option key={t} value={t}>{flagOf(t)} {t}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <button onClick={saveSpecial} disabled={busy} className="px-4 py-2 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 disabled:opacity-50">
          Speichern & Punkte vergeben
        </button>
      </section>

      {log.length > 0 && (
        <section className="bg-surface border border-border rounded-lg p-4">
          <h2 className="font-mono text-xs uppercase text-muted mb-2">Log</h2>
          <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </section>
      )}
    </div>
  );
}
