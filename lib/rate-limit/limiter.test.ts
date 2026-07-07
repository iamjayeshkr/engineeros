import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, __resetRateLimitStore } from "./limiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitStore();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a fresh key", () => {
    const result = checkRateLimit("key-a", 3, 1000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("allows requests up to the limit and blocks the one after", () => {
    expect(checkRateLimit("key-b", 3, 60_000).success).toBe(true);
    expect(checkRateLimit("key-b", 3, 60_000).success).toBe(true);
    expect(checkRateLimit("key-b", 3, 60_000).success).toBe(true);

    const blocked = checkRateLimit("key-b", 3, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps different keys independent", () => {
    checkRateLimit("key-c", 1, 60_000);
    const blockedC = checkRateLimit("key-c", 1, 60_000);
    const freshD = checkRateLimit("key-d", 1, 60_000);

    expect(blockedC.success).toBe(false);
    expect(freshD.success).toBe(true);
  });

  it("resets the count once the window elapses", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(now);

    expect(checkRateLimit("key-e", 1, 1000).success).toBe(true);
    expect(checkRateLimit("key-e", 1, 1000).success).toBe(false);

    // Advance past the window.
    vi.setSystemTime(new Date(now.getTime() + 1001));

    expect(checkRateLimit("key-e", 1, 1000).success).toBe(true);
  });

  it("reports a positive retryAfterSeconds while blocked", () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(now);

    checkRateLimit("key-f", 1, 30_000);
    const blocked = checkRateLimit("key-f", 1, 30_000);

    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(30);
  });
});
