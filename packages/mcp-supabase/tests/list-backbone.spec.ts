import { describe, it, expect, beforeEach } from "vitest";
import { listBackboneTool } from "../src/tools/list-backbone.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("list_backbone", () => {
  let userId: string;
  let sprintId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `lb-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
  });

  it("week_index 미지정 시 전체 backbone 반환 + active만", async () => {
    const result = await listBackboneTool.handler({ sprint_id: sprintId });
    expect(result.items.length).toBeGreaterThanOrEqual(8);
    expect(result.items.every((i) => i.effective_until === null)).toBe(true);
  });

  it("week_index 지정 시 그 주 items만", async () => {
    const result = await listBackboneTool.handler({ sprint_id: sprintId, week_index: 1 });
    expect(result.items.every((i) => i.week_index === 1)).toBe(true);
  });
});
