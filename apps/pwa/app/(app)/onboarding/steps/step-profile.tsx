"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { OnboardingInput } from "../onboarding-actions";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Seoul", label: "서울 (UTC+9)" },
  { value: "Asia/Tokyo", label: "도쿄 (UTC+9)" },
  { value: "America/Los_Angeles", label: "LA (UTC-8/-7)" },
  { value: "America/New_York", label: "NY (UTC-5/-4)" },
  { value: "Europe/London", label: "런던 (UTC+0/+1)" },
];

export function StepProfile({
  data,
  onPatch,
}: {
  data: OnboardingInput;
  onPatch: (partial: Partial<OnboardingInput>) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[22px] font-bold text-ink leading-tight">
        Cadence를 시작합니다
      </h1>
      <p className="text-[13.5px] text-muted leading-relaxed">
        매일 KST 07:00에 카드 1장이 자동 생성됩니다. 먼저 시간대를 설정하세요. v1은
        Asia/Seoul 기준으로 동작합니다.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="timezone">시간대</Label>
        <select
          id="timezone"
          value={data.timezone}
          onChange={(e) => onPatch({ timezone: e.target.value })}
          className="h-9 rounded-md border border-card-line bg-surface px-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {TIMEZONE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-[11.5px] text-sub">
          v1는 KST 하드코딩 — 다른 값을 골라도 알림은 KST 시각 기준으로 발송됩니다.
        </p>
      </div>
    </div>
  );
}
