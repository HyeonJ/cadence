import * as React from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { fetchUserSettings } from "@/lib/queries/user-settings";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cadence — Settings" };

export default async function SettingsPage(): Promise<React.JSX.Element> {
  const settings = await fetchUserSettings();
  if (!settings) {
    redirect("/onboarding");
  }
  return (
    <AppShell active="settings">
      <div className="max-w-2xl">
        <h1 className="font-display text-[28px] font-bold text-ink mb-1">Settings</h1>
        <p className="text-sm text-muted mb-6">
          GitHub · Discord · 알림 시간 · Sprint 관리.
        </p>
        <SettingsForm initial={settings} />
      </div>
    </AppShell>
  );
}
