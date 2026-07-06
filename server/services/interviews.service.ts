import { 
  interviewsRepository, 
  CreateApplicationInput, 
  UpdateApplicationInput,
  CreateRoundInput,
  UpdateRoundInput
} from "@/server/repositories/interviews.repository";

export const interviewsService = {
  async getApplications(userId: string) {
    return interviewsRepository.getApplications(userId);
  },

  async createApplication(data: CreateApplicationInput) {
    return interviewsRepository.createApplication(data);
  },

  async updateApplication(id: string, data: UpdateApplicationInput) {
    return interviewsRepository.updateApplication(id, data);
  },

  async deleteApplication(id: string) {
    return interviewsRepository.deleteApplication(id);
  },

  // Rounds
  async createRound(data: CreateRoundInput) {
    return interviewsRepository.createRound(data);
  },

  async updateRound(id: string, data: UpdateRoundInput) {
    return interviewsRepository.updateRound(id, data);
  },

  async deleteRound(id: string) {
    return interviewsRepository.deleteRound(id);
  },
};
