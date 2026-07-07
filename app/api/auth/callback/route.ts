import { createClient } from "@/lib/auth/supabase-server";
import { syncUserRecord } from "@/lib/auth/user-sync";
import { NextResponse } from "next/server";

// Every flow that issues a code — OAuth login, email-confirmation links,
// and password-recovery links — now points here (see lib/auth/actions.ts),
// so this is the single place a session gets created from a redirect and
// the single place that must sync the Prisma User row before sending the
// user onward.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      try {
        await syncUserRecord(data.user);
      } catch (err) {
        // Don't block the redirect over a sync failure — the session is
        // valid either way, and syncUserRecord runs again on next login as
        // a self-heal. Log it so a persistent failure (e.g. bad DB
        // connection) doesn't go unnoticed.
        console.error("[auth/callback] failed to sync user record:", err);
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
