import { describe, it, expect } from "vitest";
import { DEFAULT_NOTIFY_SCHEDULE } from "@/lib/queries/user-settings";

describe("user-settings module", () => {
  it("DEFAULT_NOTIFY_SCHEDULE — 07:00/today_push + 22:00/tomorrow_preview", () => {
    expect(DEFAULT_NOTIFY_SCHEDULE).toHaveLength(2);
    expect(DEFAULT_NOTIFY_SCHEDULE[0]).toEqual({
      time: "07:00",
      kind: "today_push",
    });
    expect(DEFAULT_NOTIFY_SCHEDULE[1]).toEqual({
      time: "22:00",
      kind: "tomorrow_preview",
    });
  });

  it("notify slot 시간 형식은 HH:MM (24h)", () => {
    DEFAULT_NOTIFY_SCHEDULE.forEach((slot) => {
      expect(slot.time).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    });
  });
});
