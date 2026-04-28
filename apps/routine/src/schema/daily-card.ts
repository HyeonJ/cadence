import { z } from "zod";

export const DailyCardItemSchema = z.object({
  source_backbone_id: z.string().uuid(),
  slot_key: z.enum([
    "weekday_morning_input",
    "weekday_evening_build",
    "weekend_deep",
    "weekend_share",
  ]),
  title: z.string().min(1).max(200),
  url: z.string().url().optional(),
  kind: z.enum(["manual_check", "auto_signal"]),
  auto_target: z
    .object({
      type: z.literal("commit_count"),
      repo: z.string().regex(/^[^/]+\/[^/]+$/),
      min: z.number().int().positive(),
    })
    .optional(),
  estimated_minutes: z.number().int().min(1).max(480),
});

export const DailyCardResponseSchema = z.object({
  coach_comment: z.string().min(1).max(2000),
  items: z.array(DailyCardItemSchema).min(0).max(10),
});

export type DailyCardResponse = z.infer<typeof DailyCardResponseSchema>;
export type DailyCardItem = z.infer<typeof DailyCardItemSchema>;
