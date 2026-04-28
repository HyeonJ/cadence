import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getServiceClient } from "../client.ts";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

const ContentSchema = z.object({
  title: z.string().min(1),
  materials: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url().optional(),
        source_tag: z.string().optional(),
      })
    )
    .default([]),
  targets: z.array(z.string()).default([]),
  estimated_minutes: z.number().int().positive(),
});

const InputSchema = z.object({
  sprint_id: z.string().uuid(),
  week_index: z.number().int().min(1).max(4),
  slot_key: z.enum([
    "weekday_morning_input",
    "weekday_evening_build",
    "weekend_deep",
    "weekend_share",
  ]),
  day_of_week_mask: z.number().int().min(1).max(127),
  content: ContentSchema,
  order_in_week: z.number().int().nonnegative().default(0),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type Input = z.input<typeof InputSchema>;

export const addBackboneItemTool: ToolDef<Input, { id: string }> = {
  name: "add_backbone_item",
  description:
    "sprint backbone에 새 item 추가 (L1 영구 변경). effective_from 이후 cron부터 반영.",
  inputSchema: InputSchema,
  handler: async (rawInput) => {
    const input = InputSchema.parse(rawInput);
    const client = getServiceClient();
    const { data, error } = await client
      .from("sprint_backbone_items")
      .insert({
        sprint_id: input.sprint_id,
        week_index: input.week_index,
        slot_key: input.slot_key,
        day_of_week_mask: input.day_of_week_mask,
        content: input.content as unknown as Json,
        order_in_week: input.order_in_week,
        effective_from: input.effective_from,
      })
      .select("id")
      .single();
    if (error) throw new Error(`add_backbone_item failed: ${error.message}`);
    return { id: data!.id };
  },
};
