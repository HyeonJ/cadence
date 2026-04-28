import * as React from "react";
import { ActivityRing } from "@/components/activity-ring";
import { MetricCard } from "./metric-card";

export function SprintHero({
  inputDone,
  inputTotal,
  buildDone,
  buildTotal,
  shareDone,
  shareTotal,
}: {
  inputDone: number;
  inputTotal: number;
  buildDone: number;
  buildTotal: number;
  shareDone: number;
  shareTotal: number;
}): React.JSX.Element {
  function ratio(done: number, total: number): number {
    return total === 0 ? 0 : done / total;
  }
  const allTotal = inputTotal + buildTotal + shareTotal;
  const allDone = inputDone + buildDone + shareDone;
  const overall = allTotal === 0 ? 0 : allDone / allTotal;

  return (
    <>
      {/* Desktop hero */}
      <div className="hidden lg:flex gap-8 items-stretch border border-card-line rounded-md p-7 bg-surface mb-6">
        <div className="flex items-center justify-center min-w-[280px]">
          <ActivityRing
            size={280}
            stroke={26}
            gap={6}
            values={[ratio(inputDone, inputTotal), ratio(buildDone, buildTotal), ratio(shareDone, shareTotal)]}
            centerLabel={`${Math.round(overall * 100)}%`}
            centerSub="OVERALL"
          />
        </div>
        <div className="flex-1 flex flex-col gap-3.5 justify-center">
          <MetricCard color="var(--ring-input)" label="인풋 · 정독" done={inputDone} total={inputTotal} />
          <MetricCard color="var(--ring-build)" label="빌드 · commit" done={buildDone} total={buildTotal} />
          <MetricCard color="var(--ring-share)" label="공유 · post" done={shareDone} total={shareTotal} />
        </div>
      </div>

      {/* Mobile hero */}
      <div className="lg:hidden border border-card-line rounded-md bg-surface px-3 pt-4 pb-3 mb-3.5 flex flex-col items-center gap-3">
        <ActivityRing
          size={210}
          stroke={20}
          gap={5}
          values={[ratio(inputDone, inputTotal), ratio(buildDone, buildTotal), ratio(shareDone, shareTotal)]}
          centerLabel={`${Math.round(overall * 100)}%`}
          centerSub="OVERALL"
        />
        <div className="w-full grid grid-cols-3 pt-2.5 border-t border-hairline">
          {[
            { color: "var(--ring-input)", label: "인풋", done: inputDone, total: inputTotal },
            { color: "var(--ring-build)", label: "빌드", done: buildDone, total: buildTotal },
            { color: "var(--ring-share)", label: "공유", done: shareDone, total: shareTotal },
          ].map((m, i) => (
            <div
              key={m.label}
              className={`px-2 py-1 flex flex-col gap-1 items-start ${
                i < 2 ? "border-r border-hairline" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: m.color }} />
                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                  {m.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display tab font-bold text-[18px] text-ink tracking-[-0.02em]">
                  {m.done}
                </span>
                <span className="font-display tab font-semibold text-[11px] text-sub">/{m.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
