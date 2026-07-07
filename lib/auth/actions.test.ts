import { describe, it, expect, vi, beforeEach } from "vitest";
import { __resetRateLimitStore } from "@/lib/rate-limit/limiter";

// ---- Mocks ---------------------------------------------------------------

const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getUser: vi.fn(),
  resend: vi.fn(),
  signOut: vi.fn(),
};

const mockSupabaseClient = { auth: mockSupabaseAuth };

vi.mock("@/lib/auth/supabase-server", () => ({
  createClient: vi.fn(async () => mockSupabaseClient),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/auth/supabase-admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { deleteUser: vi.fn(async () => ({ error: null })) } },
  })),
}));

vi.mock("@/lib/auth/user-sync", () => ({
  syncUserRecord: vi.fn(async () => undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      delete: vi.fn(async () => ({ id: "user-1" })),
    },
  },
}));

let currentHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => currentHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Imported after the mocks above so the module picks them up.
import { createClient, requireUser } from "@/lib/auth/supabase-server";
import { syncUserRecord } from "@/lib/auth/user-sync";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  signInWithEmail,
  signUpWithEmail,
  resendVerificationEmail,
  signInWithOAuth,
  sendPasswordReset,
  updatePassword,
  signOut,
  deleteAccount,
} from "@/lib/auth/actions";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function setIp(ip: string) {
  currentHeaders = new Headers({ "x-forwarded-for": ip });
}

async function expectRedirectTo(promise: Promise<unknown>, path: string) {
  await expect(promise).rejects.toThrow(`REDIRECT:${path}`);
}

beforeEach(() => {
  __resetRateLimitStore();
  vi.clearAllMocks();
  setIp("203.0.113.1");
});

// ---- signInWithEmail ------------------------------------------------------

describe("signInWithEmail", () => {
  it("rejects invalid input before touching Supabase", async () => {
    const result = await signInWithEmail(formData({ email: "not-an-email", password: "" }));
    expect(result?.error).toBeTruthy();
    expect(mockSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("logs in, syncs the user, and redirects to /dashboard on success", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });

    await expectRedirectTo(
      signInWithEmail(formData({ email: "user@example.com", password: "correct-password" })),
      "/dashboard"
    );

    expect(syncUserRecord).toHaveBeenCalledWith({ id: "user-1", email: "user@example.com" });
  });

  it("normalizes email casing/whitespace before calling Supabase", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });

    await expectRedirectTo(
      signInWithEmail(formData({ email: "  User@Example.com  ", password: "correct-password" })),
      "/dashboard"
    );

    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "correct-password",
    });
  });

  it("returns a generic error for wrong credentials, not the raw Supabase message", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await signInWithEmail(
      formData({ email: "user@example.com", password: "wrong-password" })
    );

    expect(result?.error).toBe("Invalid email or password.");
  });

  it("flags unconfirmed accounts distinctly so the UI can offer a resend", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Email not confirmed" },
    });

    const result = await signInWithEmail(
      formData({ email: "user@example.com", password: "correct-password" })
    );

    expect(result?.unconfirmed).toBe(true);
  });

  it("rate-limits repeated attempts for the same email", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const email = "victim@example.com";
    for (let i = 0; i < 5; i++) {
      await signInWithEmail(formData({ email, password: "wrong" }));
    }

    const blocked = await signInWithEmail(formData({ email, password: "wrong" }));
    expect(blocked?.error).toMatch(/too many attempts/i);
    // Supabase was only actually called for the 5 allowed attempts.
    expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledTimes(5);
  });

  it("rate-limits by IP across many different emails", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    for (let i = 0; i < 20; i++) {
      await signInWithEmail(formData({ email: `user${i}@example.com`, password: "wrong" }));
    }

    const blocked = await signInWithEmail(
      formData({ email: "one-more@example.com", password: "wrong" })
    );
    expect(blocked?.error).toMatch(/too many attempts/i);
  });

  it("keeps the per-IP bucket isolated from other IPs", async () => {
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    // Different email each time so this only exercises the per-IP bucket,
    // not the per-email one (which is intentionally IP-agnostic).
    setIp("203.0.113.1");
    for (let i = 0; i < 20; i++) {
      await signInWithEmail(formData({ email: `ip1-user${i}@example.com`, password: "wrong" }));
    }

    setIp("198.51.100.1");
    const result = await signInWithEmail(
      formData({ email: "ip2-user@example.com", password: "wrong" })
    );
    expect(result?.error).toBe("Invalid email or password.");
  });
});

// ---- signUpWithEmail --------------------------------------------------------

describe("signUpWithEmail", () => {
  it("rejects a weak password", async () => {
    const result = await signUpWithEmail(formData({ email: "user@example.com", password: "weak" }));
    expect(result?.error).toBeTruthy();
    expect(mockSupabaseAuth.signUp).not.toHaveBeenCalled();
  });

  it("routes the confirmation email through the callback route", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    await signUpWithEmail(formData({ email: "user@example.com", password: "abcd1234" }));

    expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: expect.stringContaining("/api/auth/callback?redirectTo=/dashboard"),
        }),
      })
    );
  });

  it("returns a generic success message when confirmation is required", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    const result = await signUpWithEmail(
      formData({ email: "user@example.com", password: "abcd1234" })
    );

    expect(result?.success).toMatch(/check your email/i);
  });

  it("syncs and redirects immediately if signUp returns a live session", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({
      data: { session: { user: { id: "user-2", email: "user@example.com" } } },
      error: null,
    });

    await expectRedirectTo(
      signUpWithEmail(formData({ email: "user@example.com", password: "abcd1234" })),
      "/dashboard"
    );

    expect(syncUserRecord).toHaveBeenCalled();
  });

  it("rate-limits repeated signups from the same IP", async () => {
    mockSupabaseAuth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    for (let i = 0; i < 5; i++) {
      await signUpWithEmail(formData({ email: `user${i}@example.com`, password: "abcd1234" }));
    }

    const blocked = await signUpWithEmail(
      formData({ email: "one-more@example.com", password: "abcd1234" })
    );
    expect(blocked?.error).toMatch(/too many attempts/i);
  });
});

// ---- resendVerificationEmail ------------------------------------------------

describe("resendVerificationEmail", () => {
  it("always returns the same generic message regardless of Supabase's response", async () => {
    mockSupabaseAuth.resend.mockResolvedValue({ error: { message: "User already confirmed" } });
    const result = await resendVerificationEmail(formData({ email: "user@example.com" }));
    expect(result?.success).toMatch(/if that account needs verifying/i);
  });

  it("rate-limits repeated resend requests for the same email", async () => {
    mockSupabaseAuth.resend.mockResolvedValue({ error: null });

    for (let i = 0; i < 3; i++) {
      await resendVerificationEmail(formData({ email: "user@example.com" }));
    }
    await resendVerificationEmail(formData({ email: "user@example.com" }));

    // Even when rate-limited, the response is the same generic message
    // (checked above) — but Supabase should only actually be hit 3 times.
    expect(mockSupabaseAuth.resend).toHaveBeenCalledTimes(3);
  });
});

// ---- signInWithOAuth ---------------------------------------------------------

describe("signInWithOAuth", () => {
  it("redirects to the provider URL on success", async () => {
    mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });

    await expectRedirectTo(
      signInWithOAuth("google"),
      "https://accounts.google.com/o/oauth2/auth"
    );
  });

  it("rate-limits repeated OAuth start attempts from one IP", async () => {
    mockSupabaseAuth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/auth" },
      error: null,
    });

    for (let i = 0; i < 15; i++) {
      try {
        await signInWithOAuth("google");
      } catch {
        // redirect() throws by design in the mock
      }
    }

    const blocked = await signInWithOAuth("google");
    expect(blocked?.error).toMatch(/too many attempts/i);
  });
});

// ---- sendPasswordReset --------------------------------------------------------

describe("sendPasswordReset", () => {
  it("returns the same generic message whether or not the email exists", async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });
    const existing = await sendPasswordReset(formData({ email: "exists@example.com" }));

    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });
    const missing = await sendPasswordReset(formData({ email: "missing@example.com" }));

    expect(existing?.success).toBe(missing?.success);
  });

  it("routes the recovery link through the callback route to /reset-password", async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

    await sendPasswordReset(formData({ email: "user@example.com" }));

    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/api/auth/callback?redirectTo=/reset-password"),
      })
    );
  });

  it("still returns the generic success message once rate-limited", async () => {
    mockSupabaseAuth.resetPasswordForEmail.mockResolvedValue({ error: null });

    for (let i = 0; i < 3; i++) {
      await sendPasswordReset(formData({ email: "user@example.com" }));
    }
    const blocked = await sendPasswordReset(formData({ email: "user@example.com" }));

    expect(blocked?.success).toMatch(/if an account exists/i);
    expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledTimes(3);
  });
});

// ---- updatePassword -----------------------------------------------------------

describe("updatePassword", () => {
  it("rejects mismatched passwords before touching Supabase", async () => {
    const result = await updatePassword(
      formData({ password: "abcd1234", confirmPassword: "abcd9999" })
    );
    expect(result?.error).toBeTruthy();
    expect(mockSupabaseAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects when there is no active recovery session", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } });

    const result = await updatePassword(
      formData({ password: "abcd1234", confirmPassword: "abcd1234" })
    );

    expect(result?.error).toMatch(/expired/i);
    expect(mockSupabaseAuth.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password, syncs, and redirects to /login on success", async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
    });
    mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });

    await expectRedirectTo(
      updatePassword(formData({ password: "abcd1234", confirmPassword: "abcd1234" })),
      "/login?reset=1"
    );

    expect(syncUserRecord).toHaveBeenCalled();
  });
});

// ---- signOut --------------------------------------------------------------

describe("signOut", () => {
  it("signs out and redirects to /login", async () => {
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
    await expectRedirectTo(signOut(), "/login");
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });
});

// ---- deleteAccount ----------------------------------------------------------

describe("deleteAccount", () => {
  it("requires the literal confirmation text DELETE", async () => {
    const result = await deleteAccount("not delete");
    expect(result?.error).toMatch(/type "delete"/i);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("is case-insensitive and trims whitespace on the confirmation", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    await expectRedirectTo(deleteAccount("  delete  "), "/login?deleted=1");
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("deletes the Prisma row, the Supabase identity, and signs out", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: "user@example.com" } as never);
    mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

    await expectRedirectTo(deleteAccount("DELETE"), "/login?deleted=1");

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
  });
});
