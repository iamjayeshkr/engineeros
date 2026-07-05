import { prisma } from "@/server/db/client";
import { subDays } from "date-fns";

export const dashboardRepository = {
  async getUserSnapshot(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        careerScore: true,
        currentStreak: true,
        longestStreak: true,
      },
    });
  },

  async getStudySessionsSince(userId: string, days: number) {
    return prisma.studySession.findMany({
      where: { userId, date: { gte: subDays(new Date(), days) } },
      select: { date: true, minutes: true, category: true },
    });
  },

  async getUpcomingDeadlines(userId: string, limit = 5) {
    return prisma.goal.findMany({
      where: { userId, dueDate: { gte: new Date() }, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      take: limit,
      select: { id: true, title: true, dueDate: true, type: true },
    });
  },
};
