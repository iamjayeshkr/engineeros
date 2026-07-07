import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

import { middleware } from "./middleware";

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

beforeEach(() => {
  mockGetUser.mockReset();
});

describe("middleware", () => {
  it("redirects an unauthenticated user away from a protected route, preserving the target", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await middleware(makeRequest("/dashboard"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("redirectTo")).toBe("/dashboard");
  });

  it("lets an unauthenticated user through to a public route", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await middleware(makeRequest("/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("bounces an authenticated user away from /login to /dashboard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const response = await middleware(makeRequest("/login"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
  });

  it("lets an authenticated user through to a protected route", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const response = await middleware(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("does NOT bounce an authenticated user away from /reset-password", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const response = await middleware(makeRequest("/reset-password"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("still allows an unauthenticated user onto /reset-password", async () => {
    // Realistically a recovery link always creates a session, but the route
    // shouldn't hard-fail if Supabase hasn't set the cookie yet.
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const response = await middleware(makeRequest("/reset-password"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("bypasses the auth check entirely for /api/auth/* routes", async () => {
    const response = await middleware(makeRequest("/api/auth/callback?code=abc"));

    expect(mockGetUser).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
  });

  it("fails closed (treats as unauthenticated) if getUser() throws", async () => {
    mockGetUser.mockRejectedValue(new Error("network blip"));

    const response = await middleware(makeRequest("/dashboard"));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/login");
  });
});
