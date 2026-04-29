"use client";
import * as React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount, previewExport } from "./account-actions";

export function AccountSection(): React.JSX.Element {
  const [pending, startTransition] = useTransition();
  const [info, setInfo] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

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

  function onDelete(): void {
    setDeleteErr(null);
    startDeleteTransition(async () => {
      const r = await deleteAccount({ confirmText });
      if (r && !r.ok) setDeleteErr(r.message);
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

      <div className="border-t border-card-line pt-4 mt-2">
        <h3 className="font-display text-[13px] font-semibold uppercase tracking-[0.1em] text-danger mb-2">
          위험 영역
        </h3>
        <p className="text-[13px] text-muted leading-relaxed mb-3">
          계정과 모든 데이터를 영구 삭제합니다. 되돌릴 수 없으므로, 먼저 위에서
          데이터를 내보내 두기를 권합니다.
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="w-fit border-danger text-danger">
              계정 삭제
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>계정을 영구 삭제할까요?</DialogTitle>
              <DialogDescription>
                이 작업은 되돌릴 수 없습니다. 계속하려면 아래 입력란에 정확히
                <strong className="mx-1">DELETE</strong>를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-2">
              <Label htmlFor="confirm-delete">확인 문구</Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
              {deleteErr && (
                <span role="alert" className="text-[12.5px] text-danger">
                  {deleteErr}
                </span>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={deletePending}>
                  취소
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={onDelete}
                disabled={deletePending || confirmText !== "DELETE"}
                className="bg-danger text-white hover:bg-danger/90"
              >
                {deletePending ? "삭제 중..." : "영구 삭제"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
