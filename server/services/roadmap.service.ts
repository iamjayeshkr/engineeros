import { roadmapRepository, CreateRoadmapInput, UpdateRoadmapInput } from "@/server/repositories/roadmap.repository";

export const roadmapService = {
  async getRoadmap(userId: string) {
    return roadmapRepository.getRoadmap(userId);
  },

  async createRoadmapItem(data: CreateRoadmapInput) {
    return roadmapRepository.createRoadmapItem(data);
  },

  async updateRoadmapItem(id: string, userId: string, data: UpdateRoadmapInput) {
    return roadmapRepository.updateRoadmapItem(id, userId, data);
  },

  async deleteRoadmapItem(id: string, userId: string) {
    return roadmapRepository.deleteRoadmapItem(id, userId);
  },
};
