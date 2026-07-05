"use client";

import { cn } from "@/lib/utils";
import { eachDayOfInterval, subDays, format } from "date-fns";

interface HeatmapProps {
  // map of "yyyy-MM-dd" -> intensity 0-4
  data: Record<string, number>;
  weeks?: number;
}

const INTENSITY_CLASSES = [
  "bg-base-800",
  "bg-accent-soft",
  "bg-accent/40",
  "bg-accent/70",
  "bg-accent",
];

export function Heatmap({ data, weeks = 18 }: HeatmapProps) {
  const days = eachDayOfInterval({
    start: subDays(new Date(), weeks * 7 - 1),
    end: new Date(),
  });

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const level = data[key] ?? 0;
        return (
          <div
            key={key}
            title={`${key}: ${level > 0 ? `level ${level}` : "no activity"}`}
            className={cn(
              "h-3 w-3 rounded-[3px] transition-colors",
              INTENSITY_CLASSES[Math.min(level, 4)]
            )}
          />
        );
      })}
    </div>
  );
}
