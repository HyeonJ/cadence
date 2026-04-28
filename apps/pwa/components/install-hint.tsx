"use client";
import * as React from "react";
import { usePlatform } from "@/lib/hooks/use-platform";

/**
 * iOS Safari 전용 PWA 설치 안내. 다른 플랫폼은 manifest beforeinstallprompt가
 * 알아서 처리하므로 표시하지 않음. 이미 standalone이면 표시 X.
 */
export function InstallHint(): React.JSX.Element | null {
  const { isIos, isStandalone } = usePlatform();
  if (!isIos || isStandalone) return null;

  return (
    <div className="rounded-md bg-primary-soft border-l-2 border-primary p-3 text-[12.5px] text-ink-2 leading-relaxed">
      <strong className="font-semibold text-primary">홈 화면에 추가</strong>
      <p className="mt-1">
        iOS Safari 하단 공유 아이콘 → <em>홈 화면에 추가</em>를 누르면 앱처럼
        쓸 수 있어요. 알림은 PWA 설치 후에도 D+30 까지는 기본 비활성입니다.
      </p>
    </div>
  );
}
