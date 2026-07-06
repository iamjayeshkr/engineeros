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

  async updateProject(id: string, data: UpdateProjectInput) {
    return projectsRepository.updateProject(id, data);
  },

  async deleteProject(id: string) {
    return projectsRepository.deleteProject(id);
  },

  // Tasks
  async createTask(data: CreateTaskInput) {
    const task = await projectsRepository.createTask(data);
    await this.syncProjectStatusFromTasks(data.projectId);
    return task;
  },

  async updateTask(id: string, projectId: string, data: UpdateTaskInput) {
    const task = await projectsRepository.updateTask(id, data);
    await this.syncProjectStatusFromTasks(projectId);
    return task;
  },

  async deleteTask(id: string, projectId: string) {
    const task = await projectsRepository.deleteTask(id);
    await this.syncProjectStatusFromTasks(projectId);
    return task;
  },

  async syncProjectStatusFromTasks(projectId: string): Promise<void> {
    // If all tasks are completed, mark project status as DONE
    // If at least one task is IN_PROGRESS, mark project status as IN_PROGRESS
    const projects = await projectsRepository.getProjects(""); // Fetch dummy to query
    // Actually it's cleaner to query the tasks of the project
    // Let's do it in repositories or direct query
    const project = await prisma?.project.findUnique({
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
      await projectsRepository.updateProject(projectId, { status: newStatus });
    }
  }
};
