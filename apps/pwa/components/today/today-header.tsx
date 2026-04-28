import * as React from "react";
import { Pill } from "@/components/pill";
import { formatKstHeader, formatKstShort } from "@/lib/date";

export function TodayHeader({
  date_kst,
  sprintName,
  weekIndex,
  dayInSprint,
}: {
  date_kst: string;
  sprintName: string;
  weekIndex: number;
  dayInSprint: number; // 1-based
}): React.JSX.Element {
  const desktopHeader = formatKstHeader(date_kst);
  const { headline, shortDow } = formatKstShort(date_kst);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block flex-1">
        <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
          {desktopHeader}
        </div>
        <h1 className="font-display text-[32px] font-bold tracking-[-0.025em] leading-[1.1] text-ink m-0">
          {headline}
        </h1>
        <div className="flex items-center gap-2.5 mt-2.5">
          <Pill variant="blue">Active</Pill>
          <span className="text-[13px] text-muted">Sprint {weekIndex} · {sprintName}</span>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex-1">
        <div className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          {shortDow}
        </div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.022em] leading-[1.2] text-ink m-0 whitespace-pre-line">
          {headline.split(" ").slice(1, 3).join(" ")}{"\n"}{headline.split(" ").slice(3).join(" ")}
        </h1>
        <div className="flex items-center gap-1.5 mt-2">
          <Pill variant="blue">Active</Pill>
          <Pill variant="default">D{dayInSprint} · W{weekIndex}</Pill>
        </div>
      </div>
    </>
  );
}
