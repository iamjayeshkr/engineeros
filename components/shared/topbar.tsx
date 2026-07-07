"use client";

import { Bell, Command } from "lucide-react";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-base-950/80 px-4 backdrop-blur-xs">
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-command-palette"))}
        className="flex items-center gap-2 rounded-md border border-border bg-base-900 px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-300"
      >
        <Command className="h-3.5 w-3.5" />
        Search or jump to…
        <kbd className="ml-2 rounded bg-base-800 px-1 text-[10px]">⌘K</kbd>
      </button>

      <div className="flex items-center gap-4">
        <button className="text-zinc-400 hover:text-zinc-200">
          <Bell className="h-4.5 w-4.5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-accent-soft border border-border flex items-center justify-center text-xs text-accent-muted">
          {userEmail?.[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}
