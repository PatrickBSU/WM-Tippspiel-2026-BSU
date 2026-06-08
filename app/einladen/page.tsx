"use client";

import { useState, useEffect } from "react";

export default function EinladenPage() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"link" | "qr" | "mail">("link");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = origin || "https://tippspiel.example.com";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=${encodeURIComponent(url + "/login")}&color=000000&bgcolor=ffffff`;

  const mailBody = `Hallo,\n\nich lade dich zum firmeninternen WM-Tippspiel 2026 ein.\n\n🔗 ${url}/login\n\nSo geht's:\n1. Auf den Link klicken\n2. Email-Adresse eingeben (du bekommst einen Anmeldelink zugesendet)\n3. Auf den Anmeldelink in der Mail klicken\n4. Alle 104 Spiele tippen + Weltmeister, Torschützenkönig und Gruppensieger\n\nPunktesystem: 3 Punkte für exaktes Ergebnis, 1 Punkt für richtige Tendenz.\nSonderwetten: WM 15 P, Torschütze 10 P, Gruppensieger 2 P pro Gruppe.\n\nDeadline für Sonderwetten und Gruppenspiele: 11. Juni 2026, 20:00 Uhr (WM-Anpfiff).\n\nViel Spaß und gutes Tippen!\n`;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Einladen</h1>
      <p className="text-muted text-sm mb-6">Link an die Kollegen verteilen. Anmeldung per Magic-Link, kein Passwort nötig.</p>

      <div className="flex gap-1 mb-4 border-b border-border">
        <TabButton active={tab === "link"} onClick={() => setTab("link")}>Link</TabButton>
        <TabButton active={tab === "qr"} onClick={() => setTab("qr")}>QR-Code</TabButton>
        <TabButton active={tab === "mail"} onClick={() => setTab("mail")}>E-Mail-Text</TabButton>
      </div>

      {tab === "link" && (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div>
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Direktlink zur Anmeldung</div>
            <div className="bg-bg border border-border rounded-md p-3 font-mono text-sm break-all">{url}/login</div>
          </div>
          <button onClick={() => copy(`${url}/login`)} className="px-4 py-2 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 transition-colors">{copied ? "✓ Kopiert!" : "Link kopieren"}</button>
        </div>
      )}

      {tab === "qr" && (
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center gap-4">
          <div className="text-xs text-muted uppercase tracking-wider self-start">Zum Scannen am Mobile</div>
          {origin && (<img src={qrUrl} alt="QR Code zur Anmeldung" className="rounded-md border border-border" width={300} height={300} />)}
          <a href={qrUrl} download="wm-tippspiel-qr.png" className="text-sm text-accent hover:underline">QR-Code herunterladen</a>
        </div>
      )}

      {tab === "mail" && (
        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="text-xs text-muted uppercase tracking-wider">Vorlage zum Versenden</div>
          <textarea readOnly value={mailBody} className="w-full h-80 bg-bg border border-border rounded-md p-3 font-mono text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={() => copy(mailBody)} className="px-4 py-2 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 transition-colors">{copied ? "✓ Kopiert!" : "Text kopieren"}</button>
            <a href={`mailto:?subject=${encodeURIComponent("WM Tippspiel 2026 – Einladung")}&body=${encodeURIComponent(mailBody)}`} className="px-4 py-2 bg-bg border border-border rounded-md hover:border-accent transition-colors text-sm">Im Mail-Programm öffnen</a>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${active ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}>{children}</button>
  );
}
