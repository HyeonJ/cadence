import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
const mockSelect = vi.fn();
const mockFrom = vi.fn((_table: string) => ({
  select: mockSelect,
  update: mockUpdate,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}));

const validGuideJson =
  '```json\n' +
  JSON.stringify({
    objective: "이 자료를 끝내면 X를 할 수 있어야 함.",
    key_points: ["A", "B", "C"],
    steps: [{ minutes: 30, action: "Y 진행" }],
  }) +
  '\n```';

vi.mock("@cadence/routine", () => ({
  callClaude: vi.fn().mockResolvedValue(validGuideJson),
  extractJson: (raw: string) => {
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(m ? m[1] : raw);
  },
  StudyGuideSchema: {
    parse: (v: unknown) => v,
  },
}));

const { runBackboneGenerateGuides } = await import("../../src/commands/backbone-generate-guides.ts");

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
});

describe("runBackboneGenerateGuides", () => {
  it("3개 backbone item에 가이드 채움 (force=false, 기존 가이드 없음)", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: "i1", content: { title: "A", estimated_minutes: 30 } },
          { id: "i2", content: { title: "B", estimated_minutes: 60 } },
          { id: "i3", content: { title: "C", estimated_minutes: 90 } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1" });
    expect(stats.total).toBe(3);
    expect(stats.succeeded).toBe(3);
    expect(stats.failed).toBe(0);
    expect(stats.skipped).toBe(0);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it("기존 study_guide 있고 force=false면 skip", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "i1",
            content: {
              title: "A",
              study_guide: { objective: "x", key_points: ["a", "b"], steps: [{ minutes: 30, action: "y" }] },
            },
          },
          { id: "i2", content: { title: "B" } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1", force: false });
    expect(stats.skipped).toBe(1);
    expect(stats.succeeded).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("limit=1이면 첫 1개만 처리", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          { id: "i1", content: { title: "A" } },
          { id: "i2", content: { title: "B" } },
        ],
        error: null,
      }),
    });
    const stats = await runBackboneGenerateGuides({ sprintId: "s1", limit: 1 });
    expect(stats.total).toBe(1);
    expect(stats.succeeded).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});
