import { prisma } from "@/server/db/client";
import { LearningType, Status } from "@/generated/prisma/enums";

export interface CreateLearningInput {
  userId: string;
  title: string;
  type: LearningType;
  status: Status;
  notes?: string | null;
  highlights?: any | null;
}

export interface UpdateLearningInput {
  title?: string;
  type?: LearningType;
  status?: Status;
  notes?: string | null;
  highlights?: any | null;
}

export const learningRepository = {
  async getLearningItems(userId: string) {
    return prisma.learningItem.findMany({
      where: { userId },
      orderBy: { title: "asc" },
      take: 1000,
    });
  },

  async createLearningItem(data: CreateLearningInput) {
    return prisma.learningItem.create({
      data: {
        userId: data.userId,
        title: data.title,
        type: data.type,
        status: data.status,
        notes: data.notes || null,
        highlights: data.highlights || null,
      },
    });
  },

  async updateLearningItem(id: string, userId: string, data: UpdateLearningInput) {
    // Extended-where scoping: filters by id AND userId, so it throws
    // "not found" (P2025) rather than updating another user's learning item.
    return prisma.learningItem.update({
      where: { id, userId },
      data,
    });
  },

  async deleteLearningItem(id: string, userId: string) {
    return prisma.learningItem.delete({
      where: { id, userId },
    });
  },
};
