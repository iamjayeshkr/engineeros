"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { resumeService } from "@/server/services/resume.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const resumeSchema = z.object({
  label: z.string().min(1, "Label is required"),
  targetRole: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  starStories: z.any().nullable().optional(),
});

export async function createResumeAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = resumeSchema.parse(formData);

    const resume = await resumeService.createResume({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/resume");
    return { success: true, resume };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create resume version" };
  }
}

export async function updateResumeAction(id: string, formData: any) {
  try {
    await requireUser();
    const validated = resumeSchema.partial().parse(formData);

    const resume = await resumeService.updateResume(id, validated);

    revalidatePath("/resume");
    return { success: true, resume };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update resume version" };
  }
}

export async function deleteResumeAction(id: string) {
  try {
    await requireUser();
    await resumeService.deleteResume(id);

    revalidatePath("/resume");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete resume version" };
  }
}
