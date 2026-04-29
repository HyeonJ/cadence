"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  saveSettings,
  abortActiveSprint,
  type SettingsInput,
  type SettingsResult,
} from "./settings-actions";
import type { UserSettings, NotifySlot } from "@/lib/queries/user-settings-types";

interface FormState {
  timezone: string;
  github_username: string;
  monitored_repos_text: string; // 콤마 구분 raw
  discord_webhook_url: string;
  notify_today: string;
  notify_preview: string;
}

function fromSettings(s: UserSettings): FormState {
  const sched = (s.notify_schedule as unknown as NotifySlot[]) ?? [];
  const today = sched.find((x) => x.kind === "today_push")?.time ?? "07:00";
  const preview = sched.find((x) => x.kind === "tomorrow_preview")?.time ?? "22:00";
  return {
    timezone: s.timezone ?? "Asia/Seoul",
    github_username: s.github_username ?? "",
    monitored_repos_text: (s.monitored_repos ?? []).join(", "),
    discord_webhook_url: s.discord_webhook_url ?? "",
    notify_today: today,
    notify_preview: preview,
  };
}

function toInput(state: FormState): SettingsInput {
  return {
    timezone: state.timezone,
    github_username: state.github_username,
    monitored_repos: state.monitored_repos_text
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
    discord_webhook_url: state.discord_webhook_url,
    notify_schedule: [
      { time: state.notify_today, kind: "today_push" },
      { time: state.notify_preview, kind: "tomorrow_preview" },
    ],
  };
}

export function SettingsForm({
  initial,
}: {
  initial: UserSettings;
}): React.JSX.Element {
  const [state, setState] = useState<FormState>(() => fromSettings(initial));
  const [pending, startTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  function patch(p: Partial<FormState>): void {
    setState((s) => ({ ...s, ...p }));
  }

  function onSave(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result: SettingsResult = await saveSettings(toInput(state));
      if (result.ok) setFeedback({ kind: "ok", msg: "저장됨" });
      else setFeedback({ kind: "err", msg: result.message });
    });
  }

  function onResetSprint(): void {
    setFeedback(null);
    startResetTransition(async () => {
      const result = await abortActiveSprint();
      setResetOpen(false);
      if (result.ok)
        setFeedback({ kind: "ok", msg: "Active sprint를 종료했습니다. 새 sprint는 CLI에서 init." });
      else setFeedback({ kind: "err", msg: result.message });
    });
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-6">
      {/* GitHub */}
      <section className="bg-surface border border-card-line rounded-md p-5 flex flex-col gap-4">
        <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-muted">
          GitHub
        </h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-gh">Username</Label>
          <Input
            id="s-gh"
            value={state.github_username}
            onChange={(e) => patch({ github_username: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-repos">모니터링 repos (콤마 구분)</Label>
          <Input
            id="s-repos"
            value={state.monitored_repos_text}
            onChange={(e) => patch({ monitored_repos_text: e.target.value })}
            placeholder="owner/repo, owner/repo"
          />
        </div>
      </section>

      {/* Discord */}
      <section className="bg-surface border border-card-line rounded-md p-5 flex flex-col gap-4">
        <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-muted">
          Discord (선택)
        </h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="s-discord">Webhook URL</Label>
          <Input
            id="s-discord"
            type="url"
            value={state.discord_webhook_url}
            onChange={(e) => patch({ discord_webhook_url: e.target.value })}
            placeholder="https://discord.com/api/webhooks/..."
          />
        </div>
      </section>

      {/* Notify schedule */}
      <section className="bg-surface border border-card-line rounded-md p-5 flex flex-col gap-4">
        <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-muted">
          알림 시간 (KST)
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <Label htmlFor="s-time-today">오늘 카드</Label>
            <Input
              id="s-time-today"
              type="time"
              value={state.notify_today}
              onChange={(e) => patch({ notify_today: e.target.value })}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <Label htmlFor="s-time-preview">내일 미리보기</Label>
            <Input
              id="s-time-preview"
              type="time"
              value={state.notify_preview}
              onChange={(e) => patch({ notify_preview: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Save row */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
        {feedback && (
          <span
            role="status"
            className={feedback.kind === "ok" ? "text-[12.5px] text-primary" : "text-[12.5px] text-danger"}
          >
            {feedback.msg}
          </span>
        )}
      </div>

      {/* Sprint 관리 */}
      <section className="bg-surface border border-card-line rounded-md p-5 flex flex-col gap-3">
        <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-muted">
          Sprint 관리
        </h2>
        <p className="text-[13px] text-muted leading-relaxed">
          현재 active sprint를 강제 종료(completed)합니다. 새 sprint는 CLI
          (<code className="font-mono">cadence init-sprint</code>)에서 시작.
        </p>
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-fit">
              Active sprint 종료
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>이 sprint를 종료할까요?</DialogTitle>
              <DialogDescription>
                되돌릴 수 없습니다. 카드/체크 기록은 유지되지만, 오늘 화면에서 활성 sprint가 사라집니다.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  취소
                </Button>
              </DialogClose>
              <Button type="button" onClick={onResetSprint} disabled={resetPending}>
                {resetPending ? "처리 중..." : "종료"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

    </form>
  );
}
