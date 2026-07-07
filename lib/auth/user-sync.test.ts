import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted above regular top-level const declarations,
// so a plain `const mockUpsert = vi.fn(...)` referenced inside the factory
// below would throw "Cannot access before initialization". vi.hoisted runs
// its callback as part of that same hoisting pass, so the mock function
// exists by the time vi.mock's factory needs it.
const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn(async (_args: Record<string, unknown>) => ({})),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { upsert: mockUpsert } },
}));

import { syncUserRecord } from "@/lib/auth/user-sync";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function makeAuthUser(overrides: Partial<SupabaseUser> = {}): SupabaseUser {
  return {
    id: "auth-user-1",
    email: "user@example.com",
    user_metadata: {},
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as SupabaseUser;
}

beforeEach(() => {
  mockUpsert.mockClear();
});

describe("syncUserRecord", () => {
  it("upserts by auth user id", async () => {
    await syncUserRecord(makeAuthUser());

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "auth-user-1" } })
    );
  });

  it("creates with name/avatar from user_metadata when present", async () => {
    await syncUserRecord(
      makeAuthUser({
        user_metadata: { name: "Rudra", avatar_url: "https://example.com/a.png" },
      })
    );

    const call = mockUpsert.mock.calls[0][0];
    expect(call.create).toMatchObject({
      id: "auth-user-1",
      email: "user@example.com",
      name: "Rudra",
      avatarUrl: "https://example.com/a.png",
    });
  });

  it("falls back to full_name / picture (Google OAuth metadata shape)", async () => {
    await syncUserRecord(
      makeAuthUser({
        user_metadata: { full_name: "Rudra Kumar", picture: "https://example.com/b.png" },
      })
    );

    const call = mockUpsert.mock.calls[0][0];
    expect(call.create).toMatchObject({ name: "Rudra Kumar", avatarUrl: "https://example.com/b.png" });
  });

  it("does not overwrite name/avatar on update when the provider gives nothing new", async () => {
    await syncUserRecord(makeAuthUser({ user_metadata: {} }));

    const call = mockUpsert.mock.calls[0][0];
    expect(call.update).not.toHaveProperty("name");
    expect(call.update).not.toHaveProperty("avatarUrl");
    expect(call.update).toMatchObject({ email: "user@example.com" });
  });

  it("throws rather than writing a row with no email", async () => {
    await expect(syncUserRecord(makeAuthUser({ email: undefined }))).rejects.toThrow(/no email/i);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
