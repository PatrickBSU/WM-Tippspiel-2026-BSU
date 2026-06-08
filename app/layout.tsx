import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WM Tippspiel 2026",
  description: "Firmeninternes Tippspiel zur FIFA WM 2026",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    isAdmin = !!data?.is_admin;
  }

  return (
    <html lang="de" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-display font-bold text-lg tracking-tightest flex items-center gap-2.5">
              <span className="inline-flex items-center bg-white rounded-md px-1.5 py-1">
                <img src="/logo.png" alt="BSU Bau Service Unterberger GmbH" className="h-6 w-auto" />
              </span>
              <span className="hidden sm:inline">WM Tippspiel <span className="text-muted">'26</span></span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {user ? (
                <>
                  <NavLink href="/tippen">Tippen</NavLink>
                  <NavLink href="/sonderwetten">Sonderwetten</NavLink>
                  <NavLink href="/ergebnisse">Ergebnisse</NavLink>
                  <NavLink href="/rangliste">Rangliste</NavLink>
                  <NavLink href="/einladen">Einladen</NavLink>
                  {isAdmin && <NavLink href="/admin">Admin</NavLink>}
                  <LogoutButton />
                </>
              ) : (
                <Link href="/login" className="px-3 py-1.5 rounded-md bg-accent text-bg font-medium hover:bg-accent/90 transition-colors">
                  Anmelden
                </Link>
              )}
            </nav>
            <details className="md:hidden relative">
              <summary className="list-none cursor-pointer p-2">
                <div className="w-5 h-0.5 bg-ink mb-1" />
                <div className="w-5 h-0.5 bg-ink mb-1" />
                <div className="w-5 h-0.5 bg-ink" />
              </summary>
              <div className="absolute right-0 mt-2 w-44 bg-surface border border-border rounded-lg p-2 flex flex-col gap-1 text-sm">
                {user ? (
                  <>
                    <Link href="/tippen" className="px-3 py-2 hover:bg-bg rounded">Tippen</Link>
                    <Link href="/sonderwetten" className="px-3 py-2 hover:bg-bg rounded">Sonderwetten</Link>
                    <Link href="/ergebnisse" className="px-3 py-2 hover:bg-bg rounded">Ergebnisse</Link>
                    <Link href="/rangliste" className="px-3 py-2 hover:bg-bg rounded">Rangliste</Link>
                    <Link href="/einladen" className="px-3 py-2 hover:bg-bg rounded">Einladen</Link>
                    {isAdmin && <Link href="/admin" className="px-3 py-2 hover:bg-bg rounded">Admin</Link>}
                    <LogoutButton />
                  </>
                ) : (
                  <Link href="/login" className="px-3 py-2 bg-accent text-bg rounded font-medium">Anmelden</Link>
                )}
              </div>
            </details>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border text-muted text-xs py-4 text-center">
          WM Tippspiel 2026 · Daten von football-data.org · 3 P für exaktes Ergebnis, 1 P für Tendenz
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-bg transition-colors">
      {children}
    </Link>
  );
}
