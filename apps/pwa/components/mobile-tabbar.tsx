"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/classnames";

const TABS = [
  { id: "today", label: "Today", href: "/today" },
  { id: "sprint", label: "Progress", href: "/sprint" },
  { id: "settings", label: "Settings", href: "/settings" },
];

function TabIcon({ kind, active }: { kind: string; active: boolean }): React.JSX.Element {
  const cls = cn("w-5 h-5", active ? "text-primary" : "text-muted");
  if (kind === "today")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" /><path d="M8 3v4" /><path d="M16 3v4" />
      </svg>
    );
  if (kind === "sprint")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

export function MobileTabbar(): React.JSX.Element {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-hairline-strong h-14 flex items-stretch"
      aria-label="기본 네비게이션"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5",
              active ? "text-primary" : "text-muted"
            )}
          >
            <TabIcon kind={t.id} active={active} />
            <span className="font-display text-[10px] font-semibold tracking-wide">
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
