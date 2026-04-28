"use client";
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { OnboardingInput } from "../onboarding-actions";

export function StepDiscord({
  data,
  onPatch,
}: {
  data: OnboardingInput;
  onPatch: (partial: Partial<OnboardingInput>) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[20px] font-bold text-ink leading-tight">
        Discord 알림 (선택)
      </h1>
      <p className="text-[13.5px] text-muted leading-relaxed">
        매일 카드가 생성되면 Discord webhook으로 미리 알릴 수 있습니다. 비워두면
        PWA만 사용. 나중에 Settings에서 추가/제거할 수 있어요.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="discord-url">Webhook URL</Label>
        <Input
          id="discord-url"
          type="url"
          value={data.discord_webhook_url ?? ""}
          onChange={(e) => onPatch({ discord_webhook_url: e.target.value })}
          placeholder="https://discord.com/api/webhooks/..."
          autoComplete="off"
          aria-describedby="discord-help"
        />
        <p id="discord-help" className="text-[11.5px] text-sub">
          Discord 서버 채널 → Edit Channel → Integrations → Webhooks → New Webhook
          → Copy URL. <code>discord.com/api/webhooks/</code>로 시작해야 합니다.
        </p>
      </div>
    </div>
  );
}
