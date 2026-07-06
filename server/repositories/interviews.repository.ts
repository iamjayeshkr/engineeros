import { prisma } from "@/server/db/client";
import { AppStage } from "@/generated/prisma/enums";

export interface CreateApplicationInput {
  userId: string;
  company: string;
  role: string;
  stage: AppStage;
  appliedAt?: Date;
}

export interface UpdateApplicationInput {
  company?: string;
  role?: string;
  stage?: AppStage;
  appliedAt?: Date;
}

export interface CreateRoundInput {
  applicationId: string;
  roundName: string;
  scheduledAt?: Date | null;
  feedback?: string | null;
  result?: string | null;
  notes?: string | null;
}

export interface UpdateRoundInput {
  roundName?: string;
  scheduledAt?: Date | null;
  feedback?: string | null;
  result?: string | null;
  notes?: string | null;
}

export const interviewsRepository = {
  async getApplications(userId: string) {
    return prisma.application.findMany({
      where: { userId },
      include: { rounds: true },
      orderBy: { appliedAt: "desc" },
    });
  },

  async createApplication(data: CreateApplicationInput) {
    return prisma.application.create({
      data: {
        userId: data.userId,
        company: data.company,
        role: data.role,
        stage: data.stage,
        appliedAt: data.appliedAt || new Date(),
      },
    });
  },

  async updateApplication(id: string, data: UpdateApplicationInput) {
    return prisma.application.update({
      where: { id },
      data,
    });
  },

  async deleteApplication(id: string) {
    return prisma.application.delete({
      where: { id },
    });
  },

  // Interview Rounds
  async createRound(data: CreateRoundInput) {
    return prisma.interviewRound.create({
      data: {
        applicationId: data.applicationId,
        roundName: data.roundName,
        scheduledAt: data.scheduledAt || null,
        feedback: data.feedback || null,
        result: data.result || null,
        notes: data.notes || null,
      },
    });
  },

  async updateRound(id: string, data: UpdateRoundInput) {
    return prisma.interviewRound.update({
      where: { id },
      data,
    });
  },

  async deleteRound(id: string) {
    return prisma.interviewRound.delete({
      where: { id },
    });
  },
};
