"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { signInWithEmail } from "@/lib/auth/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signInWithEmail(formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-400">
            Log in to continue building your engineering OS.
          </p>
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
            <Input name="password" type="password" placeholder="Password" required />

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-zinc-400 hover:text-zinc-200">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
