import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/pill";
import { TodayHeader } from "@/components/today/today-header";
import { MiniActivityRing } from "@/components/today/mini-activity-ring";
import { CoachComment } from "@/components/today/coach-comment";
import { SlotCard } from "@/components/today/slot-card";
import { YesterdaySignals } from "@/components/today/yesterday-signals";
import { fetchTodayData } from "@/lib/queries/today";
import { todayKst, weekIndexFor, dayIndexInSprint } from "@/lib/date";

export const dynamic = "force-dynamic"; // RLS-bound 사용자별 데이터, 캐시 X

const SLOT_ORDER = [
  "weekday_morning_input",
  "weekday_evening_build",
  "weekend_deep",
  "weekend_share",
] as const;

export default async function TodayPage(): Promise<React.JSX.Element> {
  const date_kst = todayKst();
  const data = await fetchTodayData(date_kst);

  if (!data.sprint) {
    return (
      <AppShell active="today">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">활성 Sprint 없음</h1>
          <p className="text-sm text-muted mt-2">
            CLI에서 <code className="font-mono text-primary">cadence init-sprint</code>로 시드한 후
            새로고침하세요.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!data.card) {
    return (
      <AppShell active="today">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">오늘 카드 없음</h1>
          <p className="text-sm text-muted mt-2">
            매일 KST 07:00 Routines가 카드를 생성합니다. 수동:
            <code className="font-mono text-primary mx-1">cadence regen --date {date_kst}</code>
          </p>
        </div>
      </AppShell>
    );
  }

  // 슬롯별 그룹핑
  const itemsBySlot = new Map<string, typeof data.items>();
  for (const it of data.items) {
    const arr = itemsBySlot.get(it.slot_key) ?? [];
    arr.push(it);
    itemsBySlot.set(it.slot_key, arr);
  }

  // Activity Ring 비율 계산
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

  const weekIndex = weekIndexFor(data.sprint.start_date_kst, date_kst);
  const dayInSprint = dayIndexInSprint(data.sprint.start_date_kst, date_kst) + 1;
  const totalDoneCount = inputR.done + buildR.done + shareR.done;
  const totalCount = inputR.total + buildR.total + shareR.total;

  const topBar = (
    <>
      <span className="font-display text-[13px] font-semibold text-muted">Workspace</span>
      <span className="text-sub">/</span>
      <span className="font-display text-[13px] font-semibold text-ink">Today</span>
      <div className="flex-1" />
      <Pill variant="default">Day {dayInSprint} · Week {weekIndex}</Pill>
      <Pill variant="soft">{totalDoneCount} / {totalCount}</Pill>
    </>
  );

  return (
    <AppShell active="today" topBar={topBar}>
      {/* Header row */}
      <div className="flex items-start gap-6 mb-6">
        <TodayHeader
          date_kst={date_kst}
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
          return <SlotCard key={slot} slotKey={slot} items={items} />;
        })}

        <YesterdaySignals
          commits={Object.values(data.yesterdaySignals?.repo_commits ?? {}).reduce((a, b) => a + b, 0)}
          inputDone={inputR.done}
          inputTotal={inputR.total}
          buildDone={buildR.done}
        />

        <div className="flex items-center gap-5 text-[13px] text-muted mt-1">
          <Link href="/sprint" className="underline underline-offset-[3px] decoration-[#C7CCD1]">
            Sprint Progress
          </Link>
          <Link href="/settings" className="underline underline-offset-[3px] decoration-[#C7CCD1]">
            Settings
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
