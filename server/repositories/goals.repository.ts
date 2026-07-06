import { prisma } from "@/server/db/client";
import { GoalType, Priority, Status } from "@/generated/prisma/enums";

export interface CreateGoalInput {
  userId: string;
  parentId?: string | null;
  title: string;
  type: GoalType;
  priority: Priority;
  tags?: string[];
  estHours?: number | null;
  actualHours?: number | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  dependsOnIds?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  type?: GoalType;
  priority?: Priority;
  tags?: string[];
  estHours?: number | null;
  actualHours?: number | null;
  progress?: number;
  status?: Status;
  dependsOnIds?: string[];
  startDate?: Date | null;
  dueDate?: Date | null;
}

export const goalsRepository = {
  async getGoals(userId: string) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { createdAt: "desc" } as any], // Order by type then creation
    });
  },

  async getGoalById(goalId: string) {
    return prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        children: true,
      },
    });
  },

  async createGoal(data: CreateGoalInput) {
    return prisma.goal.create({
      data: {
        userId: data.userId,
        parentId: data.parentId || null,
        title: data.title,
        type: data.type,
        priority: data.priority,
        tags: data.tags || [],
        estHours: data.estHours || null,
        actualHours: data.actualHours || null,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        dependsOnIds: data.dependsOnIds || [],
        status: "NOT_STARTED",
        progress: 0,
      },
    });
  },

  async updateGoal(goalId: string, data: UpdateGoalInput) {
    return prisma.goal.update({
      where: { id: goalId },
      data,
    });
  },

  async deleteGoal(goalId: string) {
    return prisma.goal.delete({
      where: { id: goalId },
    });
  },

  async getGoalHierarchy(userId: string) {
    return prisma.goal.findMany({
      where: { userId, parentId: null },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
    });
  },

  async getSiblingGoals(parentId: string) {
    return prisma.goal.findMany({
      where: { parentId },
    });
  },

  async getRootGoalsWithNoParent(userId: string) {
    return prisma.goal.findMany({
      where: { userId, parentId: null },
    });
  },
};
