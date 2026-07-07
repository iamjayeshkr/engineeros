import { prisma } from "@/lib/prisma";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Supabase Auth (the `auth.users` table) and our Prisma `User` table are two
 * separate stores by design — Prisma only ever manages the public schema,
 * never `auth`. Nothing creates a matching `User` row automatically when
 * someone signs up.
 *
 * Every code path that can establish a session — password login, the OAuth
 * callback, and email-confirmation callback — must call this so the app-side
 * `User` row exists before any dashboard query (which joins on `userId`)
 * runs. It's an upsert rather than a plain create so it's safe (and useful)
 * to call on every login too: it keeps name/avatar in sync if the person
 * changes them at the provider (e.g. updates their Google profile photo).
 */
export async function syncUserRecord(authUser: SupabaseUser): Promise<void> {
  if (!authUser.email) {
    // Should not happen for email/password or Google/GitHub OAuth, but
    // Supabase's type only guarantees `email` for some providers. Fail loudly
    // rather than writing a User row with an empty unique `email` column.
    throw new Error(`syncUserRecord: auth user ${authUser.id} has no email`);
  }

  const metadata = authUser.user_metadata ?? {};
  const name =
    (metadata.name as string | undefined) ??
    (metadata.full_name as string | undefined) ??
    undefined;
  const avatarUrl =
    (metadata.avatar_url as string | undefined) ??
    (metadata.picture as string | undefined) ??
    undefined;

  await prisma.user.upsert({
    where: { id: authUser.id },
    create: {
      id: authUser.id,
      email: authUser.email,
      name: name ?? null,
      avatarUrl: avatarUrl ?? null,
    },
    update: {
      email: authUser.email,
      // Only overwrite if the provider actually gave us a value — an
      // `undefined` here leaves the existing Prisma value untouched, so a
      // user who set a custom name in-app doesn't get it clobbered back to
      // null on their next password login.
      ...(name !== undefined ? { name } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });
}
