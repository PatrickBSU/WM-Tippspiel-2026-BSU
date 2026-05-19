import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SonderwettenForm from "@/components/SonderwettenForm";

export const dynamic = "force-dynamic";

export default async function SonderwettenPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase.from("special_bets").select("*").eq("user_id", user.id).single();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Sonderwetten</h1>
      <p className="text-muted text-sm mb-8">Vor WM-Start abgeben. Nach Anpfiff erstes Spiel gesperrt.</p>
      <SonderwettenForm initial={existing} />
    </div>
  );
}
