import { dashboardRepository } from "@/server/repositories/dashboard.repository";
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
  const [snapshot, sessions, deadlines] = await Promise.all([
    dashboardRepository.getUserSnapshot(userId),
    dashboardRepository.getStudySessionsSince(userId, 18 * 7),
    dashboardRepository.getUpcomingDeadlines(userId),
  ]);

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
    careerScore: snapshot?.careerScore ?? 0,
    currentStreak: snapshot?.currentStreak ?? 0,
    longestStreak: snapshot?.longestStreak ?? 0,
    todayMinutes,
    weekMinutes,
    heatmapData,
    upcomingDeadlines: deadlines,
  };
}
