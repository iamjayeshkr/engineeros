import { describe, it, expect } from "vitest";
import {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  updatePasswordSchema,
  resendVerificationSchema,
} from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases the email", () => {
    const result = loginSchema.safeParse({ email: "  USER@Example.COM  ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("does not enforce a password shape (login isn't the policy-enforcement point)", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" });
    expect(result.success).toBe(true);
  });
});

describe("signupSchema", () => {
  it("accepts a password with a letter and a number, min 8 chars", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "abcd1234" });
    expect(result.success).toBe(true);
  });

  it("rejects a password under 8 characters", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no digit", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "abcdefgh" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with no letter", () => {
    const result = signupSchema.safeParse({ email: "user@example.com", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects a password over 72 characters (bcrypt truncation limit)", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "a1".repeat(37), // 74 chars
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signupSchema.safeParse({ email: "nope", password: "abcd1234" });
    expect(result.success).toBe(false);
  });
});

describe("passwordResetRequestSchema", () => {
  it("accepts a valid email", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects a missing email", () => {
    expect(passwordResetRequestSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("updatePasswordSchema", () => {
  it("accepts matching, valid passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "abcd1234",
      confirmPassword: "abcd1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "abcd1234",
      confirmPassword: "abcd5678",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("confirmPassword");
    }
  });

  it("rejects a weak new password even if confirmed correctly", () => {
    const result = updatePasswordSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("resendVerificationSchema", () => {
  it("accepts a valid email", () => {
    expect(resendVerificationSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(resendVerificationSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});
