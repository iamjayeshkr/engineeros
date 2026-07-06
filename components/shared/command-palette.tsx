"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { NAV_ITEMS } from "@/lib/constants/nav";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function handleTogglePalette() {
      setOpen((prev) => !prev);
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleTogglePalette);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleTogglePalette);
    };
  }, []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-xs"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-lg overflow-hidden rounded-card border border-border bg-base-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <Command.Input
          placeholder="Jump to a module…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-2 py-4 text-center text-sm text-zinc-500">
            No results found.
          </Command.Empty>
          {NAV_ITEMS.map((item) => (
            <Command.Item
              key={item.href}
              value={item.label}
              onSelect={() => navigate(item.href)}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-zinc-300 aria-selected:bg-accent-soft aria-selected:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
