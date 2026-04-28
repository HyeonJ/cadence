import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import type { Tables } from "@cadence/db";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  sprint_id: z.string().uuid(),
  week_index: z.number().int().min(1).max(4).optional(),
  include_inactive: z.boolean().default(false),
});
type Input = z.input<typeof InputSchema>;

export const listBackboneTool: ToolDef<Input, { items: Tables<"sprint_backbone_items">[] }> = {
  name: "list_backbone",
  description:
    "sprint의 backbone items 조회. week_index 지정 가능. include_inactive=false (기본) 시 effective_until가 NULL인 active item만.",
  inputSchema: InputSchema,
  handler: async (rawInput) => {
    const { sprint_id, week_index, include_inactive } = InputSchema.parse(rawInput);
    const client = getServiceClient();
    let query = client
      .from("sprint_backbone_items")
      .select("*")
      .eq("sprint_id", sprint_id)
      .order("week_index")
      .order("order_in_week");
    if (week_index !== undefined) query = query.eq("week_index", week_index);
    if (!include_inactive) query = query.is("effective_until", null);
    const { data, error } = await query;
    if (error) throw new Error(`list_backbone failed: ${error.message}`);
    return { items: data ?? [] };
  },
};
