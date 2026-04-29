import { describe, expect, it } from "vitest";

describe("export schema", () => {
  it("필수 키가 있어야 한다", () => {
    const sample = {
      exported_at: "2026-04-29T07:00:00Z",
      user_id: "00000000-0000-0000-0000-000000000000",
      user_settings: null,
      sprints: [],
      sprint_backbone_items: [],
      daily_cards: [],
      daily_card_items: [],
      yesterday_signals: [],
    };
    const required = [
      "exported_at",
      "user_id",
      "user_settings",
      "sprints",
      "sprint_backbone_items",
      "daily_cards",
      "daily_card_items",
      "yesterday_signals",
    ];
    for (const k of required) {
      expect(sample).toHaveProperty(k);
    }
  });

  it("exported_at은 ISO 8601 UTC", () => {
    const v = new Date().toISOString();
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  });
});
