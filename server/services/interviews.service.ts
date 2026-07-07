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

  async updateApplication(id: string, userId: string, data: UpdateApplicationInput) {
    return interviewsRepository.updateApplication(id, userId, data);
  },

  async deleteApplication(id: string, userId: string) {
    return interviewsRepository.deleteApplication(id, userId);
  },

  // Rounds — InterviewRound has no userId column, so every mutation confirms
  // ownership through the parent Application before touching anything.
  async createRound(userId: string, data: CreateRoundInput) {
    const application = await interviewsRepository.getOwnedApplication(data.applicationId, userId);
    if (!application) throw new Error("Application not found");

    return interviewsRepository.createRound(data);
  },

  async updateRound(id: string, userId: string, data: UpdateRoundInput) {
    const round = await interviewsRepository.getRoundWithOwner(id);
    if (!round || round.application.userId !== userId) throw new Error("Round not found");

    return interviewsRepository.updateRound(id, round.applicationId, data);
  },

  async deleteRound(id: string, userId: string) {
    const round = await interviewsRepository.getRoundWithOwner(id);
    if (!round || round.application.userId !== userId) throw new Error("Round not found");

    return interviewsRepository.deleteRound(id, round.applicationId);
  },
};
