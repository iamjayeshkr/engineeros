import { dsaRepository, CreateDsaInput, UpdateDsaInput } from "@/server/repositories/dsa.repository";
import { addDays } from "date-fns";

export const dsaService = {
  async getDsaProblems(userId: string) {
    return dsaRepository.getDsaProblems(userId);
  },

  async getDsaProblemById(problemId: string) {
    return dsaRepository.getDsaProblemById(problemId);
  },

  async getRevisionQueue(userId: string) {
    return dsaRepository.getRevisionQueue(userId);
  },

  calculateNextRevisionDate(confidence: number, fromDate: Date = new Date()): Date {
    let daysToAdd = 1;
    switch (confidence) {
      case 5:
        daysToAdd = 30;
        break;
      case 4:
        daysToAdd = 14;
        break;
      case 3:
        daysToAdd = 7;
        break;
      case 2:
        daysToAdd = 3;
        break;
      case 1:
      default:
        daysToAdd = 1;
        break;
    }
    return addDays(fromDate, daysToAdd);
  },

  async createDsaProblem(data: CreateDsaInput) {
    // Automatically calculate next revision date based on confidence
    const nextRevisionAt = this.calculateNextRevisionDate(data.confidence, data.solvedAt || new Date());
    
    return dsaRepository.createDsaProblem({
      ...data,
      nextRevisionAt,
    });
  },

  async updateDsaProblem(problemId: string, data: UpdateDsaInput) {
    const existing = await dsaRepository.getDsaProblemById(problemId);
    if (!existing) throw new Error("DSA problem not found");

    const updatePayload: UpdateDsaInput = { ...data };

    // If confidence or solved date changes, recalculate next revision date
    if (data.confidence !== undefined || data.solvedAt !== undefined) {
      const confidence = data.confidence !== undefined ? data.confidence : existing.confidence;
      const solvedAt = data.solvedAt !== undefined ? data.solvedAt : existing.solvedAt;
      updatePayload.nextRevisionAt = this.calculateNextRevisionDate(confidence, solvedAt);
    }

    return dsaRepository.updateDsaProblem(problemId, updatePayload);
  },

  async markAsRevised(problemId: string, newConfidence: number) {
    const existing = await dsaRepository.getDsaProblemById(problemId);
    if (!existing) throw new Error("DSA problem not found");

    const solvedAt = new Date();
    const nextRevisionAt = this.calculateNextRevisionDate(newConfidence, solvedAt);

    return dsaRepository.updateDsaProblem(problemId, {
      confidence: newConfidence,
      solvedAt,
      nextRevisionAt,
      revisionCount: existing.revisionCount + 1,
    });
  },

  async deleteDsaProblem(problemId: string) {
    return dsaRepository.deleteDsaProblem(problemId);
  },
};
