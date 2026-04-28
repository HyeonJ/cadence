import { describe, it, expect, beforeEach } from "vitest";
import { upsertDailyCardTool } from "../src/tools/upsert-daily-card.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("upsert_daily_card", () => {
  let userId: string;
  let sprintId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `udc-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
  });

  it("새 카드 + 정규화 items 삽입", async () => {
    const result = await upsertDailyCardTool.handler({
      user_id: userId,
      date_kst: "2026-05-01",
      sprint_id: sprintId,
      coach_comment: "어제 commit 0건. 오늘은 빌드 1h 우선.",
      fallback_used: false,
      generation_meta: { llm_model: "claude-opus-4-7", input_tokens: 4500, output_tokens: 800 },
      card_raw: { items: [{ key: "morn1", title: "Agent SDK Quickstart" }] },
      items: [
        {
          slot_key: "weekday_morning_input",
          title: "Agent SDK Quickstart",
          url: "https://anthropic.com/agent-sdk",
          kind: "manual_check",
          status: "pending",
        },
      ],
    });
    expect(result.daily_card_id).toBeTruthy();
    const client = getServiceClient();
    const { data: items } = await client
      .from("daily_card_items")
      .select("*")
      .eq("daily_card_id", result.daily_card_id);
    expect(items?.length).toBe(1);
  });

  it("같은 (user, date_kst) 재호출 시 기존 row delete + 신규 insert (멱등)", async () => {
    await upsertDailyCardTool.handler({
      user_id: userId,
      date_kst: "2026-05-01",
      sprint_id: sprintId,
      coach_comment: "first",
      fallback_used: false,
      generation_meta: {},
      card_raw: {},
      items: [],
    });
    const second = await upsertDailyCardTool.handler({
      user_id: userId,
      date_kst: "2026-05-01",
      sprint_id: sprintId,
      coach_comment: "second",
      fallback_used: false,
      generation_meta: {},
      card_raw: {},
      items: [],
    });
    const client = getServiceClient();
    const { data } = await client
      .from("daily_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("date_kst", "2026-05-01");
    expect(data?.length).toBe(1);
    expect(data![0].coach_comment).toBe("second");
  });
});
