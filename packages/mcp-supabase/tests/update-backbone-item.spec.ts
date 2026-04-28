import { describe, it, expect, beforeEach } from "vitest";
import { updateBackboneItemTool } from "../src/tools/update-backbone-item.ts";
import { listBackboneTool } from "../src/tools/list-backbone.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("update_backbone_item", () => {
  let userId: string;
  let sprintId: string;
  let firstItemId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `ubi-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    sprintId = await seedSprint1FromMarkdown(client, userId, md);
    const list = await listBackboneTool.handler({ sprint_id: sprintId });
    firstItemId = list.items[0].id;
  });

  it("content.title 수정", async () => {
    await updateBackboneItemTool.handler({
      item_id: firstItemId,
      patch: { content: { title: "변경된 제목" } },
    });
    const list = await listBackboneTool.handler({ sprint_id: sprintId });
    const updated = list.items.find((i) => i.id === firstItemId);
    expect((updated!.content as { title: string }).title).toBe("변경된 제목");
  });

  it("order_in_week 수정", async () => {
    await updateBackboneItemTool.handler({
      item_id: firstItemId,
      patch: { order_in_week: 99 },
    });
    const list = await listBackboneTool.handler({ sprint_id: sprintId, include_inactive: true });
    const updated = list.items.find((i) => i.id === firstItemId);
    expect(updated?.order_in_week).toBe(99);
  });
});
