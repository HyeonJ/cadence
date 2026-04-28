import * as React from "react";
import { Hairline } from "@/components/hairline";
import type { SprintProgressDay } from "@/lib/queries/sprint";
import { cn } from "@/lib/classnames";

const DAY_HEADERS_DESKTOP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_HEADERS_MOBILE = ["M", "T", "W", "T", "F", "S", "S"];

function cellLevel(done: number): 0 | 1 | 2 | 3 {
  if (done === 0) return 0;
  if (done === 1) return 1;
  if (done === 2) return 2;
  return 3;
}

function cellBg(level: 0 | 1 | 2 | 3): string {
  if (level === 1) return "var(--cell-1)";
  if (level === 2) return "var(--cell-2)";
  if (level === 3) return "var(--cell-3)";
  return "var(--cell-empty)";
}

export function Calendar30({
  days,
  todayIndex,
  daysRemaining,
  paceLabel,
}: {
  days: SprintProgressDay[];
  todayIndex: number;
  daysRemaining?: number;
  paceLabel?: string;
}): React.JSX.Element {
  const today = days[todayIndex];
  return (
    <div className="border border-card-line rounded-md p-4 lg:p-6 bg-surface">
      <div className="flex items-center mb-3 lg:mb-4">
        <span className="font-display text-[9.5px] lg:text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          30일 진행 · Daily activity
        </span>
        <div className="flex-1" />
        <Legend />
      </div>

      {/* Desktop: W1-W5 row labels + 7-col grid */}
      <div className="hidden lg:flex gap-3">
        <div className="flex flex-col gap-2 pt-1.5">
          {["W1", "W2", "W3", "W4", "W5"].map((w) => (
            <div
              key={w}
              className="h-10 flex items-center font-display text-[10.5px] font-bold tracking-[0.14em] text-sub"
            >
              {w}
            </div>
          ))}
        </div>
        <div
          className="flex-1 grid grid-cols-7 gap-2"
          style={{ gridTemplateRows: "auto repeat(5, 40px)" }}
        >
          {DAY_HEADERS_DESKTOP.map((d) => (
            <div
              key={d}
              className="font-display text-[10px] font-semibold tracking-[0.1em] text-sub uppercase text-center pb-0.5"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, idx) => renderCell(idx, days, todayIndex, "desktop"))}
        </div>
      </div>

      {/* Mobile: 단순 7-col grid */}
      <div className="lg:hidden">
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_HEADERS_MOBILE.map((d, i) => (
            <div key={i} className="font-display text-[9px] font-semibold text-sub text-center pb-0.5">
              {d}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, idx) => renderCell(idx, days, todayIndex, "mobile"))}
        </div>
      </div>

      <div
        className="mt-4 pt-3.5 border-t border-hairline flex items-center gap-3.5 font-display text-[12px] text-muted"
      >
        <span>
          <span className="text-primary font-bold tab">{todayIndex + 1}</span>일차 ·{" "}
          <span className="text-ink font-semibold">{today ? today.date_kst.slice(5) : "—"}</span>
        </span>
        {daysRemaining !== undefined && (
          <>
            <Hairline vertical className="h-3" />
            <span className="tab">
              남은 일수 <strong className="text-ink">{daysRemaining}</strong>
            </span>
          </>
        )}
        {paceLabel && (
          <>
            <Hairline vertical className="h-3" />
            <span className="tab">
              현재 페이스 <strong className="text-ink">{paceLabel}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function renderCell(
  idx: number,
  days: SprintProgressDay[],
  todayIndex: number,
  variant: "desktop" | "mobile"
): React.JSX.Element {
  if (idx >= 30) {
    return (
      <div
        key={idx}
        className={cn(
          "rounded-cell opacity-40",
          variant === "mobile" && "aspect-square"
        )}
        style={{ background: "var(--cell-empty)" }}
      />
    );
  }
  const day = days[idx];
  const level = day ? cellLevel(day.done_count) : 0;
  const isToday = idx === todayIndex;
  const isFuture = day && idx > todayIndex && !day.has_card;
  return (
    <div
      key={idx}
      data-cell
      data-today={isToday || undefined}
      className={cn(
        "rounded-cell flex items-center justify-center font-display text-[10px] lg:text-[11px] font-semibold tab",
        variant === "mobile" && "aspect-square"
      )}
      style={{
        background: isToday ? "var(--surface)" : isFuture ? "var(--cell-empty)" : cellBg(level),
        boxShadow: isToday ? "inset 0 0 0 1.5px var(--primary)" : undefined,
        color: isToday
          ? "var(--primary)"
          : level >= 2
            ? "var(--ink)"
            : level === 1
              ? "var(--ink-2)"
              : "var(--sub)",
      }}
    >
      {idx + 1}
    </div>
  );
}

function Legend(): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5 lg:gap-2 font-display text-[11px] text-muted">
      <span className="hidden lg:inline">적음</span>
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-empty)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-1)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-2)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-3)" }} />
      <span className="hidden lg:inline">많음</span>
    </div>
  );
}
