import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SlotCard } from "@/components/today/slot-card";

vi.mock("@/app/(app)/today/today-card-actions", () => ({
  toggleItemStatus: vi.fn(),
}));

describe("SlotCard", () => {
  it("done count = 1 / total = 2 표시", () => {
    const { getByText } = render(
      <SlotCard
        slotKey="weekday_morning_input"
        items={[
          { id: "a", slot_key: "weekday_morning_input", title: "X", url: null, kind: "manual_check", status: "done", estimated_minutes: 30, auto_target: null, note: null, status_changed_at: null, source_backbone_id: null, backbone: null },
          { id: "b", slot_key: "weekday_morning_input", title: "Y", url: null, kind: "manual_check", status: "pending", estimated_minutes: 30, auto_target: null, note: null, status_changed_at: null, source_backbone_id: null, backbone: null },
        ]}
      />
    );
    expect(getByText("1 / 2")).toBeInTheDocument();
  });

  it("auto_signal item이 있으면 AUTO Pill 표시", () => {
    const { getByText } = render(
      <SlotCard
        slotKey="weekday_evening_build"
        items={[
          { id: "a", slot_key: "weekday_evening_build", title: "build", url: null, kind: "auto_signal", status: "pending", estimated_minutes: 60, auto_target: null, note: null, status_changed_at: null, source_backbone_id: null, backbone: null },
        ]}
      />
    );
    expect(getByText(/AUTO/)).toBeInTheDocument();
  });
});
