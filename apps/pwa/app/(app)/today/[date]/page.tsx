import * as React from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/pill";
import { TodayHeader } from "@/components/today/today-header";
import { MiniActivityRing } from "@/components/today/mini-activity-ring";
import { CoachComment } from "@/components/today/coach-comment";
import { SlotCard } from "@/components/today/slot-card";
import { YesterdaySignals } from "@/components/today/yesterday-signals";
import { TodayDateNav } from "@/components/today/today-date-nav";
import { fetchTodayData } from "@/lib/queries/today";
import { weekIndexFor, dayIndexInSprint } from "@/lib/date";

export const dynamic = "force-dynamic";

const SLOT_ORDER = [
  "weekday_morning_input",
  "weekday_evening_build",
  "weekend_deep",
  "weekend_share",
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<React.JSX.Element> {
  const { date } = await params;
  if (!DATE_RE.test(date)) notFound();

  const data = await fetchTodayData(date);

  if (!data.sprint || !data.card) {
    return (
      <AppShell active="today">
        <TodayDateNav date_kst={date} />
        <div className="max-w-md mx-auto mt-12 text-center">
          <h1 className="font-display text-[20px] font-bold text-ink">{date} 카드 없음</h1>
          <p className="text-sm text-muted mt-2">
            이 날짜의 카드가 생성되지 않았습니다.
          </p>
        </div>
      </AppShell>
    );
  }

  const itemsBySlot = new Map<string, typeof data.items>();
  for (const it of data.items) {
    const arr = itemsBySlot.get(it.slot_key) ?? [];
    arr.push(it);
    itemsBySlot.set(it.slot_key, arr);
  }

  const inputItems = itemsBySlot.get("weekday_morning_input") ?? [];
  const buildItems = [
    ...(itemsBySlot.get("weekday_evening_build") ?? []),
    ...(itemsBySlot.get("weekend_deep") ?? []),
  ];
  const shareItems = itemsBySlot.get("weekend_share") ?? [];

  function ratio(arr: typeof data.items): { done: number; total: number; r: number } {
    const total = arr.length;
    const done = arr.filter((i) => i.status === "done" || i.status === "auto_done").length;
    return { done, total, r: total === 0 ? 0 : done / total };
  }

  const inputR = ratio(inputItems);
  const buildR = ratio(buildItems);
  const shareR = ratio(shareItems);

  const weekIndex = weekIndexFor(data.sprint.start_date_kst, date);
  const dayInSprint = dayIndexInSprint(data.sprint.start_date_kst, date) + 1;

  const topBar = (
    <>
      <span className="font-display text-[13px] font-semibold text-muted">Workspace</span>
      <span className="text-sub">/</span>
      <span className="font-display text-[13px] font-semibold text-ink">
        Today · {date}
      </span>
      <div className="flex-1" />
      <Pill variant="outline">READ-ONLY</Pill>
    </>
  );

  return (
    <AppShell active="today" topBar={topBar}>
      <TodayDateNav date_kst={date} />

      <div className="flex items-start gap-6 mb-6">
        <TodayHeader
          date_kst={date}
          sprintName={data.sprint.name}
          weekIndex={weekIndex}
          dayInSprint={dayInSprint}
        />
        <MiniActivityRing
          values={[inputR.r, buildR.r, shareR.r]}
          inputRatio={{ done: inputR.done, total: inputR.total }}
          buildRatio={{ done: buildR.done, total: buildR.total }}
          shareRatio={{ done: shareR.done, total: shareR.total }}
        />
      </div>

      <CoachComment text={data.card.coach_comment ?? ""} fallbackUsed={data.card.fallback_used} />

      <div className="flex flex-col gap-4">
        {SLOT_ORDER.map((slot) => {
          const items = itemsBySlot.get(slot);
          if (!items || items.length === 0) return null;
          return <SlotCard key={slot} slotKey={slot} items={items} readOnly />;
        })}

        <YesterdaySignals
          commits={Object.values(data.yesterdaySignals?.repo_commits ?? {}).reduce((a, b) => a + b, 0)}
          inputDone={inputR.done}
          inputTotal={inputR.total}
          buildDone={buildR.done}
        />
      </div>
    </AppShell>
  );
}
