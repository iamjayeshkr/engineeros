import { Suspense } from "react";
import { requireUser } from "@/lib/auth/supabase-server";
import { getDashboardData } from "@/server/services/dashboard.service";
import { CircularProgress } from "@/components/shared/circular-progress";
import { Heatmap } from "@/components/shared/heatmap";
import { StatCard } from "@/components/shared/stat-card";
import { Flame, Clock3, CalendarClock } from "lucide-react";
import { format } from "date-fns";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-white">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500">Here&apos;s where you stand today.</p>
        </div>
        <CircularProgress value={data.careerScore} label="Readiness" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Current streak"
          value={`${data.currentStreak}d`}
          icon={Flame}
          accent="streak"
        />
        <StatCard label="Longest streak" value={`${data.longestStreak}d`} icon={Flame} />
        <StatCard
          label="Today"
          value={`${(data.todayMinutes / 60).toFixed(1)}h`}
          icon={Clock3}
        />
        <StatCard
          label="This week"
          value={`${(data.weekMinutes / 60).toFixed(1)}h`}
          icon={Clock3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">
            Activity — last 18 weeks
          </h2>
          <Suspense fallback={<div className="h-24 animate-pulse bg-base-800 rounded" />}>
            <Heatmap data={data.heatmapData} />
          </Suspense>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <CalendarClock className="h-4 w-4" />
            Upcoming deadlines
          </h2>
          {data.upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing due — set a goal deadline to see it here.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {data.upcomingDeadlines.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{d.title}</span>
                  <span className="text-xs text-zinc-500">
                    {d.dueDate ? format(d.dueDate, "MMM d") : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
