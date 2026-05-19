import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
      if (data.user.email && adminEmails.includes(data.user.email.toLowerCase())) {
        const admin = createAdminClient();
        await admin.from("profiles").update({ is_admin: true }).eq("id", data.user.id);
      }
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
