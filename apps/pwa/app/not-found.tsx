import * as React from "react";
import Link from "next/link";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[28px] font-bold text-ink mb-2">404</h1>
        <p className="text-sm text-muted mb-6">페이지를 찾지 못했습니다.</p>
        <Link href="/today" className="text-primary underline underline-offset-4">
          Today로 돌아가기
        </Link>
      </div>
    </div>
  );
}
