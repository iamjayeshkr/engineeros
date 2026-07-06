import { prisma } from "@/server/db/client";

export interface CreateResumeInput {
  userId: string;
  label: string;
  targetRole?: string | null;
  fileUrl?: string | null;
  starStories?: any | null;
}

export interface UpdateResumeInput {
  label?: string;
  targetRole?: string | null;
  fileUrl?: string | null;
  starStories?: any | null;
}

export const resumeRepository = {
  async getResumes(userId: string) {
    return prisma.resumeVersion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async createResume(data: CreateResumeInput) {
    return prisma.resumeVersion.create({
      data: {
        userId: data.userId,
        label: data.label,
        targetRole: data.targetRole || null,
        fileUrl: data.fileUrl || null,
        starStories: data.starStories || null,
      },
    });
  },

  async updateResume(id: string, data: UpdateResumeInput) {
    return prisma.resumeVersion.update({
      where: { id },
      data,
    });
  },

  async deleteResume(id: string) {
    return prisma.resumeVersion.delete({
      where: { id },
    });
  },
};
