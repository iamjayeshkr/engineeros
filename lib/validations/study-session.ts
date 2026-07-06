import { z } from "zod";

export const logStudySessionSchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  category: z.string().min(1, "Category is required"),
  minutes: z.number().min(1, "Minutes must be at least 1"),
  deepWork: z.boolean().default(false),
});
