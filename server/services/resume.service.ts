import { resumeRepository, CreateResumeInput, UpdateResumeInput } from "@/server/repositories/resume.repository";

export const resumeService = {
  async getResumes(userId: string) {
    return resumeRepository.getResumes(userId);
  },

  async createResume(data: CreateResumeInput) {
    return resumeRepository.createResume(data);
  },

  async updateResume(id: string, userId: string, data: UpdateResumeInput) {
    return resumeRepository.updateResume(id, userId, data);
  },

  async deleteResume(id: string, userId: string) {
    return resumeRepository.deleteResume(id, userId);
  },
};
