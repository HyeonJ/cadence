"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/checkbox";
import { toggleItemStatus, type ToggleResult } from "@/app/(app)/today/today-card-actions";
import { cn } from "@/lib/classnames";

type Status = "pending" | "done" | "skipped" | "auto_done";

export function TaskRowToggle({
  itemId,
  initialStatus,
  title,
  url,
  durationLabel,
  kind,
  isLast,
}: {
  itemId: string;
  initialStatus: Status;
  title: string;
  url: string | null;
  durationLabel: string;
  kind: "manual_check" | "auto_signal";
  isLast: boolean;
}): React.JSX.Element {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, startTransition] = useTransition();
  const checked = status === "done" || status === "auto_done";
  const interactable = kind === "manual_check";

  function onToggle(): void {
    if (!interactable || pending) return;
    const next: "pending" | "done" = checked ? "pending" : "done";
    const prev = status;
    setStatus(next); // optimistic
    startTransition(async () => {
      const result: ToggleResult = await toggleItemStatus({ item_id: itemId, next_status: next });
      if (!result.ok) {
        setStatus(prev); // rollback
        // Toast 발송은 단순 alert로 fallback (Plan 05에서 useToast hook)
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-alert
          window.alert(`상태 업데이트 실패: ${result.message}`);
        }
      } else {
        setStatus(result.status);
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 px-4 py-3.5",
        !isLast && "border-b border-hairline"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!interactable || pending}
        className="flex-shrink-0 disabled:opacity-60"
        aria-label={checked ? `${title} 완료 취소` : `${title} 완료 처리`}
        aria-pressed={checked}
      >
        <Checkbox checked={checked} />
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[14px] font-semibold text-ink truncate",
            checked && "line-through decoration-sub"
          )}
        >
          {title}
        </div>
        {url && (
          <div className="text-[12px] text-muted mt-0.5 font-display truncate">
            {stripScheme(url)}
          </div>
        )}
      </div>
      <span className="font-display text-[12px] text-muted tab whitespace-nowrap">
        {durationLabel}
      </span>
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
