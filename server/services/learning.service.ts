import { learningRepository, CreateLearningInput, UpdateLearningInput } from "@/server/repositories/learning.repository";

export const learningService = {
  async getLearningItems(userId: string) {
    return learningRepository.getLearningItems(userId);
  },

  async createLearningItem(data: CreateLearningInput) {
    return learningRepository.createLearningItem(data);
  },

  async updateLearningItem(id: string, userId: string, data: UpdateLearningInput) {
    return learningRepository.updateLearningItem(id, userId, data);
  },

  async deleteLearningItem(id: string, userId: string) {
    return learningRepository.deleteLearningItem(id, userId);
  },
};
