import { describe, it, expect, vi } from "vitest";
import { todayKst, yesterdayKst, weekIndexFor, dayOfWeekFor } from "../src/utils/tz.ts";

describe("tz helpers", () => {
  it("todayKst — 2026-04-30 23:00 UTC → 2026-05-01 (KST 08:00)", () => {
    vi.setSystemTime(new Date("2026-04-30T23:00:00Z"));
    expect(todayKst()).toBe("2026-05-01");
    vi.useRealTimers();
  });

  it("yesterdayKst — 2026-05-01 03:00 UTC → KST 12:00 → yesterday=2026-04-30", () => {
    vi.setSystemTime(new Date("2026-05-01T03:00:00Z"));
    expect(yesterdayKst()).toBe("2026-04-30");
    vi.useRealTimers();
  });

  it("weekIndexFor — Sprint start 2026-04-29, today 2026-05-01 → Week 1", () => {
    expect(weekIndexFor("2026-04-29", "2026-05-01")).toBe(1);
    expect(weekIndexFor("2026-04-29", "2026-05-08")).toBe(2);
    expect(weekIndexFor("2026-04-29", "2026-05-15")).toBe(3);
    expect(weekIndexFor("2026-04-29", "2026-05-22")).toBe(4);
  });

  it("dayOfWeekFor — 2026-05-01 (금) → 4 (Mon=0)", () => {
    expect(dayOfWeekFor("2026-05-01")).toBe(4);
    expect(dayOfWeekFor("2026-05-02")).toBe(5); // 토
    expect(dayOfWeekFor("2026-05-03")).toBe(6); // 일
    expect(dayOfWeekFor("2026-05-04")).toBe(0); // 월
  });
});
