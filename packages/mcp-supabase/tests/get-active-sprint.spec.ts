import { describe, it, expect, beforeEach } from "vitest";
import { getActiveSprintTool } from "../src/tools/get-active-sprint.ts";
import { getServiceClient } from "../src/client.ts";
import { seedSprint1FromMarkdown } from "@cadence/db";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const fixtureMd = join(__dirname, "../../db/tests/fixtures/report-sprint1.md");

describe("get_active_sprint", () => {
  let userId: string;
  beforeEach(async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `gas-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    userId = data.user!.id;
    const md = await readFile(fixtureMd, "utf-8");
    await seedSprint1FromMarkdown(client, userId, md);
  });

  it("active sprint 1개를 반환", async () => {
    const result = await getActiveSprintTool.handler({ user_id: userId });
    expect(result.sprint).not.toBeNull();
    expect(result.sprint?.status).toBe("active");
    expect(result.sprint?.name).toBe("Sprint 1: Agent SDK + MCP");
  });

  it("active sprint 없으면 null 반환", async () => {
    const client = getServiceClient();
    const { data } = await client.auth.admin.createUser({
      email: `gas2-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    const result = await getActiveSprintTool.handler({ user_id: data.user!.id });
    expect(result.sprint).toBeNull();
  });
});
