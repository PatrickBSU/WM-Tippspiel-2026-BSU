"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="px-3 py-1.5 rounded-md text-muted hover:text-loss hover:bg-bg transition-colors text-sm"
    >
      Logout
    </button>
  );
}
