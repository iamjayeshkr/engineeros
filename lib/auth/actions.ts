"use server";

import { createClient, requireUser } from "@/lib/auth/supabase-server";
import { createAdminClient } from "@/lib/auth/supabase-admin";
import { syncUserRecord } from "@/lib/auth/user-sync";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getClientIp } from "@/lib/rate-limit/get-client-ip";
import { checkRateLimit } from "@/lib/rate-limit/limiter";
import { RATE_LIMITS, rateLimitMessage } from "@/lib/rate-limit/config";
import {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  updatePasswordSchema,
  resendVerificationSchema,
} from "@/lib/validations/auth";

const CALLBACK_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

// Shared shape for every action below that can return without redirecting.
// Declared once and reused (rather than letting each function's return type
// be inferred as a union of distinct object literal types) so callers can
// check `result?.error` / `result?.success` / `result?.unconfirmed` without
// TS narrowing errors — every branch returns the same type, just with
// different fields populated.
type AuthActionResult = {
  error?: string;
  success?: string;
  unconfirmed?: true;
};

export async function signInWithEmail(formData: FormData): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();

  // Two independent buckets: per-IP (catches one attacker spraying many
  // different emails from a single machine) and per-IP+email (catches
  // repeated guesses against one account without punishing every other
  // user who happens to share that IP, e.g. an office network or campus
  // wifi).
  const ipLimit = checkRateLimit(
    `login:ip:${ip}`,
    RATE_LIMITS.loginByIp.limit,
    RATE_LIMITS.loginByIp.windowMs
  );
  if (!ipLimit.success) {
    return { error: rateLimitMessage(ipLimit.retryAfterSeconds) };
  }

  const emailLimit = checkRateLimit(
    `login:email:${parsed.data.email}`,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowMs
  );
  if (!emailLimit.success) {
    return { error: rateLimitMessage(emailLimit.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error: "Please confirm your email before logging in.",
        unconfirmed: true as const,
      };
    }
    // Deliberately generic rather than echoing Supabase's raw message —
    // "Invalid login credentials" vs. a hypothetical "no user found" would
    // let an attacker tell wrong-password apart from no-such-account and
    // enumerate registered emails one login attempt at a time.
    return { error: "Invalid email or password." };
  }

  if (data.user) {
    // Backfills the Prisma User row on every login, not just signup — cheap
    // upsert, and it means an account created before this sync existed (or
    // one where the sync failed once) self-heals on the next login instead
    // of needing a manual fix.
    await syncUserRecord(data.user);
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(formData: FormData): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(
    `signup:ip:${ip}`,
    RATE_LIMITS.signup.limit,
    RATE_LIMITS.signup.windowMs
  );
  if (!limit.success) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      // Must round-trip through our callback route so the auth code in the
      // confirmation link actually gets exchanged for a session
      // (`exchangeCodeForSession`). Pointing straight at /dashboard — the
      // previous behavior — left the `?code=` param sitting unused in the
      // URL, so middleware never saw a session and bounced the user back to
      // /login even though they'd just confirmed correctly.
      emailRedirectTo: `${CALLBACK_URL}?redirectTo=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session?.user) {
    // Email confirmations are disabled on this Supabase project, or this is
    // a repeat signUp call for an unconfirmed account that Supabase decided
    // to log straight in — either way, a session already exists, so sync
    // now instead of waiting for a callback that will never fire.
    await syncUserRecord(data.session.user);
    redirect("/dashboard");
  }

  // Same message whether or not `data.user.identities` came back empty
  // (Supabase's signal for "this email is already registered"). Branching
  // the copy on that would turn signup into an email-enumeration oracle.
  return { success: "Check your email to confirm your account." };
}

export async function resendVerificationEmail(formData: FormData): Promise<AuthActionResult> {
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(
    `resend-verification:${ip}:${parsed.data.email}`,
    RATE_LIMITS.resendVerification.limit,
    RATE_LIMITS.resendVerification.windowMs
  );
  if (!limit.success) {
    // Same generic success message as below — a distinct "you're rate
    // limited" response here would confirm the email is registered.
    return { success: "If that account needs verifying, a new email is on its way." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${CALLBACK_URL}?redirectTo=/dashboard`,
    },
  });

  // Always the same response regardless of `error` — Supabase's `resend`
  // fails for both "already confirmed" and "no such account", and echoing
  // that back would leak account existence/status via this form.
  void error;
  return { success: "If that account needs verifying, a new email is on its way." };
}

export async function signInWithOAuth(provider: "google" | "github"): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const limit = checkRateLimit(
    `oauth-start:${ip}`,
    RATE_LIMITS.oauthStart.limit,
    RATE_LIMITS.oauthStart.windowMs
  );
  if (!limit.success) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: CALLBACK_URL,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Could not start OAuth flow" };
  }

  redirect(data.url);
}

export async function sendPasswordReset(formData: FormData): Promise<AuthActionResult> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Same "If an account exists..." copy is returned on every path below —
  // rate-limited, Supabase error, or genuine success — so this form can
  // never be used to check whether an email is registered.
  const GENERIC_SUCCESS = {
    success: "If an account exists for that email, a reset link is on its way.",
  };

  const ip = await getClientIp();
  const limit = checkRateLimit(
    `password-reset:${ip}:${parsed.data.email}`,
    RATE_LIMITS.passwordReset.limit,
    RATE_LIMITS.passwordReset.windowMs
  );
  if (!limit.success) {
    return GENERIC_SUCCESS;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // Same fix as signup: route through the callback so the recovery code
    // gets exchanged for a session before the user lands on the page where
    // they actually type a new password.
    redirectTo: `${CALLBACK_URL}?redirectTo=/reset-password`,
  });

  void error;
  return GENERIC_SUCCESS;
}

export async function updatePassword(formData: FormData): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(
    `update-password:${ip}`,
    RATE_LIMITS.updatePassword.limit,
    RATE_LIMITS.updatePassword.windowMs
  );
  if (!limit.success) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No active (recovery) session — the link was already used, expired, or
    // the user navigated here directly without one.
    return { error: "This reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  await syncUserRecord(user);
  redirect("/login?reset=1");
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
export async function deleteAccount(confirmation: string): Promise<AuthActionResult> {
  if (confirmation.trim().toUpperCase() !== "DELETE") {
    return { error: 'Type "DELETE" to confirm — this can\'t be undone.' };
  }

  const user = await requireUser();

  // Keyed by user id, not IP — this route already requires an authenticated
  // session, so the account itself is the right unit to throttle. Mainly a
  // defense-in-depth guard against a compromised/scripted session hammering
  // the delete endpoint, not a brute-force concern like the flows above.
  const limit = checkRateLimit(
    `delete-account:${user.id}`,
    RATE_LIMITS.updatePassword.limit,
    RATE_LIMITS.updatePassword.windowMs
  );
  if (!limit.success) {
    return { error: rateLimitMessage(limit.retryAfterSeconds) };
  }

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
