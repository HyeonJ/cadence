import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/app/(app)/settings/settings-actions", () => ({
  saveSettings: vi.fn(async () => ({ ok: true })),
  abortActiveSprint: vi.fn(async () => ({ ok: true })),
}));

import { SettingsForm } from "@/app/(app)/settings/settings-form";
import type { UserSettings } from "@/lib/queries/user-settings";

const SAMPLE: UserSettings = {
  user_id: "00000000-0000-0000-0000-000000000001",
  timezone: "Asia/Seoul",
  github_username: "octocat",
  monitored_repos: ["octocat/hello-world"],
  discord_webhook_url: null,
  notify_schedule: [
    { time: "07:00", kind: "today_push" },
    { time: "22:00", kind: "tomorrow_preview" },
  ] as unknown as UserSettings["notify_schedule"],
};

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it("초기 값 렌더링 — username + repos + notify time", () => {
    render(<SettingsForm initial={SAMPLE} />);
    expect(screen.getByLabelText(/Username/i)).toHaveValue("octocat");
    expect(screen.getByLabelText(/모니터링 repos/)).toHaveValue("octocat/hello-world");
    expect(screen.getByLabelText(/오늘 카드/)).toHaveValue("07:00");
    expect(screen.getByLabelText(/내일 미리보기/)).toHaveValue("22:00");
  });

  it("Username 변경 → input 반영", () => {
    render(<SettingsForm initial={SAMPLE} />);
    const input = screen.getByLabelText(/Username/i);
    fireEvent.change(input, { target: { value: "newhandle" } });
    expect(input).toHaveValue("newhandle");
  });

  it("저장 버튼 클릭 → saveSettings 호출", async () => {
    const { saveSettings } = await import("@/app/(app)/settings/settings-actions");
    render(<SettingsForm initial={SAMPLE} />);
    fireEvent.click(screen.getByRole("button", { name: /^저장$/ }));
    expect(saveSettings).toHaveBeenCalledTimes(1);
  });

  it("Sprint reset 버튼 → confirm modal 표시 (취소/종료)", () => {
    render(<SettingsForm initial={SAMPLE} />);
    fireEvent.click(screen.getByRole("button", { name: /Active sprint 종료/ }));
    expect(screen.getByText(/이 sprint를 종료할까요/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^취소$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^종료$/ })).toBeInTheDocument();
  });
});
