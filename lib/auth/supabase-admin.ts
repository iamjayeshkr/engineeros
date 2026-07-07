import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin client using the service-role key — bypasses RLS and can manage
// auth users directly. NEVER import this from a Client Component or expose
// it to the browser. Only for privileged server-only operations like
// permanently deleting a user's auth account.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
