import * as React from "react";
import type { StudyGuide } from "@/lib/queries/today";

export function StudyGuidePanel({
  guide,
  url,
}: {
  guide: StudyGuide;
  url: string | null;
}): React.JSX.Element {
  return (
    <div className="px-4 py-4 bg-bg border-t border-hairline flex flex-col gap-4 text-[13px]">
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-[3px] decoration-[#BFDBFE] break-all hover:decoration-primary"
        >
          {stripScheme(url)}
        </a>
      )}

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          🎯 오늘의 목표
        </span>
        <p className="text-[13.5px] text-ink-2 leading-relaxed m-0">{guide.objective}</p>
      </section>

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          핵심 학습 포인트
        </span>
        <ul className="flex flex-col gap-1 m-0 pl-0 list-none">
          {guide.key_points.map((p, i) => (
            <li key={i} className="flex items-baseline gap-2 text-[12.5px] text-ink-2">
              <span className="text-sub">·</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1.5">
        <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
          📚 학습 흐름
        </span>
        <ol className="flex flex-col gap-1.5 m-0 pl-0 list-none">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-baseline gap-2 text-[12.5px] text-ink-2">
              <span className="font-display text-sub flex-shrink-0">{i + 1}.</span>
              <span className="flex-1">{s.action}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
