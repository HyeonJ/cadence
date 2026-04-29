import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StudyGuidePanel } from "@/components/today/study-guide-panel";
import type { StudyGuide } from "@/lib/queries/today";

afterEach(() => cleanup());

const SAMPLE: StudyGuide = {
  objective: "이 자료를 끝내면 X를 할 수 있어야 합니다.",
  key_points: ["포인트 A", "포인트 B", "포인트 C"],
  steps: [
    { minutes: 5, action: "README 읽기" },
    { minutes: 10, action: "예제 코드 보기" },
  ],
};

describe("StudyGuidePanel", () => {
  it("objective 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText(/이 자료를 끝내면/)).toBeInTheDocument();
  });

  it("key_points 3개 모두 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText("포인트 A")).toBeInTheDocument();
    expect(screen.getByText("포인트 B")).toBeInTheDocument();
    expect(screen.getByText("포인트 C")).toBeInTheDocument();
  });

  it("steps의 minutes/action 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url={null} />);
    expect(screen.getByText("README 읽기")).toBeInTheDocument();
    expect(screen.getByText("예제 코드 보기")).toBeInTheDocument();
    expect(screen.getByText(/5분/)).toBeInTheDocument();
    expect(screen.getByText(/10분/)).toBeInTheDocument();
  });

  it("url 있으면 외부 링크 표시", () => {
    render(<StudyGuidePanel guide={SAMPLE} url="https://example.com/x" />);
    const link = screen.getByRole("link", { name: /example.com/ });
    expect(link).toHaveAttribute("href", "https://example.com/x");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
