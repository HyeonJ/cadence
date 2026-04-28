import { describe, it, expect, beforeEach } from "vitest";
import { addBackboneItemTool } from "../src/tools/add-backbone-item.ts";
import { listBackboneTool } from "../src/tools/list-backbone.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("add_backbone_item", () => {
  let userId: string;
  let sprintId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `abi-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
  });

  it("새 item 추가하면 list_backbone 결과에 보임", async () => {
    const before = await listBackboneTool.handler({ sprint_id: sprintId, week_index: 2 });
    const beforeCount = before.items.length;
    const result = await addBackboneItemTool.handler({
      sprint_id: sprintId,
      week_index: 2,
      slot_key: "weekday_morning_input",
      day_of_week_mask: 0b0011111, // 평일
      content: {
        title: "추가된 정독 자료",
        materials: [{ name: "Vercel AI SDK 6 release notes", url: "https://vercel.com/blog/ai-sdk-6" }],
        targets: ["frontier_3"],
        estimated_minutes: 30,
      },
      effective_from: "2026-05-08",
    });
    expect(result.id).toBeTruthy();
    const after = await listBackboneTool.handler({ sprint_id: sprintId, week_index: 2 });
    expect(after.items.length).toBe(beforeCount + 1);
    const added = after.items.find((i) => i.id === result.id);
    expect(added?.content).toMatchObject({ title: "추가된 정독 자료" });
  });
});
