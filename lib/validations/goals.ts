import { z } from "zod";
import { GoalType, Priority, Status } from "@/generated/prisma/enums";

export const createGoalSchema = z.object({
  parentId: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required"),
  type: z.nativeEnum(GoalType),
  priority: z.nativeEnum(Priority),
  tags: z.array(z.string()).default([]),
  estHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  startDate: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : null)),
  dueDate: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : null)),
  dependsOnIds: z.array(z.string()).default([]),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  type: z.nativeEnum(GoalType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
  estHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.nativeEnum(Status).optional(),
  dependsOnIds: z.array(z.string()).optional(),
  startDate: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : null)),
  dueDate: z.string().or(z.date()).nullable().optional().transform((val) => (val ? new Date(val) : null)),
});
