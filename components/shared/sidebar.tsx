"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SETTINGS_ITEM } from "@/lib/constants/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-base-950 px-3 py-4">
      <div className="mb-6 px-2">
        <span className="font-display text-sm font-semibold tracking-tight text-white">
          Engineer<span className="text-accent">OS</span>
        </span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent-soft text-white"
                  : "text-zinc-400 hover:bg-base-800 hover:text-zinc-200"
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </span>
              {item.shortcut && (
                <kbd className="text-[10px] text-zinc-600">{item.shortcut}</kbd>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-2 border-t border-border">
        <Link
          href={SETTINGS_ITEM.href}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-zinc-400 hover:bg-base-800 hover:text-zinc-200"
        >
          <SETTINGS_ITEM.icon className="h-4 w-4" />
          {SETTINGS_ITEM.label}
        </Link>
      </div>
    </aside>
  );
}
