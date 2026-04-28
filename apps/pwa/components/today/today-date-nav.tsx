import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pill } from "@/components/pill";
import { todayKst } from "@/lib/date";

function shiftDate(date_kst: string, deltaDays: number): string {
  const d = new Date(`${date_kst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function TodayDateNav({ date_kst }: { date_kst: string }): React.JSX.Element {
  const prev = shiftDate(date_kst, -1);
  const next = shiftDate(date_kst, +1);
  const today = todayKst();
  const isFuture = next > today;
  const showTodayLink = date_kst !== today;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Link
        href={`/today/${prev}`}
        aria-label="전날 카드"
        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-card-line hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronLeft className="w-4 h-4 text-ink-2" />
      </Link>
      <Link
        href={isFuture ? "#" : `/today/${next}`}
        aria-label="다음 날 카드"
        aria-disabled={isFuture}
        tabIndex={isFuture ? -1 : 0}
        className={`inline-flex items-center justify-center w-8 h-8 rounded-md border border-card-line ${
          isFuture
            ? "opacity-40 pointer-events-none"
            : "hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        }`}
      >
        <ChevronRight className="w-4 h-4 text-ink-2" />
      </Link>
      <Pill variant="outline">READ-ONLY</Pill>
      <div className="flex-1" />
      {showTodayLink && (
        <Link
          href="/today"
          className="text-[12.5px] underline underline-offset-[3px] decoration-[#C7CCD1] text-ink-2 hover:text-ink"
        >
          오늘로 돌아가기
        </Link>
      )}
    </div>
  );
}
