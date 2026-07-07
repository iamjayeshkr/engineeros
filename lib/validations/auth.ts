import { z } from "zod";

// Trim + lowercase so "  User@Example.com " and "user@example.com" are
// treated as the same identity everywhere (rate-limit keys, Supabase calls,
// Prisma lookups) instead of silently creating duplicate rate-limit buckets
// or, worse, duplicate-looking accounts in logs.
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

// Deliberately loose: login is not the place to enforce a password policy.
// Requiring "1 number + 1 symbol" here would just reject real passwords
// created under an older, laxer policy. Only signup/reset enforce shape.
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

// 72 chars because bcrypt (which Supabase Auth uses under the hood) silently
// truncates anything past 72 bytes — without this cap, two different long
// passwords that share a 72-byte prefix would authenticate identically,
// which is confusing at best.
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const passwordResetRequestSchema = z.object({
  email: emailField,
});

export const updatePasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const resendVerificationSchema = z.object({
  email: emailField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
