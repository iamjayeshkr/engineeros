"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { roadmapService } from "@/server/services/roadmap.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roadmapSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  category: z.string().min(1, "Category is required"),
  confidence: z.number().min(1).max(5),
  progress: z.number().min(0).max(100),
  notes: z.string().nullable().optional(),
  projectIds: z.array(z.string()).default([]),
});

export async function createRoadmapItemAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = roadmapSchema.parse(formData);

    const item = await roadmapService.createRoadmapItem({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/roadmap");
    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create roadmap item" };
  }
}

export async function updateRoadmapItemAction(id: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = roadmapSchema.partial().parse(formData);

    const item = await roadmapService.updateRoadmapItem(id, user.id, validated);

    revalidatePath("/roadmap");
    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update roadmap item" };
  }
}

export async function deleteRoadmapItemAction(id: string) {
  try {
    const user = await requireUser();
    await roadmapService.deleteRoadmapItem(id, user.id);

    revalidatePath("/roadmap");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete roadmap item" };
  }
}
