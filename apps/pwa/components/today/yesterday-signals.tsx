import * as React from "react";
import { Hairline } from "@/components/hairline";

export function YesterdaySignals({
  commits,
  inputDone,
  inputTotal,
  buildDone,
}: {
  commits: number;
  inputDone: number;
  inputTotal: number;
  buildDone: number;
}): React.JSX.Element {
  return (
    <div className="hidden lg:flex items-center gap-4 px-4 py-3 border-t border-b border-hairline font-display text-[12.5px]">
      <span className="text-sub font-semibold uppercase tracking-[0.1em] text-[10.5px]">
        어제 신호
      </span>
      <Hairline vertical />
      <span className="tab text-ink-2">
        GitHub commits <strong className="text-ink">{commits}</strong>
      </span>
      <Hairline vertical />
      <span className="tab text-ink-2">
        정독 <strong className="text-ink">{inputDone}/{inputTotal}</strong>
        {inputDone === inputTotal && inputTotal > 0 && (
          <span className="text-[#22A06B] ml-1">✓</span>
        )}
      </span>
      <Hairline vertical />
      <span className="tab text-ink-2">
        빌드 <strong className="text-ink">{buildDone}</strong>
      </span>
    </div>
  );
}
