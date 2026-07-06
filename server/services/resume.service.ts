import { resumeRepository, CreateResumeInput, UpdateResumeInput } from "@/server/repositories/resume.repository";

export const resumeService = {
  async getResumes(userId: string) {
    return resumeRepository.getResumes(userId);
  },

  async createResume(data: CreateResumeInput) {
    return resumeRepository.createResume(data);
  },

  async updateResume(id: string, data: UpdateResumeInput) {
    return resumeRepository.updateResume(id, data);
  },

  async deleteResume(id: string) {
    return resumeRepository.deleteResume(id);
  },
};
