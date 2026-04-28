import { test, expect } from "@playwright/test";

test("login 페이지 — 이메일 input + 매직링크 버튼 표시", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
  await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  await expect(page.getByRole("button", { name: /매직링크/ })).toBeVisible();
});

test("/today 미인증 접근 시 /login 리다이렉트", async ({ page }) => {
  await page.goto("/today");
  await expect(page).toHaveURL(/\/login/);
});
