import { prisma } from "@/server/db/client";

export interface CreateRoadmapInput {
  userId: string;
  topic: string;
  category: string;
  confidence: number;
  progress: number;
  notes?: string | null;
  resources?: any | null;
  projectIds?: string[];
}

export interface UpdateRoadmapInput {
  topic?: string;
  category?: string;
  confidence?: number;
  progress?: number;
  notes?: string | null;
  resources?: any | null;
  projectIds?: string[];
}

export const roadmapRepository = {
  async getRoadmap(userId: string) {
    return prisma.roadmapItem.findMany({
      where: { userId },
      orderBy: { category: "asc" },
      take: 500,
    });
  },

  async createRoadmapItem(data: CreateRoadmapInput) {
    return prisma.roadmapItem.create({
      data: {
        userId: data.userId,
        topic: data.topic,
        category: data.category,
        confidence: data.confidence,
        progress: data.progress,
        notes: data.notes || null,
        resources: data.resources || null,
        projectIds: data.projectIds || [],
      },
    });
  },

  async updateRoadmapItem(id: string, userId: string, data: UpdateRoadmapInput) {
    // Extended-where scoping: filters by id AND userId, so it throws
    // "not found" (P2025) rather than updating another user's roadmap item.
    return prisma.roadmapItem.update({
      where: { id, userId },
      data,
    });
  },

  async deleteRoadmapItem(id: string, userId: string) {
    return prisma.roadmapItem.delete({
      where: { id, userId },
    });
  },
};
