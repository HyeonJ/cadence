"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[28px] font-bold text-ink mb-2">문제가 발생했습니다</h1>
        <p className="text-sm text-muted mb-6">{error.message}</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
