"use client";
import * as React from "react";
import { use, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}): React.JSX.Element {
  const params = use(searchParams);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    params.error ? "error" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(
    params.error ? "인증 콜백 실패. 다시 시도하세요." : null
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    const supabase = getSupabaseBrowserClient();
    const next = params.next ?? "/today";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-ink">
        이메일을 확인하세요. 받은 링크로 다시 돌아오면 자동 로그인됩니다.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink-2">이메일</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 rounded-md border border-card-line bg-surface px-3 text-sm focus:outline-none focus:border-primary"
          placeholder="you@example.com"
        />
      </label>
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "전송 중..." : "매직링크 받기"}
      </Button>
      {errorMsg && (
        <p className="text-xs text-danger">{errorMsg}</p>
      )}
    </form>
  );
}
