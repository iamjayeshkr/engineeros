import { roadmapRepository, CreateRoadmapInput, UpdateRoadmapInput } from "@/server/repositories/roadmap.repository";

export const roadmapService = {
  async getRoadmap(userId: string) {
    return roadmapRepository.getRoadmap(userId);
  },

  async createRoadmapItem(data: CreateRoadmapInput) {
    return roadmapRepository.createRoadmapItem(data);
  },

  async updateRoadmapItem(id: string, data: UpdateRoadmapInput) {
    return roadmapRepository.updateRoadmapItem(id, data);
  },

  async deleteRoadmapItem(id: string) {
    return roadmapRepository.deleteRoadmapItem(id);
  },
};
