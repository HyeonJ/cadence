import { describe, it, expect, beforeEach } from "vitest";
import { getYesterdaySignalsTool } from "../src/tools/get-yesterday-signals.ts";
import { getServiceClient } from "../src/client.ts";

describe("get_yesterday_signals", () => {
  let userId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `gys-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
  });

  it("기존 signal 없으면 null 반환", async () => {
    const result = await getYesterdaySignalsTool.handler({
      user_id: userId,
      date_kst: "2026-04-30",
    });
    expect(result.signals).toBeNull();
  });

  it("기존 signal 있으면 그대로 반환", async () => {
    const client = getServiceClient();
    await client.from("yesterday_signals").insert({
      user_id: userId,
      date_kst: "2026-04-30",
      github_events_count: 3,
      repo_commits: { "me/cadence": 2 },
      fetch_status: "ok",
    });
    const result = await getYesterdaySignalsTool.handler({
      user_id: userId,
      date_kst: "2026-04-30",
    });
    expect(result.signals?.github_events_count).toBe(3);
    expect(result.signals?.fetch_status).toBe("ok");
  });
});
