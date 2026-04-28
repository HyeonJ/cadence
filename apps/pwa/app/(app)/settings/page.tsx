import * as React from "react";
import { AppShell } from "@/components/app-shell";

export default function SettingsPage(): React.JSX.Element {
  return (
    <AppShell active="settings">
      <div className="max-w-2xl">
        <h1 className="font-display text-[28px] font-bold text-ink mb-2">Settings</h1>
        <p className="text-sm text-muted">
          GitHub username · Discord webhook · 알림 시간 — Plan 05에서 구현 예정.
        </p>
      </div>
    </AppShell>
  );
}
