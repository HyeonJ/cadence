import { describe, it, expect } from "vitest";
import { SLOT_KEYS, SLOT_DEFS, ITEM_STATUSES } from "../src/enums.ts";

describe("enums", () => {
  it("SLOT_KEYS는 4개 슬롯 모두 포함", () => {
    expect(SLOT_KEYS).toEqual([
      "weekday_morning_input",
      "weekday_evening_build",
      "weekend_deep",
      "weekend_share",
    ]);
  });

  it("SLOT_DEFS는 각 SLOT_KEY에 대응", () => {
    SLOT_KEYS.forEach((key) => {
      expect(SLOT_DEFS[key].key).toBe(key);
      expect(SLOT_DEFS[key].defaultMinutes).toBeGreaterThan(0);
    });
  });

  it("ITEM_STATUSES는 4개 상태", () => {
    expect(ITEM_STATUSES.length).toBe(4);
    expect(ITEM_STATUSES).toContain("auto_done");
  });
});
