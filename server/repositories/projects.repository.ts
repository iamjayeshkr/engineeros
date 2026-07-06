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

  async updateProject(id: string, data: UpdateProjectInput) {
    return prisma.project.update({
      where: { id },
      data,
    });
  },

  async deleteProject(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  },

  // Project Tasks
  async createTask(data: CreateTaskInput) {
    return prisma.projectTask.create({
      data,
    });
  },

  async updateTask(id: string, data: UpdateTaskInput) {
    return prisma.projectTask.update({
      where: { id },
      data,
    });
  },

  async deleteTask(id: string) {
    return prisma.projectTask.delete({
      where: { id },
    });
  },
};
