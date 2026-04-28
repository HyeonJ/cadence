import { describe, it, expect, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { seedSprint1FromMarkdown } from "../src/seed/seed-sprint1.ts";
import type { Database } from "../src/types.ts";

const URL = process.env.SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures/report-sprint1.md");

describe("seed-sprint1 (integration)", () => {
  let userId: string;
  const service = createClient<Database>(URL, SERVICE);

  beforeEach(async () => {
    const { data, error } = await service.auth.admin.createUser({
      email: `seed-${Date.now()}@test.local`,
      password: "test-12345",
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  });

  it("Sprint 1을 DB에 삽입하면 sprints 1 row + backbone_items 다수가 생성됨", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    const sprintId = await seedSprint1FromMarkdown(service, userId, md);

    const { data: sprint } = await service
      .from("sprints")
      .select("*")
      .eq("id", sprintId)
      .single();
    expect(sprint?.name).toBe("Sprint 1: Agent SDK + MCP");
    expect(sprint?.status).toBe("active");

    const { data: items } = await service
      .from("sprint_backbone_items")
      .select("*")
      .eq("sprint_id", sprintId);
    expect(items?.length).toBeGreaterThanOrEqual(8); // W1 5 + W2 2 + W3 2 + W4 1 = 10
  });

  it("같은 user에 두 번 시드 시도 시 active sprint UNIQUE 제약 충돌", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    await seedSprint1FromMarkdown(service, userId, md);
    await expect(seedSprint1FromMarkdown(service, userId, md)).rejects.toThrow(
      /sprints_user_active_unique|duplicate key/i
    );
  });
});
