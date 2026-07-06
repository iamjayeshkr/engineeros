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
  const [snapshot, sessions, deadlines, goals, dsaProblems, roadmapItems, applications] = await Promise.all([
    dashboardRepository.getUserSnapshot(userId),
    dashboardRepository.getStudySessionsSince(userId, 18 * 7),
    dashboardRepository.getUpcomingDeadlines(userId),
    prisma.goal.findMany({ where: { userId } }),
    prisma.dsaProblem.findMany({ where: { userId } }),
    prisma.roadmapItem.findMany({ where: { userId } }),
    prisma.application.findMany({ where: { userId } }),
  ]);

  // Compute Career Readiness Score
  // 1. Goals Completion Rate (25% weight)
  const completedGoals = goals.filter((g) => g.status === "DONE").length;
  const goalRate = goals.length > 0 ? completedGoals / goals.length : 0;

  // 2. DSA Consistency (25% weight)
  // Target: 50 problems solved
  const dsaRate = Math.min(1, dsaProblems.length / 50);

  // 3. Roadmap Progress (25% weight)
  // confidence is on a 1-5 scale
  const avgConfidence = roadmapItems.length > 0 
    ? (roadmapItems.reduce((sum, item) => sum + item.confidence, 0) / roadmapItems.length)
    : 0;
  const roadmapRate = avgConfidence / 5;

  // 4. Interview Pipeline Health (25% weight)
  // Target: 5 applications logged
  const interviewRate = Math.min(1, applications.length / 5);

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
