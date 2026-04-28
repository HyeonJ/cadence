import { describe, it, expect, vi } from "vitest";
import { todayKst, formatKstHeader, formatKstShort, weekIndexFor, dayOfWeekFor } from "@/lib/date";

describe("date helpers", () => {
  it("todayKst — 2026-04-30 23:00 UTC → 2026-05-01", () => {
    vi.setSystemTime(new Date("2026-04-30T23:00:00Z"));
    expect(todayKst()).toBe("2026-05-01");
    vi.useRealTimers();
  });

  it("formatKstHeader — 2026-05-01 → 'FRI · MAY 1, 2026'", () => {
    expect(formatKstHeader("2026-05-01")).toBe("FRI · MAY 1, 2026");
  });

  it("formatKstShort — 2026-05-01 → { headline: '2026년 5월 1일 금요일', shortDow: 'FRI · MAY 1' }", () => {
    const r = formatKstShort("2026-05-01");
    expect(r.headline).toBe("2026년 5월 1일 금요일");
    expect(r.shortDow).toBe("FRI · MAY 1");
  });

  it("weekIndexFor + dayOfWeekFor — Plan 03와 동일", () => {
    expect(weekIndexFor("2026-04-29", "2026-05-01")).toBe(1);
    expect(dayOfWeekFor("2026-05-01")).toBe(4);
  });
});
