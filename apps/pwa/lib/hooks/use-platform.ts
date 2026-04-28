"use client";
import { useEffect, useState } from "react";

export interface Platform {
  isIos: boolean;
  isStandalone: boolean; // 이미 PWA로 설치됨
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>({
    isIos: false,
    isStandalone: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    // Safari standalone API + matchMedia 양쪽 체크
    const navStandalone = (
      navigator as unknown as { standalone?: boolean }
    ).standalone;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      navStandalone === true;
    setPlatform({ isIos, isStandalone });
  }, []);

  return platform;
}
