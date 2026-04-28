"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { OnboardingInput } from "../onboarding-actions";

export function StepGithub({
  data,
  onPatch,
}: {
  data: OnboardingInput;
  onPatch: (partial: Partial<OnboardingInput>) => void;
}): React.JSX.Element {
  function onReposChange(raw: string): void {
    const repos = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onPatch({ monitored_repos: repos });
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[20px] font-bold text-ink leading-tight">
        GitHub 모니터링
      </h1>
      <p className="text-[13.5px] text-muted leading-relaxed">
        매일 어제의 commit/event를 수집해 카드의 자동 신호로 사용합니다. PAT는
        Routine 환경 변수에서 관리되므로 여기서는 username + repo만.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gh-username">GitHub username</Label>
        <Input
          id="gh-username"
          value={data.github_username}
          onChange={(e) => onPatch({ github_username: e.target.value })}
          placeholder="octocat"
          autoComplete="off"
          aria-required="true"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gh-repos">모니터링 repos (콤마 구분)</Label>
        <Input
          id="gh-repos"
          value={data.monitored_repos.join(", ")}
          onChange={(e) => onReposChange(e.target.value)}
          placeholder="octocat/hello-world, octocat/spoon-knife"
          autoComplete="off"
        />
        <p className="text-[11.5px] text-sub">
          예: <code className="font-mono">octocat/hello-world</code> · 비워두면
          username 전체 events만 수집.
        </p>
      </div>
    </div>
  );
}
