"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePassword } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updatePassword(formData);
    // updatePassword redirects to /login?reset=1 on success, so reaching
    // this line means it failed.
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">
            Set a new password
          </h1>
          <p className="text-sm text-zinc-400">
            Choose a new password for your account.
          </p>
        </div>

        <div className="card p-6">
          <form action={handleSubmit} className="space-y-3">
            <Input
              name="password"
              type="password"
              placeholder="New password (min 8 characters)"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              minLength={8}
              autoComplete="new-password"
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          <Link href="/login" className="text-accent hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
