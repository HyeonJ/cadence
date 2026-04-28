import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import type { Tables } from "@cadence/db";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  user_id: z.string().uuid(),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  sprint: Tables<"sprints"> | null;
}

export const getActiveSprintTool: ToolDef<Input, Output> = {
  name: "get_active_sprint",
  description: "user의 현재 active sprint 1건을 조회. 없으면 null.",
  inputSchema: InputSchema,
  handler: async ({ user_id }) => {
    const client = getServiceClient();
    const { data, error } = await client
      .from("sprints")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(`get_active_sprint failed: ${error.message}`);
    return { sprint: data ?? null };
  },
};
