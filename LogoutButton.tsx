"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GROUPS, ALL_TEAMS, flagOf } from "@/lib/data/teams";

interface Initial {
  champion: string | null;
  top_scorer: string | null;
  group_winners: Record<string, string>;
}

export default function SonderwettenForm({ initial }: { initial: Initial | null }) {
  const [champion, setChampion] = useState(initial?.champion || "");
  const [topScorer, setTopScorer] = useState(initial?.top_scorer || "");
  const [groupWinners, setGroupWinners] = useState<Record<string, string>>(
    initial?.group_winners || {}
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const deadline = process.env.NEXT_PUBLIC_TIPP_DEADLINE
    ? new Date(process.env.NEXT_PUBLIC_TIPP_DEADLINE)
    : new Date("2026-06-11T20:00:00+02:00");
  const isLocked = Date.now() >= deadline.getTime();

  async function save() {
    setStatus("saving");
    setErrorMsg("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("special_bets").upsert({
      user_id: user.id,
      champion: champion || null,
      top_scorer: topScorer || null,
      group_winners: groupWinners,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="space-y-8">
      {isLocked && (
        <div className="bg-loss/10 border border-loss/30 rounded-md p-3 text-sm">
          🔒 Sonderwetten gesperrt – WM hat begonnen.
        </div>
      )}

      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div>
          <div className="font-display font-bold text-xl">Weltmeister</div>
          <div className="text-muted text-sm">15 Punkte bei richtigem Tipp</div>
        </div>
        <select
          value={champion}
          onChange={e => setChampion(e.target.value)}
          disabled={isLocked}
          className="w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none focus:border-accent disabled:opacity-50"
        >
          <option value="">– wähle ein Team –</option>
          {ALL_TEAMS.map(t => (
            <option key={t} value={t}>{flagOf(t)} {t}</option>
          ))}
        </select>
      </section>

      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div>
          <div className="font-display font-bold text-xl">Torschützenkönig</div>
          <div className="text-muted text-sm">10 Punkte bei richtigem Tipp</div>
        </div>
        <input
          type="text"
          value={topScorer}
          onChange={e => setTopScorer(e.target.value)}
          disabled={isLocked}
          placeholder="z.B. Kylian Mbappé"
          className="w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none focus:border-accent disabled:opacity-50"
        />
      </section>

      <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
        <div>
          <div className="font-display font-bold text-xl">Gruppensieger</div>
          <div className="text-muted text-sm">2 Punkte pro richtiger Gruppe (max. 24)</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(GROUPS).map(([code, teams]) => (
            <div key={code}>
              <label className="text-xs text-muted mb-1 block">Gruppe {code}</label>
              <select
                value={groupWinners[code] || ""}
                onChange={e => setGroupWinners({ ...groupWinners, [code]: e.target.value })}
                disabled={isLocked}
                className="w-full px-3 py-2 bg-bg border border-border rounded-md text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">– wählen –</option>
                {teams.map(t => (
                  <option key={t} value={t}>{flagOf(t)} {t}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={isLocked || status === "saving"}
          className="px-6 py-3 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {status === "saving" ? "Speichert..." : "Speichern"}
        </button>
        {status === "saved" && <span className="text-win text-sm">✓ Gespeichert</span>}
        {status === "error" && <span className="text-loss text-sm">{errorMsg}</span>}
      </div>
    </div>
  );
}
