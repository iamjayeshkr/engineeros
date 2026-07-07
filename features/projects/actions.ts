"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { projectsService } from "@/server/services/projects.service";
import { ProjectKind, Status, RiskLevel } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  kind: z.nativeEnum(ProjectKind),
  status: z.nativeEnum(Status),
  owner: z.string().nullable().optional(),
  risk: z.nativeEnum(RiskLevel).nullable().optional(),
  estHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Task title is required"),
  phase: z.string().min(1, "Phase is required"),
  status: z.nativeEnum(Status),
});

export async function createProjectAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = projectSchema.parse(formData);

    const project = await projectsService.createProject({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/projects");
    return { success: true, project };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create project" };
  }
}

export async function updateProjectAction(id: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = projectSchema.partial().parse(formData);

    const project = await projectsService.updateProject(id, user.id, validated);

    revalidatePath("/projects");
    return { success: true, project };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update project" };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const user = await requireUser();
    await projectsService.deleteProject(id, user.id);

    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete project" };
  }
}

// Tasks
export async function createTaskAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = taskSchema.parse(formData);

    const task = await projectsService.createTask(user.id, validated);

    revalidatePath("/projects");
    return { success: true, task };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create task" };
  }
}

export async function updateTaskAction(id: string, projectId: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = taskSchema.omit({ projectId: true }).partial().parse(formData);

    const task = await projectsService.updateTask(id, projectId, user.id, validated);

    revalidatePath("/projects");
    return { success: true, task };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update task" };
  }
}

export async function deleteTaskAction(id: string, projectId: string) {
  try {
    const user = await requireUser();
    await projectsService.deleteTask(id, projectId, user.id);

    revalidatePath("/projects");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete task" };
  }
}
