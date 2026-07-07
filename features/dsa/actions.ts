"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { dsaService } from "@/server/services/dsa.service";
import { createDsaSchema, updateDsaSchema } from "@/lib/validations/dsa";
import { revalidatePath } from "next/cache";

export async function getDsaProblemsAction() {
  try {
    const user = await requireUser();
    const problems = await dsaService.getDsaProblems(user.id);
    return { success: true, problems };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch DSA problems" };
  }
}

export async function getRevisionQueueAction() {
  try {
    const user = await requireUser();
    const queue = await dsaService.getRevisionQueue(user.id);
    return { success: true, queue };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch revision queue" };
  }
}

export async function createDsaProblemAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = createDsaSchema.parse(formData);

    const problem = await dsaService.createDsaProblem({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/dsa");
    revalidatePath("/dashboard");

    return { success: true, problem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to log DSA problem" };
  }
}

export async function updateDsaProblemAction(problemId: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = updateDsaSchema.parse(formData);

    const problem = await dsaService.updateDsaProblem(problemId, user.id, validated);

    revalidatePath("/dsa");
    revalidatePath("/dashboard");

    return { success: true, problem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update DSA problem" };
  }
}

export async function markAsRevisedAction(problemId: string, newConfidence: number) {
  try {
    const user = await requireUser();
    const problem = await dsaService.markAsRevised(problemId, user.id, newConfidence);

    revalidatePath("/dsa");
    revalidatePath("/dashboard");

    return { success: true, problem };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark problem as revised" };
  }
}

export async function deleteDsaProblemAction(problemId: string) {
  try {
    const user = await requireUser();
    await dsaService.deleteDsaProblem(problemId, user.id);

    revalidatePath("/dsa");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete DSA problem" };
  }
}
