import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { getRepoCommitsYesterdayTool } from "../src/tools/get-repo-commits-yesterday.ts";
import { resetOctokitCache } from "../src/client.ts";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  process.env.COACH_GITHUB_PAT = "test-pat";
  resetOctokitCache();
});

describe("get_repo_commits_yesterday", () => {
  it("repos별 commit 카운트 누적", async () => {
    server.use(
      http.get("https://api.github.com/repos/me/cadence/commits", () =>
        HttpResponse.json(
          [
            { sha: "abc1", commit: { author: { date: "2026-04-30T01:00:00Z" } } }, // KST 10:00 ✅
            { sha: "abc2", commit: { author: { date: "2026-04-30T05:00:00Z" } } }, // ✅
          ],
          { headers: { "x-ratelimit-remaining": "4400" } }
        )
      ),
      http.get("https://api.github.com/repos/me/other/commits", () =>
        HttpResponse.json([{ sha: "x", commit: { author: { date: "2026-04-30T10:00:00Z" } } }], {
          headers: { "x-ratelimit-remaining": "4399" },
        })
      )
    );

    const result = await getRepoCommitsYesterdayTool.handler({
      github_username: "me",
      monitored_repos: ["me/cadence", "me/other"],
      date_kst: "2026-04-30",
    });
    expect(result.commits).toEqual({ "me/cadence": 2, "me/other": 1 });
    expect(result.fetch_status).toBe("ok");
  });

  it("repo 1개 fetch 실패해도 나머지 진행 + fetch_status=partial", async () => {
    server.use(
      http.get("https://api.github.com/repos/me/cadence/commits", () =>
        HttpResponse.json(
          [{ sha: "abc1", commit: { author: { date: "2026-04-30T01:00:00Z" } } }],
          { headers: { "x-ratelimit-remaining": "4400" } }
        )
      ),
      http.get("https://api.github.com/repos/me/other/commits", () =>
        HttpResponse.json({ message: "server error" }, { status: 500 })
      )
    );

    const result = await getRepoCommitsYesterdayTool.handler({
      github_username: "me",
      monitored_repos: ["me/cadence", "me/other"],
      date_kst: "2026-04-30",
    });
    expect(result.commits["me/cadence"]).toBe(1);
    expect(result.fetch_status).toBe("partial");
  });
});
