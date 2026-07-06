import { z } from "zod";
import { Platform, Difficulty } from "@/generated/prisma/enums";

export const createDsaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  platform: z.nativeEnum(Platform),
  difficulty: z.nativeEnum(Difficulty),
  topic: z.array(z.string()).default([]),
  companyTags: z.array(z.string()).default([]),
  timeTakenMins: z.number().nullable().optional(),
  mistakes: z.string().nullable().optional(),
  confidence: z.number().min(1).max(5),
  bookmarked: z.boolean().default(false),
  solvedAt: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : new Date())),
});

export const updateDsaSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  platform: z.nativeEnum(Platform).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  topic: z.array(z.string()).optional(),
  companyTags: z.array(z.string()).optional(),
  timeTakenMins: z.number().nullable().optional(),
  mistakes: z.string().nullable().optional(),
  confidence: z.number().min(1).max(5).optional(),
  bookmarked: z.boolean().optional(),
  solvedAt: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : undefined)),
});
