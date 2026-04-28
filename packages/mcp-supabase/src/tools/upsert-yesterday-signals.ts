import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getServiceClient } from "../client.ts";

const InputSchema = z.object({
  user_id: z.string().uuid(),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  github_events_count: z.number().int().nonnegative(),
  repo_commits: z.record(z.number().int().nonnegative()),
  blog_new_posts: z.number().int().nonnegative().default(0),
  fetch_status: z.enum(["ok", "rate_limited", "5xx", "partial"]),
  fetch_error: z.string().nullable().optional(),
  rate_limit_remaining: z.number().int().nullable().optional(),
  raw: z.record(z.unknown()).optional(),
});
type Input = z.infer<typeof InputSchema>;

export const upsertYesterdaySignalsTool: ToolDef<Input, { id: string }> = {
  name: "upsert_yesterday_signals",
  description:
    "user의 date_kst 어제 신호 upsert. 같은 (user_id, date_kst) 있으면 update. fetch_status는 신호 0인지 fetch 실패인지 구분.",
  inputSchema: InputSchema,
  handler: async (input) => {
    const client = getServiceClient();
    const { data, error } = await client
      .from("yesterday_signals")
      .upsert(
        {
          user_id: input.user_id,
          date_kst: input.date_kst,
          github_events_count: input.github_events_count,
          repo_commits: input.repo_commits,
          blog_new_posts: input.blog_new_posts,
          fetch_status: input.fetch_status,
          fetch_error: input.fetch_error ?? null,
          rate_limit_remaining: input.rate_limit_remaining ?? null,
          raw: input.raw ?? null,
        },
        { onConflict: "user_id,date_kst" }
      )
      .select("id")
      .single();
    if (error) throw new Error(`upsert_yesterday_signals failed: ${error.message}`);
    return { id: data!.id };
  },
};
