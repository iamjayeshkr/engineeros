import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  accent?: "default" | "streak" | "success";
}

export function StatCard({ label, value, icon: Icon, accent = "default" }: StatCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4",
              accent === "streak" && "text-streak",
              accent === "success" && "text-success",
              accent === "default" && "text-zinc-500"
            )}
          />
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
