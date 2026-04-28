import * as React from "react";
import { ActivityRing } from "@/components/activity-ring";

export function MiniActivityRing({
  values,
  inputRatio,
  buildRatio,
  shareRatio,
}: {
  values: [number, number, number];
  inputRatio: { done: number; total: number };
  buildRatio: { done: number; total: number };
  shareRatio: { done: number; total: number };
}): React.JSX.Element {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-3.5 px-4 py-3 border border-card-line rounded-md bg-surface">
        <ActivityRing size={92} stroke={9} gap={3} values={values} />
        <div className="flex flex-col gap-1.5 font-display">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            오늘의 진행
          </div>
          <Legend color="var(--ring-input)" label={`정독 ${inputRatio.done}/${inputRatio.total}`} active={inputRatio.done > 0} />
          <Legend color="var(--ring-build)" label={`빌드 ${buildRatio.done}/${buildRatio.total}`} active={buildRatio.done > 0} />
          <Legend color="var(--ring-share)" label={`공유 ${shareRatio.done}/${shareRatio.total}`} active={shareRatio.done > 0} />
        </div>
      </div>

      {/* Mobile — 84px */}
      <div className="lg:hidden flex flex-col items-center gap-1">
        <ActivityRing size={84} stroke={8} gap={3} values={values} />
        <div className="font-display text-[9.5px] font-semibold uppercase tracking-[0.1em] text-sub">
          오늘
        </div>
      </div>
    </>
  );
}

function Legend({ color, label, active }: { color: string; label: string; active: boolean }): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className={`tab ${active ? "text-ink font-semibold" : "text-muted font-medium"}`}>
        {label}
      </span>
    </div>
  );
}
