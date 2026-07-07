const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

// Every window/limit pair here is a deliberate choice, not a placeholder:
//
// - `login`: keyed by IP+email. 5 tries / 15 min is generous enough that a
//   real user fumbling their password doesn't get locked out, but slow
//   enough to make password guessing impractical.
// - `loginByIp`: keyed by IP alone, much higher ceiling. Catches an attacker
//   spraying many different emails from one IP — the per-email limit above
//   wouldn't block that on its own since each email only gets tried a few
//   times.
// - `signup`: keyed by IP. Blunts scripted mass account creation / email
//   spam via the confirmation email.
// - `passwordReset` / `resendVerification`: keyed by IP+email. Both send an
//   email, so both are spam vectors against a specific inbox if unlimited.
// - `updatePassword`: keyed by IP. Applies while a recovery session is
//   active on /reset-password, to slow down anyone who got hold of a
//   recovery link and is trying to brute-force past additional checks.
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * MINUTE },
  loginByIp: { limit: 20, windowMs: 15 * MINUTE },
  signup: { limit: 5, windowMs: HOUR },
  passwordReset: { limit: 3, windowMs: HOUR },
  resendVerification: { limit: 3, windowMs: HOUR },
  updatePassword: { limit: 5, windowMs: 15 * MINUTE },
  oauthStart: { limit: 15, windowMs: 15 * MINUTE },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
