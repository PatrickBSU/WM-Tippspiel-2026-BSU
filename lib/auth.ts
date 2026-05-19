import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Nicht angemeldet" };
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { ok: false as const, status: 403, error: "Kein Admin" };
  return { ok: true as const, user };
}
