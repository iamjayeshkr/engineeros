import { prisma } from "@/server/db/client";
import { ProjectKind, Status, RiskLevel } from "@/generated/prisma/enums";

export interface CreateProjectInput {
  userId: string;
  name: string;
  kind: ProjectKind;
  status: Status;
  owner?: string | null;
  risk?: RiskLevel | null;
  estHours?: number | null;
  actualHours?: number | null;
  metadata?: any | null;
}

export interface UpdateProjectInput {
  name?: string;
  kind?: ProjectKind;
  status?: Status;
  owner?: string | null;
  risk?: RiskLevel | null;
  estHours?: number | null;
  actualHours?: number | null;
  metadata?: any | null;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  phase: string;
  status: Status;
}

export interface UpdateTaskInput {
  title?: string;
  phase?: string;
  status?: Status;
}

export const projectsRepository = {
  async getProjects(userId: string) {
    return prisma.project.findMany({
      where: { userId },
      include: { tasks: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  },

  async createProject(data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        userId: data.userId,
        name: data.name,
        kind: data.kind,
        status: data.status,
        owner: data.owner || null,
        risk: data.risk || null,
        estHours: data.estHours || null,
        actualHours: data.actualHours || null,
        metadata: data.metadata || null,
      },
    });
  },

  async updateProject(id: string, userId: string, data: UpdateProjectInput) {
    // Extended-where scoping: filters by id AND userId, so it throws
    // "not found" (P2025) rather than updating another user's project.
    return prisma.project.update({
      where: { id, userId },
      data,
    });
  },

  async deleteProject(id: string, userId: string) {
    return prisma.project.delete({
      where: { id, userId },
    });
  },

  // Ownership check for the project a task belongs to — ProjectTask has no
  // userId of its own, so ownership always flows through the parent Project.
  async getOwnedProject(projectId: string, userId: string) {
    return prisma.project.findUnique({
      where: { id: projectId, userId },
    });
  },

  // Project Tasks
  async createTask(data: CreateTaskInput) {
    return prisma.projectTask.create({
      data,
    });
  },

  async updateTask(id: string, projectId: string, data: UpdateTaskInput) {
    // Scoped by id AND projectId (whose ownership the service layer has
    // already verified) so a task can't be re-parented onto someone else's project.
    return prisma.projectTask.update({
      where: { id, projectId },
      data,
    });
  },

  async deleteTask(id: string, projectId: string) {
    return prisma.projectTask.delete({
      where: { id, projectId },
    });
  },
};
