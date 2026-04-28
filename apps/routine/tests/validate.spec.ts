import { describe, it, expect } from "vitest";
import { validateAgainstBackbone } from "../src/schema/validate.ts";
import type { DailyCardResponse } from "../src/schema/daily-card.ts";

describe("validateAgainstBackbone", () => {
  const backboneIds = new Set(["aaa", "bbb", "ccc"]);

  it("모든 source_backbone_id가 backboneIds 안 → ok", () => {
    const card: DailyCardResponse = {
      coach_comment: "ok",
      items: [
        { source_backbone_id: "aaa", slot_key: "weekday_morning_input", title: "x", kind: "manual_check", estimated_minutes: 30 },
      ],
    };
    expect(() => validateAgainstBackbone(card, backboneIds)).not.toThrow();
  });

  it("source_backbone_id가 backbone에 없으면 throw", () => {
    const card: DailyCardResponse = {
      coach_comment: "ok",
      items: [
        { source_backbone_id: "zzz", slot_key: "weekday_morning_input", title: "x", kind: "manual_check", estimated_minutes: 30 },
      ],
    };
    expect(() => validateAgainstBackbone(card, backboneIds)).toThrow(/zzz.*not in backbone/);
  });
});
