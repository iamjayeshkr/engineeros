import { prisma } from "@/server/db/client";
import { Platform, Difficulty } from "@/generated/prisma/enums";

export interface CreateDsaInput {
  userId: string;
  title: string;
  platform: Platform;
  difficulty: Difficulty;
  topic?: string[];
  companyTags?: string[];
  timeTakenMins?: number | null;
  mistakes?: string | null;
  confidence: number;
  bookmarked?: boolean;
  solvedAt?: Date;
  nextRevisionAt?: Date | null;
}

export interface UpdateDsaInput {
  title?: string;
  platform?: Platform;
  difficulty?: Difficulty;
  topic?: string[];
  companyTags?: string[];
  timeTakenMins?: number | null;
  mistakes?: string | null;
  confidence?: number;
  revisionCount?: number;
  bookmarked?: boolean;
  solvedAt?: Date;
  nextRevisionAt?: Date | null;
}

export const dsaRepository = {
  async getDsaProblems(userId: string) {
    return prisma.dsaProblem.findMany({
      where: { userId },
      orderBy: { solvedAt: "desc" },
    });
  },

  async getDsaProblemById(problemId: string) {
    return prisma.dsaProblem.findUnique({
      where: { id: problemId },
    });
  },

  async getRevisionQueue(userId: string) {
    return prisma.dsaProblem.findMany({
      where: {
        userId,
        nextRevisionAt: {
          lte: new Date(),
        },
      },
      orderBy: { nextRevisionAt: "asc" },
    });
  },

  async createDsaProblem(data: CreateDsaInput) {
    return prisma.dsaProblem.create({
      data: {
        userId: data.userId,
        title: data.title,
        platform: data.platform,
        difficulty: data.difficulty,
        topic: data.topic || [],
        companyTags: data.companyTags || [],
        timeTakenMins: data.timeTakenMins || null,
        mistakes: data.mistakes || null,
        confidence: data.confidence,
        bookmarked: data.bookmarked || false,
        solvedAt: data.solvedAt || new Date(),
        nextRevisionAt: data.nextRevisionAt || null,
        revisionCount: 0,
      },
    });
  },

  async updateDsaProblem(problemId: string, data: UpdateDsaInput) {
    return prisma.dsaProblem.update({
      where: { id: problemId },
      data,
    });
  },

  async deleteDsaProblem(problemId: string) {
    return prisma.dsaProblem.delete({
      where: { id: problemId },
    });
  },
};
