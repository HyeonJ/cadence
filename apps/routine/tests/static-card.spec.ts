import { describe, it, expect } from "vitest";
import { buildStaticFallback } from "../src/fallback/static-card.ts";

describe("buildStaticFallback", () => {
  it("backbone items 그대로 + signal-aware coach_comment", () => {
    const card = buildStaticFallback({
      backbone_items: [
        {
          id: "abc",
          slot_key: "weekday_morning_input",
          content: { title: "Agent SDK 정독", url: "https://x", estimated_minutes: 30 },
        },
      ],
      signals: { github_events_count: 0, repo_commits: {}, fetch_status: "ok" },
    });
    expect(card.items.length).toBe(1);
    expect(card.items[0].source_backbone_id).toBe("abc");
    expect(card.coach_comment).toMatch(/(자동 fallback|어제 commit|쉬어도 OK)/);
  });

  it("fetch_status=rate_limited 시 coach_comment에 명시", () => {
    const card = buildStaticFallback({
      backbone_items: [],
      signals: { github_events_count: 0, repo_commits: {}, fetch_status: "rate_limited" },
    });
    expect(card.coach_comment).toMatch(/fetch.*실패|rate.*limit/i);
  });
});
