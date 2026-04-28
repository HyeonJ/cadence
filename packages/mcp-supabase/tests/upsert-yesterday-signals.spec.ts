import { describe, it, expect, beforeEach } from "vitest";
import { upsertYesterdaySignalsTool } from "../src/tools/upsert-yesterday-signals.ts";
import { getServiceClient } from "../src/client.ts";

describe("upsert_yesterday_signals", () => {
  let userId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `uys-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
  });

  it("처음 호출 시 신규 row insert", async () => {
    const result = await upsertYesterdaySignalsTool.handler({
      user_id: userId,
      date_kst: "2026-04-30",
      github_events_count: 3,
      repo_commits: { "me/cadence": 2 },
      blog_new_posts: 0,
      fetch_status: "ok",
    });
    expect(result.id).toBeTruthy();
  });

  it("재호출 시 기존 row update (UNIQUE 사용)", async () => {
    await upsertYesterdaySignalsTool.handler({
      user_id: userId,
      date_kst: "2026-04-30",
      github_events_count: 1,
      repo_commits: {},
      blog_new_posts: 0,
      fetch_status: "ok",
    });
    await upsertYesterdaySignalsTool.handler({
      user_id: userId,
      date_kst: "2026-04-30",
      github_events_count: 5,
      repo_commits: { "me/cadence": 3 },
      blog_new_posts: 1,
      fetch_status: "rate_limited",
      fetch_error: "X-RateLimit-Remaining: 0",
    });
    const client = getServiceClient();
    const { data } = await client
      .from("yesterday_signals")
      .select("*")
      .eq("user_id", userId)
      .eq("date_kst", "2026-04-30");
    expect(data?.length).toBe(1);
    expect(data![0].github_events_count).toBe(5);
    expect(data![0].fetch_status).toBe("rate_limited");
  });
});
