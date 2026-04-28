import { describe, it, expect } from "vitest";
import { buildSprintContext, buildTodayBlock, buildSignalsBlock, buildUserDataBlock } from "../src/prompts/build-context.ts";

describe("build-context", () => {
  it("buildSprintContext — name + targets 표시", () => {
    const block = buildSprintContext({
      name: "Sprint 1: Agent SDK + MCP",
      start_date_kst: "2026-04-29",
      end_date_kst: "2026-05-28",
      evergreen_targets: ["core_2", "core_6"],
      frontier_targets: ["frontier_1"],
      backbone_summary: "- W1 정독 5건 ...",
    });
    expect(block).toContain("Sprint 1: Agent SDK + MCP");
    expect(block).toContain("core_2");
    expect(block).toContain("backbone_summary");
  });

  it("buildUserDataBlock — note는 user_data 태그 안", () => {
    const block = buildUserDataBlock("note_yesterday", "내일은 빌드만 집중하고 싶음");
    expect(block).toMatch(/<user_data type="note_yesterday">[\s\S]+<\/user_data>/);
    expect(block).toContain("내일은 빌드만 집중");
  });

  it("buildSignalsBlock — fetch_status 명시", () => {
    const block = buildSignalsBlock({
      github_events_count: 0,
      repo_commits: {},
      fetch_status: "rate_limited",
      manual_checks: { morn1: "done" },
    });
    expect(block).toContain('fetch_status="rate_limited"');
    expect(block).toContain("manual_checks");
  });
});
