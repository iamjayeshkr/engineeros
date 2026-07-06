import { requireUser } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Sparkles, Brain, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();

  // Query stats
  const [dsaProblems, sessions, goals] = await Promise.all([
    prisma.dsaProblem.findMany({ where: { userId: user.id } }),
    prisma.studySession.findMany({ where: { userId: user.id } }),
    prisma.goal.findMany({ where: { userId: user.id } }),
  ]);

  // Calculations
  const easyCount = dsaProblems.filter(p => p.difficulty === "EASY").length;
  const mediumCount = dsaProblems.filter(p => p.difficulty === "MEDIUM").length;
  const hardCount = dsaProblems.filter(p => p.difficulty === "HARD").length;
  const totalSolved = dsaProblems.length;

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const deepWorkMinutes = sessions.filter(s => s.deepWork).reduce((sum, s) => sum + s.minutes, 0);
  const deepWorkRatio = totalMinutes > 0 ? Math.round((deepWorkMinutes / totalMinutes) * 100) : 0;

  const completedGoals = goals.filter(g => g.status === "DONE").length;
  const totalGoals = goals.length;
  const goalRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Study hours by category
  const categoriesMap: Record<string, number> = {};
  sessions.forEach(s => {
    categoriesMap[s.category] = (categoriesMap[s.category] ?? 0) + s.minutes;
  });

  const categories = Object.keys(categoriesMap).map(cat => ({
    name: cat,
    hours: Math.round((categoriesMap[cat] / 60) * 10) / 10,
  })).sort((a, b) => b.hours - a.hours);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Core Analytics Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visualize your study focus, DSA problem difficulty spread, and milestone completions.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Total Time Studied</span>
            <span className="text-2xl font-bold text-white mt-1 block">{Math.round(totalMinutes / 60)}h</span>
          </div>
        </div>

        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-accent-soft text-accent border border-accent/20 rounded-full">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Deep Work Efficiency</span>
            <span className="text-2xl font-bold text-white mt-1 block">{deepWorkRatio}%</span>
          </div>
        </div>

        <div className="card p-5 border-border/40 bg-zinc-900/30 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block font-medium uppercase tracking-wider">Milestones Met</span>
            <span className="text-2xl font-bold text-white mt-1 block">{goalRate}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSA Difficulty Breakdown */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
            DSA solved difficulty split
          </h3>

          <div className="space-y-4 py-2">
            {/* Easy */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-400 font-semibold">Easy</span>
                <span className="text-zinc-500 font-medium">{easyCount} solved ({totalSolved > 0 ? Math.round((easyCount / totalSolved) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${totalSolved > 0 ? (easyCount / totalSolved) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-amber-400 font-semibold">Medium</span>
                <span className="text-zinc-500 font-medium">{mediumCount} solved ({totalSolved > 0 ? Math.round((mediumCount / totalSolved) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${totalSolved > 0 ? (mediumCount / totalSolved) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Hard */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-400 font-semibold">Hard</span>
                <span className="text-zinc-500 font-medium">{hardCount} solved ({totalSolved > 0 ? Math.round((hardCount / totalSolved) * 100) : 0}%)</span>
              </div>
              <div className="w-full bg-zinc-950 border border-zinc-850 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${totalSolved > 0 ? (hardCount / totalSolved) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Study Focus Hours by Category */}
        <div className="card p-5 border-border/40 bg-zinc-900/30 space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-2">
            Study hours distribution
          </h3>

          {categories.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <TrendingUp className="h-6 w-6 text-zinc-650 mx-auto mb-2" />
              Log study sessions to visualize your focus breakdown.
            </div>
          ) : (
            <div className="space-y-3.5 py-1">
              {categories.map((cat, idx) => {
                const maxHours = Math.max(...categories.map(c => c.hours));
                const pct = maxHours > 0 ? Math.round((cat.hours / maxHours) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-zinc-400 font-medium truncate">{cat.name}</span>
                    <div className="flex-1 bg-zinc-950 border border-zinc-850 h-3 rounded overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-white shrink-0">{cat.hours}h</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
