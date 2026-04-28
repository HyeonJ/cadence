import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseSprint1 } from "../src/seed/parse-report.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures/report-sprint1.md");

describe("parse-report.ts :: parseSprint1", () => {
  it("Sprint 1의 evergreen + frontier targets를 추출", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    const result = parseSprint1(md);
    expect(result.name).toBe("Sprint 1: Agent SDK + MCP");
    expect(result.evergreen_targets).toEqual(["core_2", "core_6"]);
    expect(result.frontier_targets).toEqual(["frontier_1"]);
    expect(result.start_date_kst).toBe("2026-04-29");
    expect(result.end_date_kst).toBe("2026-05-28");
  });

  it("W1 자료 5개를 backbone items로 변환", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    const result = parseSprint1(md);
    const w1Input = result.backbone_items.filter(
      (i) => i.week_index === 1 && i.slot_key === "weekday_morning_input"
    );
    expect(w1Input.length).toBe(5);
    expect(w1Input[0].content.title).toContain("Claude Agent SDK Overview");
    expect(w1Input[0].content.materials[0].url).toContain("anthropic");
  });

  it("W2~W3 토이 빌드를 weekday_evening_build로 매핑", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    const result = parseSprint1(md);
    const builds = result.backbone_items.filter(
      (i) => i.slot_key === "weekday_evening_build" && (i.week_index === 2 || i.week_index === 3)
    );
    expect(builds.length).toBeGreaterThanOrEqual(2);
    expect(builds[0].content.title).toMatch(/MCP.*wrapping|wrapping.*MCP/i);
  });

  it("W4 산출물을 weekend_share로 매핑", async () => {
    const md = await readFile(FIXTURE, "utf-8");
    const result = parseSprint1(md);
    const shares = result.backbone_items.filter(
      (i) => i.slot_key === "weekend_share" && i.week_index === 4
    );
    expect(shares.length).toBeGreaterThanOrEqual(1);
  });
});
