import { dashboardRepository } from "@/server/repositories/dashboard.repository";
import { prisma } from "@/server/db/client";
import { format } from "date-fns";

export interface DashboardData {
  careerScore: number;
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  weekMinutes: number;
  heatmapData: Record<string, number>;
  upcomingDeadlines: { id: string; title: string; dueDate: Date | null; type: string }[];
}

// Falls back to zeroed data if the user has no rows yet (fresh signup) —
// keeps the dashboard from erroring on empty states instead of showing skeletons forever.
export async function getDashboardData(userId: string): Promise<DashboardData> {
  // Previously this pulled every row of goals/dsaProblems/roadmapItems/applications
  // in full just to call .length and .reduce() on them in JS. That means the
  // dashboard — the single most-hit route in the app — got linearly slower as a
  // user's history grew, and shipped rows (tags, notes, metadata JSON, etc.)
  // over the wire that were never used. Pushing the counting/averaging into the
  // DB (indexed, aggregate-only) keeps this route's query cost flat regardless
  // of how much data the user has accumulated.
  const [
    snapshot,
    sessions,
    deadlines,
    totalGoals,
    completedGoalsCount,
    dsaProblemsCount,
    roadmapAgg,
    applicationsCount,
  ] = await Promise.all([
    dashboardRepository.getUserSnapshot(userId),
    dashboardRepository.getStudySessionsSince(userId, 18 * 7),
    dashboardRepository.getUpcomingDeadlines(userId),
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: "DONE" } }),
    prisma.dsaProblem.count({ where: { userId } }),
    prisma.roadmapItem.aggregate({ where: { userId }, _avg: { confidence: true } }),
    prisma.application.count({ where: { userId } }),
  ]);

  // Compute Career Readiness Score
  // 1. Goals Completion Rate (25% weight)
  const goalRate = totalGoals > 0 ? completedGoalsCount / totalGoals : 0;

  // 2. DSA Consistency (25% weight)
  // Target: 50 problems solved
  const dsaRate = Math.min(1, dsaProblemsCount / 50);

  // 3. Roadmap Progress (25% weight)
  // confidence is on a 1-5 scale
  const roadmapRate = (roadmapAgg._avg.confidence ?? 0) / 5;

  // 4. Interview Pipeline Health (25% weight)
  // Target: 5 applications logged
  const interviewRate = Math.min(1, applicationsCount / 5);

  const computedScore = Math.round((goalRate * 0.25 + dsaRate * 0.25 + roadmapRate * 0.25 + interviewRate * 0.25) * 100);

  // Cache/persist it if it changes
  let currentScore = snapshot?.careerScore ?? 0;
  if (computedScore !== currentScore) {
    await prisma.user.update({
      where: { id: userId },
      data: { careerScore: computedScore },
    });
    currentScore = computedScore;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const heatmapData: Record<string, number> = {};
  let todayMinutes = 0;
  let weekMinutes = 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const session of sessions) {
    const key = format(session.date, "yyyy-MM-dd");
    heatmapData[key] = (heatmapData[key] ?? 0) + Math.min(4, Math.ceil(session.minutes / 60));

    if (key === today) todayMinutes += session.minutes;
    if (session.date.getTime() >= weekAgo) weekMinutes += session.minutes;
  }

  return {
    careerScore: currentScore,
    currentStreak: snapshot?.currentStreak ?? 0,
    longestStreak: snapshot?.longestStreak ?? 0,
    todayMinutes,
    weekMinutes,
    heatmapData,
    upcomingDeadlines: deadlines,
  };
}
