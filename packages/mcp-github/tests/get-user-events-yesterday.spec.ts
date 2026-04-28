import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { getUserEventsYesterdayTool } from "../src/tools/get-user-events-yesterday.ts";
import { resetOctokitCache } from "../src/client.ts";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  process.env.COACH_GITHUB_PAT = "test-pat";
  resetOctokitCache();
});

describe("get_user_events_yesterday", () => {
  it("KST 윈도우 안 PushEvent만 카운트", async () => {
    server.use(
      http.get("https://api.github.com/users/HyeonJ/events/public", () =>
        HttpResponse.json(
          [
            { type: "PushEvent", created_at: "2026-04-30T05:00:00Z" }, // KST 14:00 ✅
            { type: "PullRequestEvent", created_at: "2026-04-30T06:00:00Z" }, // ✅
            { type: "WatchEvent", created_at: "2026-04-30T07:00:00Z" }, // 무시
            { type: "PushEvent", created_at: "2026-04-29T10:00:00Z" }, // KST 19:00 4/29 → 4/30 윈도우 X
          ],
          { headers: { "x-ratelimit-remaining": "4500" } }
        )
      )
    );

    const result = await getUserEventsYesterdayTool.handler({
      github_username: "HyeonJ",
      date_kst: "2026-04-30",
    });
    expect(result.events_count).toBe(2);
    expect(result.fetch_status).toBe("ok");
    expect(result.rate_limit_remaining).toBe(4500);
  });

  it("rate limit 도달 시 fetch_status=rate_limited", async () => {
    server.use(
      http.get("https://api.github.com/users/HyeonJ/events/public", () =>
        HttpResponse.json(
          { message: "rate limit exceeded" },
          { status: 429, headers: { "x-ratelimit-remaining": "0" } }
        )
      )
    );

    const result = await getUserEventsYesterdayTool.handler({
      github_username: "HyeonJ",
      date_kst: "2026-04-30",
    });
    expect(result.fetch_status).toBe("rate_limited");
    expect(result.events_count).toBe(0);
  });
});
