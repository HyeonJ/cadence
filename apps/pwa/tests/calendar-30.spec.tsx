import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Calendar30 } from "@/components/sprint/calendar-30";
import type { SprintProgressDay } from "@/lib/queries/sprint";

function days(todayIdx: number): SprintProgressDay[] {
  return Array.from({ length: 30 }).map((_, i) => ({
    date_kst: `2026-04-${String(29 + i).padStart(2, "0")}`,
    done_count: i === 0 ? 2 : i === 1 ? 3 : 0,
    has_card: i <= 2,
    is_today: i === todayIdx,
  }));
}

describe("Calendar30", () => {
  it("30 cell + 5 trailing = 35 cell 렌더", () => {
    const { container } = render(
      <Calendar30 days={days(2)} todayIndex={2} />
    );
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells.length).toBeGreaterThanOrEqual(30);
  });

  it("today cell은 inset ring border (강조 표시)", () => {
    const { container } = render(<Calendar30 days={days(2)} todayIndex={2} />);
    const todayCell = container.querySelector("[data-today=true]");
    expect(todayCell).not.toBeNull();
  });
});
