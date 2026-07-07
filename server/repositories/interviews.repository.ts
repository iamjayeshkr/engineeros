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
      take: 500,
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

  async updateApplication(id: string, userId: string, data: UpdateApplicationInput) {
    // Extended-where scoping: filters by id AND userId, so it throws
    // "not found" (P2025) rather than updating another user's application.
    return prisma.application.update({
      where: { id, userId },
      data,
    });
  },

  async deleteApplication(id: string, userId: string) {
    return prisma.application.delete({
      where: { id, userId },
    });
  },

  // Ownership check for the application a round belongs to — InterviewRound
  // has no userId of its own, so ownership always flows through Application.
  async getOwnedApplication(applicationId: string, userId: string) {
    return prisma.application.findUnique({
      where: { id: applicationId, userId },
    });
  },

  async getRoundWithOwner(roundId: string) {
    return prisma.interviewRound.findUnique({
      where: { id: roundId },
      include: { application: true },
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

  async updateRound(id: string, applicationId: string, data: UpdateRoundInput) {
    // Scoped by id AND applicationId (whose ownership the service layer has
    // already verified) so a round can't be re-parented onto someone else's application.
    return prisma.interviewRound.update({
      where: { id, applicationId },
      data,
    });
  },

  async deleteRound(id: string, applicationId: string) {
    return prisma.interviewRound.delete({
      where: { id, applicationId },
    });
  },
};
