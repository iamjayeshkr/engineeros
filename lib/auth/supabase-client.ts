import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase instance — used in Client Components only.
// Server Components / Server Actions must use lib/auth/supabase-server.ts instead,
// since the browser client can't read/write httpOnly cookies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
