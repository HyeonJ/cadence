import * as React from "react";
import { ProgressBar } from "@/components/progress-bar";

export function MetricCard({
  color,
  label,
  done,
  total,
}: {
  color: string;
  label: string;
  done: number;
  total: number;
}): React.JSX.Element {
  const ratio = total === 0 ? 0 : done / total;
  return (
    <div className="flex-1 border border-card-line rounded-data px-4 py-4 flex flex-col gap-2.5 bg-surface">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <div className="flex-1" />
        <span className="font-display text-[12px] font-semibold tab" style={{ color }}>
          {Math.round(ratio * 100)}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display tab font-bold text-[32px] text-ink tracking-[-0.025em]">
          {done}
        </span>
        <span className="font-display tab font-semibold text-[16px] text-sub">/ {total}</span>
      </div>
      <ProgressBar value={ratio} color={color} width="100%" height={3} />
    </div>
  );
}
