// In-memory fixed-window rate limiter.
//
// Deliberately NOT Redis-backed: `next.config.js` runs this app as a single
// long-lived Node server (`output: "standalone"`, see the comment in
// lib/prisma.ts), not per-request serverless functions — so a module-level
// Map survives across requests and this works correctly for a single
// instance. If this app is ever scaled horizontally (multiple Node
// processes / containers behind a load balancer), each instance will have
// its own counters and the effective limit becomes limit * instanceCount.
// At that point, swap the `store` below for Upstash Redis (`@upstash/ratelimit`)
// — the `checkRateLimit` call signature here is intentionally simple so
// that swap doesn't require touching every call site.
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

// Without this, every distinct key (ip:action:email combos) lives in the Map
// forever, since expired buckets are only ever overwritten, not deleted —
// a slow, unbounded memory leak on a long-lived server. Sweeps once a
// minute; unref'd so it never keeps the Node process alive on its own.
function ensureCleanupScheduled() {
  if (cleanupTimer || typeof setInterval === "undefined") return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }, 60_000);
  cleanupTimer.unref?.();
}

export interface RateLimitResult {
  success: boolean;
  /** Requests remaining in the current window (0 once exhausted). */
  remaining: number;
  /** Epoch ms when this window resets and the count returns to 0. */
  resetAt: number;
  /** Convenience: seconds until reset, 0 when `success` is true. */
  retryAfterSeconds: number;
}

/**
 * Increments the counter for `key` and reports whether it's still under
 * `limit` within the current `windowMs` window. Fixed-window, not sliding —
 * simple and predictable, at the cost of allowing up to 2x `limit` requests
 * clustered right at a window boundary. That's an acceptable trade for
 * login/signup/reset throttling, which just needs to blunt brute-force and
 * spam, not enforce an exact budget.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  ensureCleanupScheduled();

  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    success: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

/** Test-only: wipes all counters so tests don't leak state into each other. */
export function __resetRateLimitStore() {
  store.clear();
}
