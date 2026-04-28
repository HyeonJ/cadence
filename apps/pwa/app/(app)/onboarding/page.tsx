import * as React from "react";
import { OnboardingFlow } from "./onboarding-flow";
import { fetchUserSettings } from "@/lib/queries/user-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cadence — 시작하기" };

export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const existing = await fetchUserSettings();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 sm:p-6">
      <OnboardingFlow alreadyOnboarded={!!existing} />
    </div>
  );
}
