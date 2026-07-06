"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { learningService } from "@/server/services/learning.service";
import { LearningType, Status } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const learningSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(LearningType),
  status: z.nativeEnum(Status),
  notes: z.string().nullable().optional(),
  highlights: z.any().nullable().optional(),
});

export async function createLearningItemAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = learningSchema.parse(formData);

    const item = await learningService.createLearningItem({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/learning");
    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create learning item" };
  }
}

export async function updateLearningItemAction(id: string, formData: any) {
  try {
    await requireUser();
    const validated = learningSchema.partial().parse(formData);

    const item = await learningService.updateLearningItem(id, validated);

    revalidatePath("/learning");
    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update learning item" };
  }
}

export async function deleteLearningItemAction(id: string) {
  try {
    await requireUser();
    await learningService.deleteLearningItem(id);

    revalidatePath("/learning");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete learning item" };
  }
}
