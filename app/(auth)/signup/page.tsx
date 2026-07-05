"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { signUpWithEmail } from "@/lib/auth/actions";

export default function SignupPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const result = await signUpWithEmail(formData);
    if (result?.error) setMessage({ type: "error", text: result.error });
    if (result?.success) setMessage({ type: "success", text: result.success });
    setPending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">
            Create your account
          </h1>
          <p className="text-sm text-zinc-400">Start tracking your path to SDE-1.</p>
        </div>

        <div className="card p-6 space-y-4">
          <OAuthButtons />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form action={handleSubmit} className="space-y-3">
            <Input name="email" type="email" placeholder="you@example.com" required />
            <Input
              name="password"
              type="password"
              placeholder="Password (min 8 characters)"
              required
              minLength={8}
            />

            {message && (
              <p className={cn0(message.type)}>{message.text}</p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function cn0(type: "error" | "success") {
  return type === "error" ? "text-sm text-danger" : "text-sm text-success";
}
