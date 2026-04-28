import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  item_id: z.string().uuid(),
  effective_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type Input = z.infer<typeof InputSchema>;

export const removeBackboneItemTool: ToolDef<Input, { ok: true }> = {
  name: "remove_backbone_item",
  description:
    "backbone item soft delete. effective_until 설정으로 그날부터 cron 검색에서 제외. 과거 daily_cards 정합성 유지.",
  inputSchema: InputSchema,
  handler: async ({ item_id, effective_until }) => {
    const client = getServiceClient();
    const { error } = await client
      .from("sprint_backbone_items")
      .update({ effective_until })
      .eq("id", item_id);
    if (error) throw new Error(`remove_backbone_item failed: ${error.message}`);
    return { ok: true as const };
  },
};
