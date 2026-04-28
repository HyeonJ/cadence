import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import type { UpdateTables } from "@cadence/db";
import { getServiceClient } from "../client.ts";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
type BackboneUpdate = UpdateTables<"sprint_backbone_items">;

const PatchSchema = z.object({
  content: z.record(z.unknown()).optional(),
  order_in_week: z.number().int().nonnegative().optional(),
  day_of_week_mask: z.number().int().min(1).max(127).optional(),
  slot_key: z
    .enum([
      "weekday_morning_input",
      "weekday_evening_build",
      "weekend_deep",
      "weekend_share",
    ])
    .optional(),
});

const InputSchema = z.object({
  item_id: z.string().uuid(),
  patch: PatchSchema,
});
type Input = z.infer<typeof InputSchema>;

export const updateBackboneItemTool: ToolDef<Input, { ok: true }> = {
  name: "update_backbone_item",
  description:
    "backbone item의 content (jsonb merge) / order / mask / slot 부분 수정 (L1 영구 변경).",
  inputSchema: InputSchema,
  handler: async ({ item_id, patch }) => {
    const client = getServiceClient();
    // content는 deep merge 위해 기존값 read 후 spread
    let mergedContent: Record<string, unknown> | undefined;
    if (patch.content) {
      const { data, error } = await client
        .from("sprint_backbone_items")
        .select("content")
        .eq("id", item_id)
        .single();
      if (error) throw new Error(`update_backbone_item read failed: ${error.message}`);
      mergedContent = { ...(data!.content as Record<string, unknown>), ...patch.content };
    }
    const updateRow: BackboneUpdate = {};
    if (mergedContent) updateRow.content = mergedContent as unknown as Json;
    if (patch.order_in_week !== undefined) updateRow.order_in_week = patch.order_in_week;
    if (patch.day_of_week_mask !== undefined)
      updateRow.day_of_week_mask = patch.day_of_week_mask;
    if (patch.slot_key) updateRow.slot_key = patch.slot_key;

    if (Object.keys(updateRow).length === 0) return { ok: true as const };

    const { error } = await client
      .from("sprint_backbone_items")
      .update(updateRow)
      .eq("id", item_id);
    if (error) throw new Error(`update_backbone_item failed: ${error.message}`);
    return { ok: true as const };
  },
};
