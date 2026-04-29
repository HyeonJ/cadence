"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/checkbox";
import { ChevronDown } from "lucide-react";
import {
  toggleItemStatus,
  saveItemNote,
  type ToggleResult,
} from "@/app/(app)/today/today-card-actions";
import type { TodayDataItem } from "@/lib/queries/today";
import { TaskDetailPanel } from "./task-detail-panel";
import { cn } from "@/lib/classnames";

export function TaskRowToggle({
  item,
  isLast,
  readOnly = false,
}: {
  item: TodayDataItem;
  isLast: boolean;
  readOnly?: boolean;
}): React.JSX.Element {
  const [status, setStatus] = useState<TodayDataItem["status"]>(item.status);
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [noteInput, setNoteInput] = useState(item.note ?? "");
  const [notePending, startNoteTransition] = useTransition();
  const [noteFeedback, setNoteFeedback] = useState<string | null>(null);

  const checked = status === "done" || status === "auto_done";
  const interactable = item.kind === "manual_check" && !readOnly;

  function onToggle(): void {
    if (!interactable || pending) return;
    const next: "pending" | "done" = checked ? "pending" : "done";
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const result: ToggleResult = await toggleItemStatus({
        item_id: item.id,
        next_status: next,
      });
      if (!result.ok) {
        setStatus(prev);
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-alert
          window.alert(`상태 업데이트 실패: ${result.message}`);
        }
      } else {
        setStatus(result.status as TodayDataItem["status"]);
      }
    });
  }

  function onSaveNote(): void {
    setNoteFeedback(null);
    startNoteTransition(async () => {
      const r = await saveItemNote({ item_id: item.id, note: noteInput });
      if (!r.ok) {
        setNoteFeedback(r.message);
      } else {
        setNoteFeedback("저장됨");
        setTimeout(() => setNoteFeedback(null), 2000);
      }
    });
  }

  function onRowClick(e: React.MouseEvent): void {
    // Don't expand when clicking checkbox button
    const target = e.target as HTMLElement;
    if (target.closest("[data-checkbox-btn]")) return;
    setExpanded((v) => !v);
  }

  const hasDetail = Boolean(
    item.url ||
      item.auto_target ||
      item.note ||
      (item.backbone?.materials.length ?? 0) > 0 ||
      (item.backbone?.targets.length ?? 0) > 0
  );

  return (
    <div className={cn(!isLast && "border-b border-hairline")}>
      <div
        className={cn(
          "flex items-center gap-3.5 px-4 py-3.5",
          hasDetail && "cursor-pointer hover:bg-bg/50 transition-colors"
        )}
        onClick={hasDetail ? onRowClick : undefined}
        role={hasDetail ? "button" : undefined}
        aria-expanded={hasDetail ? expanded : undefined}
      >
        <button
          type="button"
          data-checkbox-btn
          onClick={onToggle}
          disabled={!interactable || pending}
          className="flex-shrink-0 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[5px]"
          aria-label={
            readOnly
              ? `${item.title} (읽기 전용)`
              : checked
              ? `${item.title} 완료 취소`
              : `${item.title} 완료 처리`
          }
          aria-pressed={checked}
          aria-disabled={readOnly || undefined}
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
            {item.title}
          </div>
          {item.url && (
            <div className="text-[12px] text-muted mt-0.5 font-display truncate">
              {stripScheme(item.url)}
            </div>
          )}
        </div>
        {item.estimated_minutes !== null && item.estimated_minutes !== undefined && (
          <span className="font-display text-[12px] text-muted tab whitespace-nowrap">
            {item.estimated_minutes}분
          </span>
        )}
        {hasDetail && (
          <ChevronDown
            className={cn(
              "w-4 h-4 text-sub flex-shrink-0 transition-transform",
              expanded && "rotate-180"
            )}
          />
        )}
      </div>
      {expanded && hasDetail && (
        <TaskDetailPanel
          item={item}
          noteInput={noteInput}
          onNoteChange={setNoteInput}
          onNoteSave={onSaveNote}
          notePending={notePending}
          noteFeedback={noteFeedback}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
