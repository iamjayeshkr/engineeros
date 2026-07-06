import { learningRepository, CreateLearningInput, UpdateLearningInput } from "@/server/repositories/learning.repository";

export const learningService = {
  async getLearningItems(userId: string) {
    return learningRepository.getLearningItems(userId);
  },

  async createLearningItem(data: CreateLearningInput) {
    return learningRepository.createLearningItem(data);
  },

  async updateLearningItem(id: string, data: UpdateLearningInput) {
    return learningRepository.updateLearningItem(id, data);
  },

  async deleteLearningItem(id: string) {
    return learningRepository.deleteLearningItem(id);
  },
};
