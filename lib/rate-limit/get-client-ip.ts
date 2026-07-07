import { headers } from "next/headers";

/**
 * Best-effort client IP for rate-limit keys. Trusts `x-forwarded-for` /
 * `x-real-ip`, which is fine behind a single trusted reverse proxy (Vercel,
 * nginx, etc.) but is NOT a security boundary on its own — a client can send
 * any `X-Forwarded-For` it likes to a server it talks to directly. Combined
 * with the per-email keys in lib/rate-limit/config.ts, spoofing this header
 * only lets an attacker dodge the per-IP bucket, not the per-account one.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();

  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
