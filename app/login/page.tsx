"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: name ? { display_name: name } : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Anmelden</h1>
      <p className="text-muted mb-8">E-Mail eingeben, Magic Link kommt per Mail. Beim ersten Mal auch Name angeben.</p>
      {status === "sent" ? (
        <div className="bg-surface border border-accent/30 rounded-lg p-6 space-y-2">
          <div className="text-accent font-medium">Link verschickt ✓</div>
          <div className="text-sm text-muted">Prüfe dein Postfach. Klick den Link in der Mail von Supabase, um dich anzumelden.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-muted mb-1.5 block">Name (nur beim ersten Mal)</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" className="w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none focus:border-accent" />
          </label>
          <label className="block">
            <span className="text-sm text-muted mb-1.5 block">E-Mail</span>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="max@firma.at" className="w-full px-3 py-2 bg-bg border border-border rounded-md focus:outline-none focus:border-accent" />
          </label>
          <button type="submit" disabled={status === "sending"} className="w-full py-3 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 transition-colors">{status === "sending" ? "Wird gesendet..." : "Magic Link senden"}</button>
          {status === "error" && (<div className="text-loss text-sm">{errorMsg}</div>)}
        </form>
      )}
    </div>
  );
}
