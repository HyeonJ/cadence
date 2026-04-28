import { z } from "zod";
import type { ToolDef } from "../tool-registry.ts";
import { getOctokit, kstDayWindow } from "../client.ts";

const InputSchema = z.object({
  github_username: z.string().min(1),
  monitored_repos: z.array(z.string().regex(/^[^/]+\/[^/]+$/)).max(20),
  date_kst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type Input = z.infer<typeof InputSchema>;

interface Output {
  commits: Record<string, number>;
  fetch_status: "ok" | "rate_limited" | "5xx" | "partial";
  fetch_error: string | null;
  rate_limit_remaining: number | null;
  truncated: string[];
}

const PAGE_CAP = 300;

export const getRepoCommitsYesterdayTool: ToolDef<Input, Output> = {
  name: "get_repo_commits_yesterday",
  description:
    "monitored_repos 각각에서 user 이름의 어제 KST commit 카운트. author_date 사용. 각 repo 최대 300 commit. 일부 실패 시 partial.",
  inputSchema: InputSchema,
  handler: async ({ github_username, monitored_repos, date_kst }) => {
    const octokit = getOctokit();
    const { since, until } = kstDayWindow(date_kst);
    const commits: Record<string, number> = {};
    const truncated: string[] = [];
    let anyFail = false;
    let lastRemaining: number | null = null;
    let lastError: string | null = null;

    for (const repo of monitored_repos) {
      const [owner, name] = repo.split("/");
      try {
        const res = await octokit.repos.listCommits({
          owner,
          repo: name,
          author: github_username,
          since,
          until,
          per_page: 100,
        });
        const arr = res.data as Array<{ commit: { author: { date: string } | null } }>;
        if (arr.length >= PAGE_CAP) truncated.push(repo);
        commits[repo] = arr.filter((c) => {
          const t = c.commit?.author?.date;
          if (!t) return false;
          const iso = new Date(t).toISOString();
          return iso >= since && iso < until;
        }).length;
        lastRemaining = Number(res.headers["x-ratelimit-remaining"] ?? lastRemaining);
      } catch (err) {
        anyFail = true;
        const e = err as { status?: number; message?: string };
        lastError = e.message ?? "fetch error";
        commits[repo] = 0;
      }
    }

    return {
      commits,
      fetch_status: anyFail ? "partial" : "ok",
      fetch_error: lastError,
      rate_limit_remaining: lastRemaining,
      truncated,
    };
  },
};
