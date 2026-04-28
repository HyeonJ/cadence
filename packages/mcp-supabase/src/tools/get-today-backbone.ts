import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import type { Tables } from "@cadence/db";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  sprint_id: z.string().uuid(),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_index: z.number().int().min(1).max(4),
  day_of_week: z.number().int().min(0).max(6), // 0=Mon ... 6=Sun
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  items: Tables<"sprint_backbone_items">[];
}

export const getTodayBackboneTool: ToolDef<Input, Output> = {
  name: "get_today_backbone",
  description:
    "특정 sprint의 (week_index, day_of_week)에 활성인 backbone items 반환. effective_from ≤ date_kst < effective_until (NULL 허용) + day_of_week_mask에 해당 요일 비트 켜진 것만.",
  inputSchema: InputSchema,
  handler: async ({ sprint_id, date_kst, week_index, day_of_week }) => {
    const client = getServiceClient();
    const dayBit = 1 << day_of_week;
    const { data, error } = await client
      .from("sprint_backbone_items")
      .select("*")
      .eq("sprint_id", sprint_id)
      .eq("week_index", week_index)
      .lte("effective_from", date_kst)
      .or(`effective_until.is.null,effective_until.gt.${date_kst}`)
      .order("order_in_week");
    if (error) throw new Error(`get_today_backbone failed: ${error.message}`);
    const filtered = (data ?? []).filter((row) => (row.day_of_week_mask & dayBit) !== 0);
    return { items: filtered };
  },
};
