"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function switchMode(m: Mode) {
    setMode(m);
    setStatus("idle");
    setErrorMsg("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: mode === "register" && name ? { display_name: name } : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  const isRegister = mode === "register";

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {/* Umschalter Anmelden / Registrieren */}
      <div className="flex gap-1 p-1 bg-surface border border-border rounded-lg mb-8">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            !isRegister ? "bg-accent text-bg" : "text-muted hover:text-ink"
          }`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
            isRegister ? "bg-win text-bg" : "text-muted hover:text-ink"
          }`}
        >
          Neu registrieren
        </button>
      </div>

      {isRegister ? (
        <>
          <div className="inline-block text-xs font-mono uppercase tracking-wider text-win mb-3">Konto anlegen</div>
          <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Neu hier?</h1>
          <p className="text-muted mb-8">Name und E-Mail eingeben — wir legen dein Tippspiel-Konto an und schicken dir einen Bestätigungs-Link.</p>
        </>
      ) : (
        <>
          <div className="inline-block text-xs font-mono uppercase tracking-wider text-accent mb-3">Schon dabei</div>
          <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Willkommen zurück</h1>
          <p className="text-muted mb-8">E-Mail eingeben — du bekommst einen Anmelde-Link per Mail. Kein neues Konto nötig.</p>
        </>
      )}

      {status === "sent" ? (
        <div className={`bg-surface border rounded-lg p-6 space-y-2 ${isRegister ? "border-win/40" : "border-accent/30"}`}>
          <div className={`font-medium ${isRegister ? "text-win" : "text-accent"}`}>Link verschickt ✓</div>
          <div className="text-sm text-muted">
            Prüfe dein Postfach. Klick den Link in der Mail von Supabase, um {isRegister ? "dein Konto zu aktivieren" : "dich anzumelden"}.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <label className="block">
              <span className="text-sm text-muted mb-1.5 block">Name</span>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" className="w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none focus:border-win" />
            </label>
          )}
          <label className="block">
            <span className="text-sm text-muted mb-1.5 block">E-Mail</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="max@firma.at" className={`w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none ${isRegister ? "focus:border-win" : "focus:border-accent"}`} />
          </label>
          <button type="submit" disabled={status === "sending"} className={`w-full py-3 font-medium rounded-md text-bg disabled:opacity-50 transition-colors ${isRegister ? "bg-win hover:bg-win/90" : "bg-accent hover:bg-accent/90"}`}>
            {status === "sending" ? "Wird gesendet..." : isRegister ? "Konto erstellen & Link senden" : "Anmelde-Link senden"}
          </button>
          {status === "error" && (<div className="text-loss text-sm">{errorMsg}</div>)}
        </form>
      )}

      {/* Hinweis-Fußzeile, die zum jeweils anderen Modus führt */}
      <div className="text-sm text-muted mt-6 text-center">
        {isRegister ? (
          <>Schon ein Konto? <button type="button" onClick={() => switchMode("login")} className="text-accent hover:underline font-medium">Hier anmelden</button></>
        ) : (
          <>Noch kein Konto? <button type="button" onClick={() => switchMode("register")} className="text-win hover:underline font-medium">Jetzt registrieren</button></>
        )}
      </div>
    </div>
  );
}
