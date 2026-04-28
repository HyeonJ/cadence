"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/progress-bar";
import { StepProfile } from "./steps/step-profile";
import { StepGithub } from "./steps/step-github";
import { StepDiscord } from "./steps/step-discord";
import { StepNotify } from "./steps/step-notify";
import {
  completeOnboarding,
  type OnboardingInput,
} from "./onboarding-actions";
import { DEFAULT_NOTIFY_SCHEDULE } from "@/lib/queries/user-settings-types";

const TOTAL_STEPS = 4;

const INITIAL: OnboardingInput = {
  timezone: "Asia/Seoul",
  github_username: "",
  monitored_repos: [],
  discord_webhook_url: "",
  notify_schedule: DEFAULT_NOTIFY_SCHEDULE,
};

export function OnboardingFlow({
  alreadyOnboarded,
}: {
  alreadyOnboarded: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<OnboardingInput>(INITIAL);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (alreadyOnboarded) {
    return (
      <div className="bg-surface border border-card-line rounded-md p-6 max-w-sm shadow-card">
        <h1 className="font-display text-[20px] font-bold text-ink mb-2">이미 시작됨</h1>
        <p className="text-sm text-muted mb-4">
          Onboarding이 완료되어 있습니다. Today로 이동하세요.
        </p>
        <Button onClick={() => router.push("/today")}>Today로</Button>
      </div>
    );
  }

  function patch(partial: Partial<OnboardingInput>): void {
    setData((d) => ({ ...d, ...partial }));
  }

  function next(): void {
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep((step + 1) as 1 | 2 | 3 | 4);
    }
  }

  function back(): void {
    setError(null);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  }

  function submit(): void {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding(data);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/today");
      router.refresh();
    });
  }

  return (
    <div className="bg-surface border border-card-line rounded-md shadow-card w-full max-w-md p-6 sm:p-7">
      <div className="mb-5">
        <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          Cadence · Onboarding
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[12px] font-semibold text-ink-2">
            STEP {step} / {TOTAL_STEPS}
          </span>
        </div>
        <ProgressBar value={step / TOTAL_STEPS} width="100%" height={3} />
      </div>

      {step === 1 && <StepProfile data={data} onPatch={patch} />}
      {step === 2 && <StepGithub data={data} onPatch={patch} />}
      {step === 3 && <StepDiscord data={data} onPatch={patch} />}
      {step === 4 && <StepNotify data={data} onPatch={patch} />}

      {error && (
        <p role="alert" className="text-xs text-danger mt-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={back}
          disabled={step === 1 || pending}
          aria-label="이전 단계"
        >
          이전
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={next} disabled={pending} aria-label="다음 단계">
            다음
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending} aria-label="시작하기">
            {pending ? "저장 중..." : "시작하기"}
          </Button>
        )}
      </div>
    </div>
  );
}
