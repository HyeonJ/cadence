"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { previewExport } from "./account-actions";

export function AccountSection(): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [info, setInfo] = useState<string | null>(null);

  function onExport(): void {
    setInfo(null);
    startTransition(async () => {
      const r = await previewExport();
      if (!r.ok) {
        setInfo(`내보내기 실패: ${r.message}`);
        return;
      }
      setInfo(
        `${(r.sizeBytes / 1024).toFixed(1)} KB · cards ${r.rowCounts.daily_cards} · items ${r.rowCounts.sprint_backbone_items}`
      );
      const a = document.createElement("a");
      a.href = "/api/account/export";
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  return (
    <section className="bg-surface border border-card-line rounded-md p-5 flex flex-col gap-3">
      <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.1em] text-muted">
        계정
      </h2>
      <p className="text-[13px] text-muted leading-relaxed">
        본인 데이터 6 테이블을 JSON 1파일로 다운로드합니다 (settings · sprints ·
        backbone · daily cards · items · signals). 백업/이관 용도.
      </p>
      <Button type="button" variant="outline" className="w-fit" onClick={onExport} disabled={pending}>
        {pending ? "준비 중..." : "데이터 내보내기 (JSON)"}
      </Button>
      {info && <span role="status" className="text-[12.5px] text-muted">{info}</span>}
    </section>
  );
}
