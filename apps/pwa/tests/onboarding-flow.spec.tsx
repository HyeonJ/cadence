import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// next/navigation router 모킹 — alreadyOnboarded 분기에서 push 호출
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// completeOnboarding은 Server Action — 단순 모킹
vi.mock(
  "@/app/(app)/onboarding/onboarding-actions",
  () => ({
    completeOnboarding: vi.fn(async () => ({ ok: true })),
  })
);

import { OnboardingFlow } from "@/app/(app)/onboarding/onboarding-flow";

describe("OnboardingFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("alreadyOnboarded=true면 Today 이동 안내", () => {
    render(<OnboardingFlow alreadyOnboarded={true} />);
    expect(screen.getByText(/이미 시작됨/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today로/ })).toBeInTheDocument();
  });

  it("기본 STEP 1 렌더 — 시간대 선택", () => {
    render(<OnboardingFlow alreadyOnboarded={false} />);
    expect(screen.getByText(/STEP 1 \/ 4/)).toBeInTheDocument();
    expect(screen.getByLabelText(/시간대/)).toBeInTheDocument();
  });

  it("다음 버튼 클릭 → STEP 2 (GitHub)로 진행", () => {
    render(<OnboardingFlow alreadyOnboarded={false} />);
    fireEvent.click(screen.getByRole("button", { name: /다음 단계/ }));
    expect(screen.getByText(/STEP 2 \/ 4/)).toBeInTheDocument();
    expect(screen.getByLabelText(/GitHub username/)).toBeInTheDocument();
  });

  it("이전 버튼 → STEP 1 복귀", () => {
    render(<OnboardingFlow alreadyOnboarded={false} />);
    const nextBtn = screen.getByRole("button", { name: /다음 단계/ });
    fireEvent.click(nextBtn); // STEP 2
    fireEvent.click(screen.getByRole("button", { name: /이전 단계/ }));
    expect(screen.getByText(/STEP 1 \/ 4/)).toBeInTheDocument();
  });

  it("STEP 4까지 도달하면 시작하기 버튼 노출", () => {
    render(<OnboardingFlow alreadyOnboarded={false} />);
    const next = screen.getByRole("button", { name: /다음 단계/ });
    fireEvent.click(next);
    fireEvent.click(screen.getByRole("button", { name: /다음 단계/ }));
    fireEvent.click(screen.getByRole("button", { name: /다음 단계/ }));
    expect(screen.getByText(/STEP 4 \/ 4/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /시작하기/ })).toBeInTheDocument();
  });
});
