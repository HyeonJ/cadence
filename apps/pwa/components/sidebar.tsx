import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/classnames";

type NavId = "today" | "sprint" | "settings";

const NAV_ITEMS: Array<{ id: NavId; label: string; href: string }> = [
  { id: "today", label: "Today", href: "/today" },
  { id: "sprint", label: "Sprint Progress", href: "/sprint" },
  { id: "settings", label: "Settings", href: "/settings" },
];

function NavIcon({ kind }: { kind: NavId }): React.JSX.Element {
  const cls = "w-4 h-4 text-muted flex-shrink-0";
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

export function Sidebar({
  active,
  userInitials = "HJ",
  userName = "User",
  sprintLabel = "Sprint 1 · Day 3",
}: {
  active: NavId;
  userInitials?: string;
  userName?: string;
  sprintLabel?: string;
}): React.JSX.Element {
  return (
    <aside className="hidden lg:flex w-[220px] h-full bg-bg border-r border-hairline flex-col gap-1 px-3.5 py-6">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <div className="w-[22px] h-[22px] rounded-[5px] bg-ink text-white font-display text-xs font-bold flex items-center justify-center">
          C
        </div>
        <span className="font-display text-sm font-bold tracking-[-0.01em]">Cadence</span>
        <span className="ml-auto pill-text bg-primary-soft text-primary border border-[#D6E6FB] px-1.5 py-[2px] rounded-[3px] tracking-[0.1em] text-[9.5px] font-bold">
          ACTIVE
        </span>
      </div>
      <div className="px-2.5 pb-1.5 pt-3 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-sub">
        Workspace
      </div>
      {NAV_ITEMS.map((it) => {
        const selected = it.id === active;
        return (
          <Link
            key={it.id}
            href={it.href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-body text-[13.5px]",
              selected
                ? "bg-[#EFF1F4] text-ink font-semibold"
                : "text-ink-2 font-medium hover:bg-[#EFF1F4]/60"
            )}
          >
            <NavIcon kind={it.id} />
            <span>{it.label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <div className="border-t border-hairline mt-3 pt-3 flex items-center gap-2.5 px-2">
        <div className="w-[26px] h-[26px] rounded-full bg-ink text-white font-display text-[11px] font-bold flex items-center justify-center">
          {userInitials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12.5px] font-semibold text-ink truncate">{userName}</span>
          <span className="text-[11px] text-sub truncate">{sprintLabel}</span>
        </div>
      </div>
    </aside>
  );
}
