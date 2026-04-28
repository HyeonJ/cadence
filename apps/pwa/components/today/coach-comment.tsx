import * as React from "react";

export function CoachComment({ text, fallbackUsed }: { text: string; fallbackUsed: boolean }): React.JSX.Element {
  return (
    <div
      className="flex bg-primary-soft border border-[#DCE8F8] border-l-[1.5px] border-l-primary rounded-[4px] p-3.5 gap-3.5 mb-6"
      style={{ borderLeftColor: "var(--primary)" }}
    >
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            Coach
          </div>
          {fallbackUsed && (
            <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
              · Fallback
            </span>
          )}
        </div>
        <p className="m-0 font-body text-[14.5px] lg:text-[14.5px] text-[13px] leading-[1.6] text-ink">
          <span className="text-primary font-bold mr-1">「</span>
          {text}
          <span className="text-primary font-bold ml-1">」</span>
        </p>
      </div>
    </div>
  );
}
