"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePlatform } from "@/lib/hooks/use-platform";

const STORAGE_KEY = "cadence:install-hint-dismissed";

export function InstallHint(): React.JSX.Element | null {
  const { isIos, isStandalone } = usePlatform();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onDismiss(): void {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  if (!isIos || isStandalone || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="홈 화면에 추가 안내"
      className="rounded-md bg-primary-soft border-l-2 border-primary p-3 pr-9 text-[12.5px] text-ink-2 leading-relaxed relative"
    >
      <strong className="font-semibold text-primary">홈 화면에 추가</strong>
      <p className="mt-1">
        iOS Safari 하단 공유 아이콘 → <em>홈 화면에 추가</em>를 누르면 앱처럼
        쓸 수 있어요. 알림은 PWA 설치 후에도 D+30 까지는 기본 비활성입니다.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="안내 닫기"
        className="absolute top-2 right-2 text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
