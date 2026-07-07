"use server";

import { requireUser } from "@/lib/auth/supabase-server";
import { goalsService } from "@/server/services/goals.service";
import { createGoalSchema, updateGoalSchema } from "@/lib/validations/goals";
import { revalidatePath } from "next/cache";

export async function getGoalsAction() {
  try {
    const user = await requireUser();
    const goals = await goalsService.getGoals(user.id);
    return { success: true, goals };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch goals" };
  }
}

export async function getGoalHierarchyAction() {
  try {
    const user = await requireUser();
    const hierarchy = await goalsService.getGoalHierarchy(user.id);
    return { success: true, hierarchy };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch goal hierarchy" };
  }
}

export async function createGoalAction(formData: any) {
  try {
    const user = await requireUser();
    const validated = createGoalSchema.parse(formData);

    const goal = await goalsService.createGoal({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true, goal };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create goal" };
  }
}

export async function updateGoalAction(goalId: string, formData: any) {
  try {
    const user = await requireUser();
    const validated = updateGoalSchema.parse(formData);

    const goal = await goalsService.updateGoal(goalId, user.id, validated);

    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true, goal };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update goal" };
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    const user = await requireUser();
    await goalsService.deleteGoal(goalId, user.id);

    revalidatePath("/goals");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete goal" };
  }
}
