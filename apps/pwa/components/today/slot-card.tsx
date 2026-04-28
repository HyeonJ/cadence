import * as React from "react";
import { Pill } from "@/components/pill";
import { ProgressBar } from "@/components/progress-bar";
import type { TodayDataItem } from "@/lib/queries/today";
import { TaskRowToggle } from "./task-row-toggle";

const SLOT_LABEL: Record<string, { label: string; ringColor: string; ringVar: string }> = {
  weekday_morning_input: {
    label: "Slot 1 · 평일 아침 30분 · 정독",
    ringColor: "var(--ring-input)",
    ringVar: "input",
  },
  weekday_evening_build: {
    label: "Slot 2 · 평일 저녁 1h · 빌드",
    ringColor: "var(--ring-build)",
    ringVar: "build",
  },
  weekend_deep: {
    label: "Slot 3 · 주말 4h · 깊이",
    ringColor: "var(--ring-build)",
    ringVar: "build",
  },
  weekend_share: {
    label: "Slot 4 · 일요일 1.5h · 공유",
    ringColor: "var(--ring-share)",
    ringVar: "share",
  },
};

type ItemStatus = "pending" | "done" | "skipped" | "auto_done";
type ItemKind = "manual_check" | "auto_signal";

export function SlotCard({
  slotKey,
  items,
}: {
  slotKey: string;
  items: TodayDataItem[];
}): React.JSX.Element {
  const meta = SLOT_LABEL[slotKey] ?? {
    label: slotKey,
    ringColor: "var(--ring-input)",
    ringVar: "input",
  };
  const done = items.filter(
    (i) => i.status === "done" || i.status === "auto_done"
  ).length;
  const total = items.length;
  const ratio = total === 0 ? 0 : done / total;
  const hasAuto = items.some((i) => i.kind === "auto_signal");

  return (
    <div className="bg-surface border border-card-line rounded-md">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hairline">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: meta.ringColor }}
        />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          {meta.label}
        </span>
        {hasAuto && <Pill variant="blue">AUTO · commit ≥ 1 추적</Pill>}
        <div className="flex-1" />
        <span className="font-display text-[12px] font-semibold text-ink tab">
          {done} / {total}
        </span>
        <ProgressBar value={ratio} color={meta.ringColor} width={64} />
      </div>
      {items.map((it, idx) => (
        <TaskRowToggle
          key={it.id}
          itemId={it.id}
          initialStatus={it.status as ItemStatus}
          title={it.title}
          url={it.url}
          durationLabel={it.estimated_minutes ? `${it.estimated_minutes}분` : "—"}
          kind={it.kind as ItemKind}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}
