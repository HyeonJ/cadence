import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import type { Tables } from "@cadence/db";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  user_id: z.string().uuid(),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  signals: Tables<"yesterday_signals"> | null;
}

export const getYesterdaySignalsTool: ToolDef<Input, Output> = {
  name: "get_yesterday_signals",
  description: "user의 어제 signals row 1건 조회. 없으면 null.",
  inputSchema: InputSchema,
  handler: async ({ user_id, date_kst }) => {
    const client = getServiceClient();
    const { data, error } = await client
      .from("yesterday_signals")
      .select("*")
      .eq("user_id", user_id)
      .eq("date_kst", date_kst)
      .maybeSingle();
    if (error) throw new Error(`get_yesterday_signals failed: ${error.message}`);
    return { signals: data ?? null };
  },
};
