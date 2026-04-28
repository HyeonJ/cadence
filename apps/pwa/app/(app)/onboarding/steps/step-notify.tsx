"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InstallHint } from "@/components/install-hint";
import type { OnboardingInput } from "../onboarding-actions";

export function StepNotify({
  data,
  onPatch,
}: {
  data: OnboardingInput;
  onPatch: (partial: Partial<OnboardingInput>) => void;
}): React.JSX.Element {
  const today = data.notify_schedule.find((s) => s.kind === "today_push");
  const preview = data.notify_schedule.find((s) => s.kind === "tomorrow_preview");

  function patch(kind: "today_push" | "tomorrow_preview", time: string): void {
    const others = data.notify_schedule.filter((s) => s.kind !== kind);
    onPatch({
      notify_schedule: [...others, { time, kind }],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[20px] font-bold text-ink leading-tight">
        알림 시간
      </h1>
      <p className="text-[13.5px] text-muted leading-relaxed">
        매일 카드 도착·미리보기를 알릴 시각을 정합니다. (KST 24h)
      </p>
      <div className="flex gap-3">
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="time-today">오늘 카드 (07:00 권장)</Label>
          <Input
            id="time-today"
            type="time"
            value={today?.time ?? "07:00"}
            onChange={(e) => patch("today_push", e.target.value)}
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <Label htmlFor="time-preview">내일 미리보기 (22:00 권장)</Label>
          <Input
            id="time-preview"
            type="time"
            value={preview?.time ?? "22:00"}
            onChange={(e) => patch("tomorrow_preview", e.target.value)}
          />
        </div>
      </div>
      <InstallHint />
      <p className="text-[11.5px] text-sub">
        웹푸시는 D+30 이후 — 그 전에는 Discord webhook (Step 3)으로 알림이 발송됩니다.
      </p>
    </div>
  );
}
