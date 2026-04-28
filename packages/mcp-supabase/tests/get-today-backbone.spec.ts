import { describe, it, expect, beforeEach } from "vitest";
import { getTodayBackboneTool } from "../src/tools/get-today-backbone.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("get_today_backbone", () => {
  let userId: string;
  let sprintId: string;

  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `gtb-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
  });

  it("Day 3 (2026-05-01 금요일, W1)의 backbone items 반환", async () => {
    const result = await getTodayBackboneTool.handler({
      sprint_id: sprintId,
      date_kst: "2026-05-01",
      week_index: 1,
      day_of_week: 4, // 금요일 = 4 (Mon=0)
    });
    // W1 weekday_morning_input items 5개 (모두 평일이라 금요일에도 활성)
    const inputs = result.items.filter((i) => i.slot_key === "weekday_morning_input");
    expect(inputs.length).toBe(5);
    // 금요일은 weekday_evening_build slot 없음 (화·목·일만)
    const builds = result.items.filter((i) => i.slot_key === "weekday_evening_build");
    expect(builds.length).toBe(0);
  });

  it("effective_until가 today 이전이면 제외", async () => {
    const client = getServiceClient();
    // 첫 item을 effective_until 어제로
    const { data: items } = await client
      .from("sprint_backbone_items")
      .select("id")
      .eq("sprint_id", sprintId)
      .limit(1);
    await client
      .from("sprint_backbone_items")
      .update({ effective_until: "2026-04-30" })
      .eq("id", items![0].id);

    const result = await getTodayBackboneTool.handler({
      sprint_id: sprintId,
      date_kst: "2026-05-01",
      week_index: 1,
      day_of_week: 4,
    });
    expect(result.items.find((i) => i.id === items![0].id)).toBeUndefined();
  });
});
