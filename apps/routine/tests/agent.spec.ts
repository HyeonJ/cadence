import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock claude-cli BEFORE importing agent.ts
vi.mock("../src/utils/claude-cli.ts", async () => {
  const actual = await vi.importActual<typeof import("../src/utils/claude-cli.ts")>(
    "../src/utils/claude-cli.ts"
  );
  return {
    ...actual,
    callClaude: vi.fn().mockResolvedValue(
      "```json\n" +
        JSON.stringify({
          coach_comment: "어제 commit 0건. 빌드 1h 우선.",
          items: [
            {
              source_backbone_id: "11111111-1111-1111-1111-111111111111",
              slot_key: "weekday_morning_input",
              title: "Agent SDK Quickstart",
              kind: "manual_check",
              estimated_minutes: 30,
            },
          ],
        }) +
        "\n```"
    ),
  };
});

vi.mock("@cadence/mcp-supabase", () => ({
  getActiveSprintTool: {
    handler: vi.fn().mockResolvedValue({
      sprint: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Sprint 1",
        start_date_kst: "2026-04-29",
        end_date_kst: "2026-05-28",
        evergreen_targets: ["core_2"],
        frontier_targets: ["frontier_1"],
      },
    }),
  },
  getTodayBackboneTool: {
    handler: vi.fn().mockResolvedValue({
      items: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          slot_key: "weekday_morning_input",
          content: { title: "Agent SDK Quickstart", estimated_minutes: 30 },
          week_index: 1,
        },
      ],
    }),
  },
  getYesterdaySignalsTool: { handler: vi.fn().mockResolvedValue({ signals: null }) },
  upsertDailyCardTool: { handler: vi.fn().mockResolvedValue({ daily_card_id: "card-1" }) },
  upsertYesterdaySignalsTool: { handler: vi.fn().mockResolvedValue({ id: "s-1" }) },
}));

vi.mock("@cadence/mcp-github", () => ({
  getUserEventsYesterdayTool: {
    handler: vi
      .fn()
      .mockResolvedValue({ events_count: 0, fetch_status: "ok", rate_limit_remaining: 4500 }),
  },
  getRepoCommitsYesterdayTool: {
    handler: vi.fn().mockResolvedValue({ commits: {}, fetch_status: "ok" }),
  },
}));

vi.mock("@cadence/mcp-discord", () => ({
  sendDmTool: { handler: vi.fn().mockResolvedValue({ ok: true, status: 204 }) },
}));

const { runDailyCardGeneration } = await import("../src/agent.ts");

describe("runDailyCardGeneration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T00:00:00+09:00"));
  });

  it("4 stage 통과 + daily_card_id 반환", async () => {
    const result = await runDailyCardGeneration({ userId: "u1" });
    expect(result.daily_card_id).toBe("card-1");
    expect(result.fallback_used).toBe(false);
  });

  it("active sprint 없으면 SKIP (no-op)", async () => {
    const { getActiveSprintTool } = await import("@cadence/mcp-supabase");
    vi.mocked(getActiveSprintTool.handler).mockResolvedValueOnce({ sprint: null });
    const result = await runDailyCardGeneration({ userId: "u2" });
    expect(result.skipped).toBe(true);
  });
});
