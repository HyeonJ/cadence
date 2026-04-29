"use client";
import * as React from "react";
import type { TodayDataItem } from "@/lib/queries/today";
import { Pill } from "@/components/pill";

export function TaskDetailPanel({
  item,
  noteInput,
  onNoteChange,
  onNoteSave,
  notePending,
  noteFeedback,
  readOnly = false,
}: {
  item: TodayDataItem;
  noteInput: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  notePending: boolean;
  noteFeedback: string | null;
  readOnly?: boolean;
}): React.JSX.Element {
  const fullUrl = item.url;
  const auto = item.auto_target as { type?: string; repo?: string; min?: number } | null;
  const targets = item.backbone?.targets ?? [];
  const materials = item.backbone?.materials ?? [];
  const minutes = item.backbone?.estimated_minutes ?? item.estimated_minutes;

  return (
    <div className="px-4 py-4 bg-bg border-t border-hairline flex flex-col gap-3.5 text-[13px]">
      {/* URL — full clickable */}
      {fullUrl && (
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-[3px] decoration-[#BFDBFE] break-all hover:decoration-primary"
        >
          {fullUrl}
        </a>
      )}

      {/* Auto target */}
      {item.kind === "auto_signal" && auto && (
        <div className="flex items-center gap-2 text-muted">
          <Pill variant="blue">AUTO</Pill>
          <span className="font-display tab text-[12px]">
            {auto.type === "commit_count" && auto.repo
              ? `${auto.repo} commit ≥ ${auto.min ?? 1}`
              : JSON.stringify(auto)}
          </span>
        </div>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            자료
          </span>
          <ul className="flex flex-col gap-1">
            {materials.map((m, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[12.5px]">
                <span className="text-sub">·</span>
                <div className="flex-1 min-w-0">
                  {m.url ? (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-2 hover:text-primary underline-offset-[3px] hover:underline"
                    >
                      {m.name}
                    </a>
                  ) : (
                    <span className="text-ink-2">{m.name}</span>
                  )}
                  {m.source_tag && (
                    <span className="ml-1.5 font-display text-[10.5px] text-sub">
                      {m.source_tag}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Targets */}
      {targets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            타깃
          </span>
          {targets.map((t) => (
            <Pill key={t} variant="default">
              {t}
            </Pill>
          ))}
        </div>
      )}

      {/* Minutes + status changed */}
      <div className="flex items-center gap-3 font-display text-[11.5px] text-muted">
        {minutes !== null && minutes !== undefined && (
          <span className="tab">예상 {minutes}분</span>
        )}
        {item.status_changed_at && (
          <>
            <span className="text-sub">·</span>
            <span className="tab">
              상태 변경 {formatKstTime(item.status_changed_at)}
            </span>
          </>
        )}
      </div>

      {/* Note input — readOnly 시 텍스트만 표시 */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`note-${item.id}`}
          className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub"
        >
          메모
        </label>
        {readOnly ? (
          <div className="text-[12.5px] text-ink-2 whitespace-pre-wrap min-h-[20px]">
            {noteInput || <span className="text-sub">(없음)</span>}
          </div>
        ) : (
          <>
            <textarea
              id={`note-${item.id}`}
              value={noteInput}
              onChange={(e) => onNoteChange(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="이 task에 대한 메모 (최대 500자)..."
              className="w-full rounded-md border border-card-line bg-surface px-3 py-2 text-[12.5px] text-ink resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNoteSave}
                disabled={notePending}
                className="font-display text-[11.5px] font-semibold text-primary hover:text-cobalt disabled:opacity-50 disabled:pointer-events-none"
              >
                {notePending ? "저장 중..." : "메모 저장"}
              </button>
              {noteFeedback && (
                <span role="status" className="text-[11px] text-muted">
                  {noteFeedback}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatKstTime(iso: string): string {
  // 단순 KST 시:분 표시 (UTC + 9시간)
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(kst.getUTCHours()).padStart(2, "0");
  const mm = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
