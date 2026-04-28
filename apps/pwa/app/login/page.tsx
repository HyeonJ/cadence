import * as React from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Cadence — Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm bg-surface border border-card-line rounded-md shadow-card p-7">
        <div className="mb-6">
          <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
            Cadence
          </div>
          <h1 className="font-display text-[22px] font-bold tracking-[-0.025em] text-ink">
            로그인
          </h1>
          <p className="text-sm text-muted mt-1">
            이메일로 매직링크를 받습니다.
          </p>
        </div>
        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
