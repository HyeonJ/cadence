import { z } from "zod";

export const StudyGuideStepSchema = z.object({
  minutes: z.number().int().positive().max(180),
  action: z.string().min(3).max(300),
});

export const StudyGuideSchema = z.object({
  objective: z.string().min(10).max(500),
  key_points: z.array(z.string().min(3).max(200)).min(2).max(6),
  steps: z.array(StudyGuideStepSchema).min(1).max(10),
});

export type StudyGuide = z.infer<typeof StudyGuideSchema>;
export type StudyGuideStep = z.infer<typeof StudyGuideStepSchema>;
