"use server";

import { createClient, requireUser } from "@/lib/auth/supabase-server";
import { createAdminClient } from "@/lib/auth/supabase-admin";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signInWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData) {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Check your email to confirm your account." };
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Could not start OAuth flow" };
  }

  redirect(data.url);
}

export async function sendPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent — check your inbox." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Permanently deletes a user's account and all associated data — no soft
// lock, no "contact support to delete your data" queue. Requires the user
// to type DELETE first so this can't be triggered by a stray click, but
// once confirmed it actually removes everything:
//   1. The Postgres User row — every Goal/DsaProblem/RoadmapItem/Project/
//      Application/ResumeVersion/LearningItem/StudySession cascades with it
//      (all FKs are `onDelete: Cascade` in schema.prisma).
//   2. The Supabase Auth user itself, so the credentials are gone too.
//   3. The current session.
export async function deleteAccount(confirmation: string) {
  if (confirmation.trim().toUpperCase() !== "DELETE") {
    return { error: 'Type "DELETE" to confirm — this can\'t be undone.' };
  }

  const user = await requireUser();

  // Delete app data first: if this fails, the user keeps their account and
  // nothing is left half-deleted. Cascades in schema.prisma take care of
  // every child table in one statement.
  await prisma.user.delete({ where: { id: user.id } });

  // Then remove the Supabase Auth identity so the credentials themselves
  // are gone, not just the app data.
  try {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user.id);
  } catch (err) {
    // The Postgres row is already gone at this point — the account has no
    // data left either way. Log it so a real "orphaned auth identity, no
    // app data" case can be cleaned up manually rather than silently lost.
    console.error("[deleteAccount] failed to delete Supabase auth user:", err);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}
