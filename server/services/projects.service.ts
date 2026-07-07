import { prisma } from "@/server/db/client";
import { 
  projectsRepository, 
  CreateProjectInput, 
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput
} from "@/server/repositories/projects.repository";
import { Status } from "@/generated/prisma/enums";

export const projectsService = {
  async getProjects(userId: string) {
    const projects = await projectsRepository.getProjects(userId);
    return projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === Status.DONE).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return {
        ...project,
        progress,
      };
    });
  },

  async createProject(data: CreateProjectInput) {
    return projectsRepository.createProject(data);
  },

  async updateProject(id: string, userId: string, data: UpdateProjectInput) {
    return projectsRepository.updateProject(id, userId, data);
  },

  async deleteProject(id: string, userId: string) {
    return projectsRepository.deleteProject(id, userId);
  },

  // Tasks — ProjectTask has no userId column, so every mutation first
  // confirms the parent project belongs to the caller before touching it.
  async createTask(userId: string, data: CreateTaskInput) {
    const project = await projectsRepository.getOwnedProject(data.projectId, userId);
    if (!project) throw new Error("Project not found");

    const task = await projectsRepository.createTask(data);
    await this.syncProjectStatusFromTasks(data.projectId);
    return task;
  },

  async updateTask(id: string, projectId: string, userId: string, data: UpdateTaskInput) {
    const project = await projectsRepository.getOwnedProject(projectId, userId);
    if (!project) throw new Error("Project not found");

    const task = await projectsRepository.updateTask(id, projectId, data);
    await this.syncProjectStatusFromTasks(projectId);
    return task;
  },

  async deleteTask(id: string, projectId: string, userId: string) {
    const project = await projectsRepository.getOwnedProject(projectId, userId);
    if (!project) throw new Error("Project not found");

    const task = await projectsRepository.deleteTask(id, projectId);
    await this.syncProjectStatusFromTasks(projectId);
    return task;
  },

  async syncProjectStatusFromTasks(projectId: string): Promise<void> {
    // If all tasks are completed, mark project status as DONE
    // If at least one task is IN_PROGRESS, mark project status as IN_PROGRESS
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true },
    });
    if (!project || project.tasks.length === 0) return;

    const allDone = project.tasks.every(t => t.status === Status.DONE);
    const anyActive = project.tasks.some(t => t.status === Status.IN_PROGRESS || t.status === Status.DONE);

    let newStatus = project.status;
    if (allDone) {
      newStatus = Status.DONE;
    } else if (anyActive && project.status === Status.NOT_STARTED) {
      newStatus = Status.IN_PROGRESS;
    }

    if (newStatus !== project.status) {
      // Internal cascade, not a user-facing mutation — ownership was already
      // verified by the caller (createTask/updateTask/deleteTask) before this
      // ran, so update directly by projectId rather than through the
      // user-scoped repository method.
      await prisma.project.update({
        where: { id: projectId },
        data: { status: newStatus },
      });
    }
  }
};
