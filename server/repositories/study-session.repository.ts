import { prisma } from "@/server/db/client";

export interface LogStudySessionInput {
  userId: string;
  date: Date;
  category: string;
  minutes: number;
  deepWork?: boolean;
}

export const studySessionRepository = {
  async upsertStudySession(data: LogStudySessionInput) {
    // Normalize date to YYYY-MM-DD
    const normalizedDate = new Date(data.date.toISOString().split("T")[0]);

    return prisma.studySession.upsert({
      where: {
        userId_date_category: {
          userId: data.userId,
          date: normalizedDate,
          category: data.category,
        },
      },
      update: {
        minutes: {
          increment: data.minutes,
        },
        deepWork: data.deepWork !== undefined ? data.deepWork : undefined,
      },
      create: {
        userId: data.userId,
        date: normalizedDate,
        category: data.category,
        minutes: data.minutes,
        deepWork: data.deepWork || false,
      },
    });
  },

  async getStudySessionsSince(userId: string, date: Date) {
    return prisma.studySession.findMany({
      where: {
        userId,
        date: {
          gte: date,
        },
      },
      orderBy: { date: "asc" },
    });
  },

  async getUserSnapshot(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        currentStreak: true,
        longestStreak: true,
      },
    });
  },

  async updateUserSnapshotStreaks(userId: string, currentStreak: number, longestStreak: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak,
      },
    });
  },

  async getAllUniqueActiveDates(userId: string) {
    // Fetch unique dates where user has logged study sessions
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    });
    return sessions.map((s) => s.date);
  },
};
