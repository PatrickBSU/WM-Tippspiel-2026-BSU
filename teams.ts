import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <Dashboard userId={user.id} />;
  }

  // Landing für Gäste
  const deadline = process.env.NEXT_PUBLIC_TIPP_DEADLINE
    ? new Date(process.env.NEXT_PUBLIC_TIPP_DEADLINE)
    : new Date("2026-06-11T20:00:00+02:00");

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="space-y-8">
        <div>
          <div className="text-accent text-sm font-mono mb-3">FIFA WORLD CUP · USA · CANADA · MEXICO</div>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tightest leading-[0.95]">
            Tippspiel<br />
            <span className="text-muted">2026</span>
          </h1>
        </div>

        <p className="text-lg text-muted max-w-xl leading-relaxed">
          Tippe alle 104 Spiele der WM, sage Weltmeister, Torschützenkönig und
          Gruppensieger voraus. Tagesaktuelle Rangliste, automatische Auswertung.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/login" className="px-6 py-3 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 transition-colors">
            Jetzt anmelden →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border">
          <Stat label="Spiele" value="104" />
          <Stat label="Teams" value="48" />
          <Stat label="Gruppen" value="12" />
        </div>

        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="text-sm font-mono text-muted mb-2">PUNKTESYSTEM</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-display font-bold">3 Punkte</div>
              <div className="text-muted">Exaktes Ergebnis</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold">1 Punkt</div>
              <div className="text-muted">Richtige Tendenz</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold">15 Punkte</div>
              <div className="text-muted">Weltmeister</div>
            </div>
            <div>
              <div className="text-2xl font-display font-bold">10 Punkte</div>
              <div className="text-muted">Torschützenkönig</div>
            </div>
            <div className="col-span-2">
              <div className="text-2xl font-display font-bold">2 Punkte × 12</div>
              <div className="text-muted">Pro richtigem Gruppensieger</div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted">
          Sonderwetten-Deadline: <span className="text-ink font-mono">{deadline.toLocaleString("de-AT", { dateStyle: "long", timeStyle: "short" })}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-3xl font-display font-bold">{value}</div>
      <div className="text-xs text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}
