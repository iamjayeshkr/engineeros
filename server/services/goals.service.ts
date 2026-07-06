import { goalsRepository, CreateGoalInput, UpdateGoalInput } from "@/server/repositories/goals.repository";
import { Status } from "@/generated/prisma/enums";

export const goalsService = {
  async getGoals(userId: string) {
    return goalsRepository.getGoals(userId);
  },

  async getGoalById(goalId: string) {
    return goalsRepository.getGoalById(goalId);
  },

  async getGoalHierarchy(userId: string) {
    return goalsRepository.getGoalHierarchy(userId);
  },

  async createGoal(data: CreateGoalInput) {
    const goal = await goalsRepository.createGoal(data);
    if (goal.parentId) {
      await this.recalculateParentProgressCascade(goal.parentId);
    }
    return goal;
  },

  async updateGoal(goalId: string, data: UpdateGoalInput) {
    const goalBefore = await goalsRepository.getGoalById(goalId);
    if (!goalBefore) throw new Error("Goal not found");

    // Perform the update
    const updatedGoal = await goalsRepository.updateGoal(goalId, data);

    // If progress/status was updated, or parent relation changed, trigger cascades
    const progressUpdated = data.progress !== undefined || data.status !== undefined;
    
    if (progressUpdated) {
      // Recalculate parent progress if it has a parent
      if (updatedGoal.parentId) {
        await this.recalculateParentProgressCascade(updatedGoal.parentId);
      }
    }

    return updatedGoal;
  },

  async deleteGoal(goalId: string) {
    const goal = await goalsRepository.getGoalById(goalId);
    if (!goal) throw new Error("Goal not found");

    await goalsRepository.deleteGoal(goalId);

    if (goal.parentId) {
      await this.recalculateParentProgressCascade(goal.parentId);
    }
    return goal;
  },

  /**
   * Recursively recalculates progress up the parent goal chain.
   */
  async recalculateParentProgressCascade(parentId: string): Promise<void> {
    const parentGoal = await goalsRepository.getGoalById(parentId);
    if (!parentGoal) return;

    const siblings = await goalsRepository.getSiblingGoals(parentId);
    if (siblings.length === 0) {
      return;
    }

    // Compute average progress of children
    const totalProgress = siblings.reduce((sum, child) => sum + child.progress, 0);
    const averageProgress = Math.round(totalProgress / siblings.length);

    // Determine status based on progress
    let newStatus = parentGoal.status;
    if (averageProgress === 100) {
      newStatus = Status.DONE;
    } else if (averageProgress > 0 && parentGoal.status === Status.NOT_STARTED) {
      newStatus = Status.IN_PROGRESS;
    } else if (averageProgress === 0 && parentGoal.status === Status.DONE) {
      newStatus = Status.IN_PROGRESS;
    }

    // Update parent
    const updatedParent = await goalsRepository.updateGoal(parentId, {
      progress: averageProgress,
      status: newStatus,
    });

    // Recursively propagate up to grandparent
    if (updatedParent.parentId) {
      await this.recalculateParentProgressCascade(updatedParent.parentId);
    }
  },
};
