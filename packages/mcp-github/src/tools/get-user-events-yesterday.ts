import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getOctokit, kstDayWindow } from "../client.ts";

const InputSchema = z.object({
  github_username: z.string().min(1),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  events_count: number;
  fetch_status: "ok" | "rate_limited" | "5xx" | "partial";
  fetch_error: string | null;
  rate_limit_remaining: number | null;
}

const COUNTABLE_TYPES = new Set(["PushEvent", "PullRequestEvent", "PullRequestReviewEvent"]);

export const getUserEventsYesterdayTool: ToolDef<Input, Output> = {
  name: "get_user_events_yesterday",
  description:
    "user의 어제 KST PushEvent/PullRequestEvent/PullRequestReviewEvent 카운트. rate limit 시 fetch_status=rate_limited + count=0.",
  inputSchema: InputSchema,
  handler: async ({ github_username, date_kst }) => {
    const octokit = getOctokit();
    const { since, until } = kstDayWindow(date_kst);
    try {
      const res = await octokit.activity.listPublicEventsForUser({
        username: github_username,
        per_page: 100,
      });
      const remaining = Number(res.headers["x-ratelimit-remaining"] ?? "0");
      const events = (res.data as Array<{ type: string; created_at: string }>).filter((e) => {
        if (!COUNTABLE_TYPES.has(e.type)) return false;
        const t = new Date(e.created_at).toISOString();
        return t >= since && t < until;
      });
      return {
        events_count: events.length,
        fetch_status: "ok",
        fetch_error: null,
        rate_limit_remaining: remaining,
      };
    } catch (err) {
      const e = err as { status?: number; message?: string };
      if (e.status === 429 || e.status === 403) {
        return {
          events_count: 0,
          fetch_status: "rate_limited",
          fetch_error: e.message ?? "rate limited",
          rate_limit_remaining: 0,
        };
      }
      if (e.status && e.status >= 500) {
        return {
          events_count: 0,
          fetch_status: "5xx",
          fetch_error: e.message ?? "5xx",
          rate_limit_remaining: null,
        };
      }
      throw err;
    }
  },
};
