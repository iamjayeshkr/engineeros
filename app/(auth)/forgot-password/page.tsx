"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendPasswordReset } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const result = await sendPasswordReset(formData);
    if (result?.error) setMessage({ type: "error", text: result.error });
    if (result?.success) setMessage({ type: "success", text: result.success });
    setPending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-semibold text-white">
            Reset your password
          </h1>
          <p className="text-sm text-zinc-400">
            We&apos;ll send a reset link to your email.
          </p>
        </div>

        <div className="card p-6">
          <form action={handleSubmit} className="space-y-3">
            <Input name="email" type="email" placeholder="you@example.com" required />

            {message && (
              <p className={message.type === "error" ? "text-sm text-danger" : "text-sm text-success"}>
                {message.text}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">
          Remembered it?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
