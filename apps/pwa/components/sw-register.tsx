"use client";
import { useEffect } from "react";

export function SwRegister(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[sw] register failed:", err);
    });
  }, []);
  return null;
}
