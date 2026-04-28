import { describe, it, expect, beforeEach } from "vitest";
import { removeBackboneItemTool } from "../src/tools/remove-backbone-item.ts";
import { listBackboneTool } from "../src/tools/list-backbone.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("remove_backbone_item", () => {
  let userId: string;
  let sprintId: string;
  let firstItemId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `rbi-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
    const list = await listBackboneTool.handler({ sprint_id: sprintId });
    firstItemId = list.items[0].id;
  });

  it("soft delete: effective_until 설정. active list에서 사라짐.", async () => {
    await removeBackboneItemTool.handler({
      item_id: firstItemId,
      effective_until: "2026-05-01",
    });
    const active = await listBackboneTool.handler({ sprint_id: sprintId });
    expect(active.items.find((i) => i.id === firstItemId)).toBeUndefined();
    const all = await listBackboneTool.handler({ sprint_id: sprintId, include_inactive: true });
    const removed = all.items.find((i) => i.id === firstItemId);
    expect(removed?.effective_until).toBe("2026-05-01");
  });
});
