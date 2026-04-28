import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ActivityRing } from "@/components/activity-ring";

describe("ActivityRing", () => {
  it("3 rings (bg + fg) 렌더링 — 6 circle", () => {
    const { container } = render(<ActivityRing size={100} stroke={10} gap={4} values={[0.5, 0.0, 0.0]} />);
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });

  it("centerLabel 텍스트 + centerSub 표시", () => {
    const { getByText } = render(
      <ActivityRing values={[0.16, 0, 0]} centerLabel="16%" centerSub="OVERALL" />
    );
    expect(getByText("16%")).toBeInTheDocument();
    expect(getByText("OVERALL")).toBeInTheDocument();
  });

  it("values=0이면 dash=0 (stroke 미가시)", () => {
    const { container } = render(<ActivityRing size={100} values={[0, 0, 0]} />);
    const fgCircles = container.querySelectorAll("circle:nth-child(n+4)");
    fgCircles.forEach((c) => {
      expect(c.getAttribute("stroke-dasharray")).toMatch(/^0 /);
    });
  });
});
