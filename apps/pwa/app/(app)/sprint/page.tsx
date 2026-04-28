import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/pill";
import { Hairline } from "@/components/hairline";
import { SprintHero } from "@/components/sprint/sprint-hero";
import { Calendar30 } from "@/components/sprint/calendar-30";
import { WeekBreakdown } from "@/components/sprint/week-breakdown";
import { fetchSprintProgress } from "@/lib/queries/sprint";
import { todayKst, dayIndexInSprint } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function SprintPage(): Promise<React.JSX.Element> {
  const date_kst = todayKst();
  const data = await fetchSprintProgress(date_kst);

  if (!data) {
    return (
      <AppShell active="sprint">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">활성 Sprint 없음</h1>
        </div>
      </AppShell>
    );
  }

  const dayInSprint = dayIndexInSprint(data.sprint.start_date_kst, date_kst) + 1;
  const daysRemaining = Math.max(0, 30 - dayInSprint);

  const topBar = (
    <>
      <span className="font-display text-[13px] font-semibold text-muted">Workspace</span>
      <span className="text-sub">/</span>
      <span className="font-display text-[13px] font-semibold text-ink">Sprint Progress</span>
      <div className="flex-1" />
      <Pill variant="blue">Active</Pill>
      <Pill variant="default">Day {dayInSprint} / 30</Pill>
    </>
  );

  return (
    <AppShell active="sprint" topBar={topBar}>
      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <div className="font-display text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5 lg:mb-2">
          SPRINT 01
        </div>
        <h1 className="font-display text-[19px] lg:text-[32px] font-bold tracking-[-0.025em] text-ink m-0 leading-[1.2]">
          {data.sprint.name}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-[11px] lg:text-[13px] text-muted font-display">
          <span className="tab">
            {data.sprint.start_date_kst} → {data.sprint.end_date_kst}
          </span>
          <Hairline vertical className="h-3" />
          <span>30일 스프린트</span>
        </div>
      </div>

      <SprintHero
        inputDone={data.totals.inputDone}
        inputTotal={data.totals.inputTotal}
        buildDone={data.totals.buildDone}
        buildTotal={data.totals.buildTotal}
        shareDone={data.totals.shareDone}
        shareTotal={data.totals.shareTotal}
      />

      <Calendar30
        days={data.days}
        todayIndex={data.todayIndex}
        daysRemaining={daysRemaining}
        paceLabel="—"
      />

      <WeekBreakdown days={data.days} />
    </AppShell>
  );
}
