import * as React from "react";
import { ProgressBar } from "@/components/progress-bar";
import type { SprintProgressDay } from "@/lib/queries/sprint";

export function WeekBreakdown({ days }: { days: SprintProgressDay[] }): React.JSX.Element {
  // 4 주 chunks (28일) — 잔여 2일은 W4에 포함
  const weeks = [0, 1, 2, 3].map((w) => {
    const start = w * 7;
    const end = w === 3 ? 30 : start + 7;
    const slice = days.slice(start, end);
    const totalCells = slice.length;
    const doneCells = slice.filter((d) => d.done_count > 0).length;
    return {
      week: w + 1,
      totalCells,
      doneCells,
      ratio: totalCells === 0 ? 0 : doneCells / totalCells,
      activeDays: slice.filter((d) => d.has_card).length,
    };
  });

  return (
    <div className="border border-card-line rounded-md bg-surface mt-6 lg:mt-6">
      <div className="px-4 lg:px-6 py-3 border-b border-hairline">
        <span className="font-display text-[9.5px] lg:text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          주간 진행 · Week breakdown
        </span>
      </div>
      <div className="divide-y divide-hairline">
        {weeks.map((w) => (
          <div key={w.week} className="px-4 lg:px-6 py-3.5 flex items-center gap-4">
            <span className="font-display text-[11px] font-bold tracking-[0.14em] text-sub w-8">
              W{w.week}
            </span>
            <span className="font-display tab text-[13px] font-semibold text-ink w-12">
              {w.doneCells}/{w.totalCells}
            </span>
            <div className="flex-1">
              <ProgressBar value={w.ratio} color="var(--ring-input)" width="100%" height={3} />
            </div>
            <span className="font-display tab text-[11px] text-muted w-16 text-right">
              {Math.round(w.ratio * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
