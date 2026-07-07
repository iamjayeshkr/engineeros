"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccount } from "@/lib/auth/actions";

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    const result = await deleteAccount(confirmation);
    // deleteAccount redirects on success, so reaching this line means it failed.
    if (result?.error) {
      setError(result.error);
    }
    setIsDeleting(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 rounded px-3 py-1.5 transition-colors"
      >
        Delete account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-red-500/20 rounded-lg shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Delete your account
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setConfirmation("");
                  setError(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="text-xs text-zinc-400 leading-relaxed space-y-2">
              <p>
                This permanently deletes your goals, DSA log, roadmap, projects,
                applications, resume versions, learning items, and study history.
                There is no recovery period and no way to undo this.
              </p>
              <p className="text-zinc-500">Type DELETE below to confirm.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-2.5 rounded text-xs">
                {error}
              </div>
            )}

            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Type DELETE"
              autoComplete="off"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500/40"
            />

            <button
              onClick={handleDelete}
              disabled={confirmation.trim().toUpperCase() !== "DELETE" || isDeleting}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed rounded px-3 py-2 transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Deleting everything…
                </>
              ) : (
                "Permanently delete my account"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
