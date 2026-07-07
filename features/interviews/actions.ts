"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { interviewsService } from "@/server/services/interviews.service";
import { AppStage } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const applicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  stage: z.nativeEnum(AppStage),
  appliedAt: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : new Date())),
});

const roundSchema = z.object({
  applicationId: z.string().min(1),
  roundName: z.string().min(1, "Round name is required"),
  scheduledAt: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : null)),
  feedback: z.string().nullable().optional(),
  result: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function createApplicationAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = applicationSchema.parse(formData);

    const app = await interviewsService.createApplication({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/interviews");
    return { success: true, app };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log application" };
  }
}

export async function updateApplicationAction(id: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = applicationSchema.partial().parse(formData);

    const app = await interviewsService.updateApplication(id, user.id, validated);

    revalidatePath("/interviews");
    return { success: true, app };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update application" };
  }
}

export async function deleteApplicationAction(id: string) {
  try {
    const user = await requireUser();
    await interviewsService.deleteApplication(id, user.id);

    revalidatePath("/interviews");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete application" };
  }
}

// Rounds
export async function createRoundAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = roundSchema.parse(formData);

    const round = await interviewsService.createRound(user.id, validated);

    revalidatePath("/interviews");
    return { success: true, round };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create round" };
  }
}

export async function updateRoundAction(id: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = roundSchema.omit({ applicationId: true }).partial().parse(formData);

    const round = await interviewsService.updateRound(id, user.id, validated);

    revalidatePath("/interviews");
    return { success: true, round };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update round" };
  }
}

export async function deleteRoundAction(id: string) {
  try {
    const user = await requireUser();
    await interviewsService.deleteRound(id, user.id);

    revalidatePath("/interviews");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete round" };
  }
}
