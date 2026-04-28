# Cadence PWA Foundation Implementation Plan (Plan 04 / 7)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/pwa` (Next.js 15 App Router) Foundation — Supabase Auth(magiclink) + 디자인 토큰(spec §6.2) + Today 화면(Activity Ring + Coach Comment + slot/task list + status 토글) + Sprint Progress 화면(overall % + 3 카테고리 통계 + 30일 캘린더 + 주간 breakdown). Plan 03가 만든 `daily_cards` / `daily_card_items` / `sprints` / `sprint_backbone_items`를 사용자가 처음으로 PWA에서 실제로 보고 체크할 수 있게 됨. **Onboarding · Settings · 과거 카드 read-only · manifest · service worker는 Plan 05.**

**Architecture:** Next.js 15 App Router + RSC가 데이터 페칭 (Supabase server client + RLS-bound user 세션) → Server Component가 카드/스프린트 read, Client Component는 status 토글·hover 등 인터랙티브 영역만. `@supabase/ssr`이 cookie 기반 세션을 SSR/CSR 양쪽에서 안전하게 공유. Tailwind 3.4 + spec §6.2 CSS 변수가 디자인 토큰 단일 출처 (`globals.css`에 정의 + `tailwind.config.ts`에 매핑). shadcn/ui Radix primitives (Button/Card/Toast)만 골라서 사용 — 일반 카드는 hairline + 6px radius 직접 작성. 모바일 < 768px 하단 탭바, 데스크톱 ≥ 768px 좌측 220px sidebar의 hybrid layout.

**Tech Stack:** Next.js 15.0+, React 19, TypeScript 5.6, Tailwind CSS 3.4+, `@supabase/ssr` ^0.5, `@supabase/supabase-js` ^2.45, shadcn/ui (Radix UI primitives), Vitest 2 + `@testing-library/react`, Playwright 1.48+ (e2e smoke 1~2건).

**Spec reference:** spec § 6 (PWA UI), § 6.2 (디자인 토큰 — color/typography/radius/spacing/anti-AI-slop guard), § 6.3 (네비게이션), § 4 (데이터 모델 — `daily_cards` / `daily_card_items` / `sprints` / `sprint_backbone_items`), § 4.3 (RLS — PWA는 anon key + RLS만).

> **디자인 ground truth:** `docs/design/demos/today-hybrid.html` (1372 lines) + `today-hybrid.png`. 본 plan의 모든 UI task는 시안의 정확한 색·radius·간격을 그대로 옮긴다. 디자인 임의 추가 X (슬립 이모지·그라디언트 fill·보라색·둥근 16~20px 일반 카드 등 spec §6.2 anti-slop 가드 위반 금지).

---

## File Structure

**Create:**
- `apps/pwa/{package.json, tsconfig.json, next.config.mjs, postcss.config.mjs, tailwind.config.ts, .gitignore, README.md}`
- `apps/pwa/app/{layout.tsx, page.tsx, globals.css, error.tsx, not-found.tsx}`
- `apps/pwa/app/login/page.tsx`
- `apps/pwa/app/auth/callback/route.ts`
- `apps/pwa/app/(app)/{layout.tsx}` — 보호된 라우트 그룹 (sidebar/tabbar shell)
- `apps/pwa/app/(app)/today/page.tsx`
- `apps/pwa/app/(app)/today/today-card-actions.ts` — Server Action (status 토글)
- `apps/pwa/app/(app)/sprint/page.tsx`
- `apps/pwa/components/ui/{button.tsx, card.tsx, toast.tsx, toaster.tsx}` — shadcn/ui primitives
- `apps/pwa/components/{sidebar.tsx, mobile-tabbar.tsx, app-shell.tsx, pill.tsx, hairline.tsx, checkbox.tsx, progress-bar.tsx}`
- `apps/pwa/components/today/{coach-comment.tsx, today-header.tsx, slot-card.tsx, task-row-toggle.tsx, yesterday-signals.tsx, mini-activity-ring.tsx}`
- `apps/pwa/components/sprint/{sprint-hero.tsx, metric-card.tsx, calendar-30.tsx, week-breakdown.tsx}`
- `apps/pwa/components/activity-ring.tsx`
- `apps/pwa/lib/supabase/{server.ts, browser.ts, middleware.ts}`
- `apps/pwa/lib/{date.ts, classnames.ts, env.ts}`
- `apps/pwa/lib/queries/{today.ts, sprint.ts}`
- `apps/pwa/middleware.ts`
- `apps/pwa/tests/{date.spec.ts, activity-ring.spec.tsx, slot-card.spec.tsx, calendar-30.spec.tsx}`
- `apps/pwa/e2e/{playwright.config.ts, today.spec.ts}`
- `apps/pwa/vitest.config.ts`
- `docs/operations/pwa-local.md`

**Modify:**
- `package.json` (root) — `dev:pwa` script 추가
- `.env.example` — `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- `pnpm-workspace.yaml` — 변경 X (`apps/*` 이미 포함)

---

## Task 1: apps/pwa 스캐폴딩 + Next.js 15 설정

**Files:**
- Create: `apps/pwa/{package.json, tsconfig.json, next.config.mjs, .gitignore}`, `app/{layout.tsx,page.tsx,globals.css}`
- Modify: `package.json` (root) — `dev:pwa` script

- [ ] **Step 1: Write `apps/pwa/package.json`**

```json
{
  "name": "@cadence/pwa",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@cadence/db": "workspace:*",
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.445.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^20.16.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "dotenv": "^16.4.5",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Write `apps/pwa/tsconfig.json`** (Next.js + monorepo 통합)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", ".next", "e2e"]
}
```

> **주의:** `tsconfig.base.json`의 `allowImportingTsExtensions: true`는 그대로 상속. 단, **Next.js 빌드 단계에서 `.ts` 확장자 import는 Next 내부 webpack/turbopack이 처리하지 못함** — 따라서 `apps/pwa` 안에서는 `.ts` 확장자 없이 import (`from "@/lib/foo"`). `@cadence/db`는 monorepo 내부지만 `transpilePackages`로 처리.

- [ ] **Step 3: Write `apps/pwa/next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // monorepo workspace 패키지 (.ts 그대로 import) 컴파일
  transpilePackages: ["@cadence/db"],
  experimental: {
    // Server Actions는 Next 15 default — 별도 옵션 불필요
  },
  // .env는 root에서 dotenv 로드 — Next는 자체로 .env.local 우선이므로
  // 운영 시 apps/pwa/.env.local에 NEXT_PUBLIC_* 두는 게 표준 (Task 5).
};

export default nextConfig;
```

- [ ] **Step 4: Write `apps/pwa/.gitignore`**

```
.next/
out/
node_modules/
.env*.local
*.tsbuildinfo
playwright-report/
test-results/
```

- [ ] **Step 5: Write `apps/pwa/app/layout.tsx` (root layout, 폰트 task 8에서 갱신)**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence",
  description: "Personal learning coach — Sprint backbone 기반 daily card",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ko">
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Write `apps/pwa/app/page.tsx` (root → /today redirect)**

```tsx
import { redirect } from "next/navigation";

export default function Home(): never {
  redirect("/today");
}
```

- [ ] **Step 7: Write `apps/pwa/app/globals.css` (placeholder — Task 2가 토큰 채움)**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: Update root `package.json` — `dev:pwa` script 추가**

```json
"scripts": {
  "supabase:start": "supabase start",
  "supabase:stop": "supabase stop",
  "supabase:reset": "supabase db reset",
  "supabase:gen-types": "supabase gen types typescript --local > packages/db/src/types.ts",
  "test": "pnpm --recursive run test",
  "dev:pwa": "pnpm --filter @cadence/pwa dev",
  "build:pwa": "pnpm --filter @cadence/pwa build"
}
```

- [ ] **Step 9: Install + commit**

```bash
pnpm install
```

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa package.json pnpm-lock.yaml
git -C "C:/Dev/Workspace/cadence" commit -m "chore(pwa): apps/pwa Next.js 15 스캐폴딩 + monorepo 통합"
```

---

## Task 2: 디자인 토큰 — globals.css + Tailwind config

**Files:**
- Create: `apps/pwa/tailwind.config.ts`, `apps/pwa/postcss.config.mjs`
- Modify: `apps/pwa/app/globals.css`

> 시안(`today-hybrid.html`)이 사용하는 정확한 hex 값과 spec §6.2 토큰을 1:1 매칭. 임의 추가·변경 X.

- [ ] **Step 1: Write `apps/pwa/postcss.config.mjs`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Write `apps/pwa/tailwind.config.ts`** (CSS 변수 → Tailwind 유틸리티)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        sub: "var(--sub)",
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        "card-line": "var(--card-line)",
        primary: "var(--primary)",
        "primary-soft": "var(--primary-soft)",
        cobalt: "var(--cobalt)",
        "sky-50": "var(--sky-50)",
        "sky-100": "var(--sky-100)",
        "sky-200": "var(--sky-200)",
        "ring-input": "var(--ring-input)",
        "ring-build": "var(--ring-build)",
        "ring-share": "var(--ring-share)",
        "ring-track": "var(--ring-track)",
        "cell-empty": "var(--cell-empty)",
        "cell-1": "var(--cell-1)",
        "cell-2": "var(--cell-2)",
        "cell-3": "var(--cell-3)",
        danger: "var(--danger)",
      },
      borderRadius: {
        DEFAULT: "6px",
        data: "14px",
        cell: "8px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "Pretendard", "sans-serif"],
        body: ["var(--font-body)", "Inter", "Pretendard", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04)",
      },
      letterSpacing: {
        display: "-0.04em",
        pill: "0.06em",
        "pill-strong": "0.12em",
      },
      fontSize: {
        pill: ["11px", { letterSpacing: "0.06em" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 3: Update `apps/pwa/app/globals.css` — spec §6.2 토큰 + 시안 보강**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Color — spec §6.2 + 시안 보강 (TOK 객체와 1:1) */
  --bg:               #FAFAFA;
  --surface:          #FFFFFF;
  --ink:              #0A0A0A;
  --ink-2:            #1F1F22;
  --ink-secondary:    #535862;
  --muted:            #5F6368;
  --sub:              #8B8F94;
  --hairline:         #E5E5E5;
  --hairline-strong:  #DCE0E6;
  --card-line:        #DCE0E6;

  /* 강조 */
  --primary:          #007AFF;   /* Apple System Blue */
  --primary-soft:     #F0F7FF;   /* Coach Comment fill */
  --cobalt:           #2563EB;
  --sky-50:           #DBEAFE;
  --sky-100:          #BFDBFE;
  --sky-200:          #93C5FD;

  /* Activity Ring (단방향) */
  --ring-input:       #007AFF;
  --ring-build:       #38BDF8;
  --ring-share:       #7DD3FC;
  --ring-track:       #EDEFF2;

  /* 30일 캘린더 cell */
  --cell-empty:       #F2F2F7;
  --cell-1:           #DBEAFE;
  --cell-2:           #BFDBFE;
  --cell-3:           #93C5FD;

  --danger:           #EF4444;

  /* Typography stacks (Task 8에서 next/font가 var(--font-*) 채움) */
  --font-display:     'Inter', 'Pretendard', sans-serif;
  --font-body:        'Inter', 'Pretendard', sans-serif;
  --font-mono:        'JetBrains Mono', monospace;
}

/* 기본 background + smoothing */
html, body {
  background: var(--bg);
  color: var(--ink);
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* tabular-nums utility — 큰 숫자/시간 등 */
.tab {
  font-variant-numeric: tabular-nums;
}

/* uppercase pill 11px + tracking 0.06em (spec §6.2) */
.pill-text {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Smoke check (typecheck)**

```bash
pnpm --filter @cadence/pwa typecheck
```

Expected: 0 error.

- [ ] **Step 5: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/tailwind.config.ts apps/pwa/postcss.config.mjs apps/pwa/app/globals.css
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): 디자인 토큰 (CSS vars + Tailwind 매핑) — spec §6.2"
```

---

## Task 3: shadcn/ui 기반 components/ui (Button + Card + Toast)

**Files:**
- Create: `apps/pwa/components/ui/{button.tsx, card.tsx, toast.tsx, toaster.tsx}`, `apps/pwa/lib/classnames.ts`

> shadcn 표준 출력 그대로 — Tailwind 토큰만 본 plan의 token 이름으로 교체.

- [ ] **Step 1: Write `apps/pwa/lib/classnames.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Write `apps/pwa/components/ui/button.tsx`** (shadcn — 변형 4개 + size 3개)

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/classnames";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-cobalt",
        outline: "border border-card-line bg-surface text-ink hover:bg-bg",
        ghost: "text-ink-2 hover:bg-[#EFF1F4]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 3: Write `apps/pwa/components/ui/card.tsx`** (시안의 일반 카드 = 6px radius + hairline)

```tsx
import * as React from "react";
import { cn } from "@/lib/classnames";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-surface border border-card-line rounded-md shadow-card",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2.5 px-4 py-3 border-b border-hairline", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-3", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardContent };
```

- [ ] **Step 4: Write `apps/pwa/components/ui/toast.tsx`** (Radix Toast wrapper — 표준 shadcn 패턴, 본 plan에서는 단순 구현)

```tsx
"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/classnames";

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:right-4 sm:w-[360px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "bg-surface border border-card-line rounded-md p-3 shadow-card text-sm text-ink",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
  />
));
Toast.displayName = "Toast";

export { ToastProvider, ToastViewport, Toast };
```

- [ ] **Step 5: Write `apps/pwa/components/ui/toaster.tsx`** (provider mount — root layout에서 사용)

```tsx
"use client";
import { ToastProvider, ToastViewport } from "./toast";

export function Toaster(): JSX.Element {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}
```

- [ ] **Step 6: Mount Toaster in `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Cadence",
  description: "Personal learning coach",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ko">
      <body className="bg-bg text-ink antialiased font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/ui apps/pwa/lib/classnames.ts apps/pwa/app/layout.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): shadcn/ui Button/Card/Toast + cn helper + Toaster mount"
```

---

## Task 4: 공용 atoms — Pill / Hairline / Checkbox / ProgressBar / ActivityRing

**Files:**
- Create: `apps/pwa/components/{pill.tsx, hairline.tsx, checkbox.tsx, progress-bar.tsx, activity-ring.tsx}`, `apps/pwa/tests/activity-ring.spec.tsx`

> 시안 React 컴포넌트(`today-hybrid.html` Pill/Checkbox/ProgressBar/ActivityRing)를 그대로 옮김. 인라인 style → Tailwind class 치환.

- [ ] **Step 1: Write `apps/pwa/components/pill.tsx`** (4 variant)

```tsx
import { cn } from "@/lib/classnames";

type PillVariant = "default" | "blue" | "soft" | "outline";

export function Pill({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}): JSX.Element {
  const variants: Record<PillVariant, string> = {
    default: "bg-[#EFF1F4] text-ink-2 border border-hairline",
    blue: "bg-primary text-white border border-primary",
    soft: "bg-primary-soft text-primary border border-[#D6E6FB]",
    outline: "bg-surface text-ink-2 border border-card-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-[3px] font-display text-[10px] font-bold uppercase tracking-[0.1em] leading-tight",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Write `apps/pwa/components/hairline.tsx`**

```tsx
import { cn } from "@/lib/classnames";

export function Hairline({
  vertical = false,
  className,
}: {
  vertical?: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "bg-hairline",
        vertical ? "w-px self-stretch" : "h-px w-full",
        className
      )}
    />
  );
}
```

- [ ] **Step 3: Write `apps/pwa/components/checkbox.tsx`** (presentational — 실제 토글은 `task-row-toggle.tsx`)

```tsx
import { cn } from "@/lib/classnames";

export function Checkbox({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn(
        "flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors",
        checked
          ? "border-primary bg-primary"
          : "border-[#C7CCD1] bg-surface",
        className
      )}
    >
      {checked && (
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write `apps/pwa/components/progress-bar.tsx`**

```tsx
import { cn } from "@/lib/classnames";

export function ProgressBar({
  value,
  color = "var(--primary)",
  height = 3,
  width = 80,
  className,
}: {
  value: number; // 0..1
  color?: string;
  height?: number;
  width?: number | string;
  className?: string;
}): JSX.Element {
  const clamped = Math.max(0, Math.min(1, value));
  const widthStyle = typeof width === "number" ? `${width}px` : width;
  return (
    <div
      className={cn("rounded-full overflow-hidden bg-[#EDEFF2]", className)}
      style={{ width: widthStyle, height }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${clamped * 100}%`, background: color }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Write `apps/pwa/components/activity-ring.tsx`** (시안 SVG 그대로)

```tsx
import { cn } from "@/lib/classnames";

interface ActivityRingProps {
  size?: number;
  stroke?: number;
  gap?: number;
  values: [number, number, number]; // 0..1 each
  colors?: [string, string, string];
  centerLabel?: string;
  centerSub?: string;
  className?: string;
}

const DEFAULT_COLORS: [string, string, string] = [
  "var(--ring-input)",
  "var(--ring-build)",
  "var(--ring-share)",
];

export function ActivityRing({
  size = 280,
  stroke = 22,
  gap = 6,
  values,
  colors = DEFAULT_COLORS,
  centerLabel,
  centerSub,
  className,
}: ActivityRingProps): JSX.Element {
  const cx = size / 2;
  const cy = size / 2;
  const rings = values.map((v, i) => {
    const r = cx - stroke / 2 - i * (stroke + gap);
    const circumference = 2 * Math.PI * r;
    const dash = Math.max(circumference * v, v > 0 ? 2 : 0);
    return { r, circumference, dash, color: colors[i] };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("block", className)}
      role="img"
      aria-label={centerLabel ? `Activity ${centerLabel}` : "Activity ring"}
    >
      {rings.map((ring, i) => (
        <circle
          key={`bg-${i}`}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={stroke}
        />
      ))}
      {rings.map((ring, i) => (
        <circle
          key={`fg-${i}`}
          cx={cx}
          cy={cy}
          r={ring.r}
          fill="none"
          stroke={ring.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${ring.dash} ${ring.circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {centerLabel && (
        <g>
          <text
            x={cx}
            y={cy + (centerSub ? 2 : 8)}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight={800}
            fontSize={size * 0.26}
            fill="var(--ink)"
            style={{ letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x={cx}
              y={cy + size * 0.18}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontWeight={600}
              fontSize={size * 0.05}
              fill="var(--muted)"
              style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {centerSub}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
```

- [ ] **Step 6: Write `apps/pwa/vitest.config.ts`** (jsdom + react)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // @vitejs/plugin-react가 .tsx를 처리. devDep 없으면 swc 대안 — 여기선 단순화.
  // 본 plan은 plugin-react 의존을 추가 install로 가정 (Step 7).
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: false,
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 7: Add `@vitejs/plugin-react` to devDependencies + create `tests/setup.ts`**

`apps/pwa/package.json`의 `devDependencies`에 다음 추가:
```json
"@vitejs/plugin-react": "^4.3.1"
```

`apps/pwa/tests/setup.ts`:
```typescript
import "@testing-library/jest-dom/vitest";
```

```bash
pnpm install
```

- [ ] **Step 8: Write failing test `apps/pwa/tests/activity-ring.spec.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ActivityRing } from "@/components/activity-ring";

describe("ActivityRing", () => {
  it("3 rings (bg + fg) 렌더링 — 6 circle", () => {
    const { container } = render(<ActivityRing size={100} stroke={10} gap={4} values={[0.5, 0.0, 0.0]} />);
    expect(container.querySelectorAll("circle")).toHaveLength(6);
  });

  it("centerLabel 텍스트 + centerSub 표시", () => {
    const { getByText } = render(
      <ActivityRing values={[0.16, 0, 0]} centerLabel="16%" centerSub="OVERALL" />
    );
    expect(getByText("16%")).toBeInTheDocument();
    expect(getByText("OVERALL")).toBeInTheDocument();
  });

  it("values=0이면 dash=0 (stroke 미가시)", () => {
    const { container } = render(<ActivityRing size={100} values={[0, 0, 0]} />);
    const fgCircles = container.querySelectorAll("circle:nth-child(n+4)");
    fgCircles.forEach((c) => {
      expect(c.getAttribute("stroke-dasharray")).toMatch(/^0 /);
    });
  });
});
```

- [ ] **Step 9: Run + Commit**

```bash
pnpm --filter @cadence/pwa test activity-ring
```

Expected: 3 PASS.

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/{pill,hairline,checkbox,progress-bar,activity-ring}.tsx apps/pwa/vitest.config.ts apps/pwa/tests apps/pwa/package.json pnpm-lock.yaml
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): atoms (Pill/Hairline/Checkbox/ProgressBar/ActivityRing) + vitest + 3 tests"
```

---

## Task 5: env 변수 + Supabase 클라이언트 (server / browser / middleware)

**Files:**
- Create: `apps/pwa/lib/env.ts`, `apps/pwa/lib/supabase/{server.ts, browser.ts, middleware.ts}`
- Modify: `.env.example` (root)

- [ ] **Step 1: Append to root `.env.example`**

```
# ============================================================
# Plan 04 — apps/pwa (브라우저 노출, anon 권한 + RLS)
# ============================================================

# Supabase Anon key — local dev에서 supabase status로 확인 가능
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

- [ ] **Step 2: Write `apps/pwa/lib/env.ts`** (런타임 검증)

```typescript
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

function parseEnv() {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `[pwa/env] invalid env: ${parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`
    );
  }
  return parsed.data;
}

export const env = parseEnv();
```

- [ ] **Step 3: Write `apps/pwa/lib/supabase/server.ts`** (Server Component / Server Action용)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@cadence/db";
import { env } from "@/lib/env";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 set 호출되면 무시 (middleware가 갱신 담당)
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: Write `apps/pwa/lib/supabase/browser.ts`** (Client Component용)

```typescript
"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@cadence/db";
import { env } from "@/lib/env";

export function getSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

- [ ] **Step 5: Write `apps/pwa/lib/supabase/middleware.ts`** (Auth 세션 갱신)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@cadence/db";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 보호 경로: /today, /sprint
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/today") || path.startsWith("/sprint");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
```

- [ ] **Step 6: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/lib/env.ts apps/pwa/lib/supabase .env.example
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): env 검증 + Supabase server/browser/middleware client (@supabase/ssr)"
```

---

## Task 6: Next.js middleware (보호 경로 + 세션 갱신)

**Files:**
- Create: `apps/pwa/middleware.ts`

- [ ] **Step 1: Write `apps/pwa/middleware.ts`**

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 path는 제외:
     * - _next/static · _next/image (정적 자산)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Smoke check (typecheck)**

```bash
pnpm --filter @cadence/pwa typecheck
```

- [ ] **Step 3: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/middleware.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): Next.js middleware — 세션 갱신 + 보호 경로 redirect"
```

---

## Task 7: Auth callback route + 최소 login page

**Files:**
- Create: `apps/pwa/app/auth/callback/route.ts`, `apps/pwa/app/login/page.tsx`, `apps/pwa/app/login/login-form.tsx`

- [ ] **Step 1: Write `apps/pwa/app/auth/callback/route.ts`** (magiclink → session 교환)

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/today";

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 실패 시 login으로
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
```

- [ ] **Step 2: Write `apps/pwa/app/login/page.tsx`** (server — props만)

```tsx
import { LoginForm } from "./login-form";

export const metadata = { title: "Cadence — Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm bg-surface border border-card-line rounded-md shadow-card p-7">
        <div className="mb-6">
          <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
            Cadence
          </div>
          <h1 className="font-display text-[22px] font-bold tracking-[-0.025em] text-ink">
            로그인
          </h1>
          <p className="text-sm text-muted mt-1">
            이메일로 매직링크를 받습니다.
          </p>
        </div>
        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/pwa/app/login/login-form.tsx`** (Client Component — magiclink 전송)

```tsx
"use client";
import { use, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}): JSX.Element {
  const params = use(searchParams);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    params.error ? "error" : "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(
    params.error ? "인증 콜백 실패. 다시 시도하세요." : null
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    const supabase = getSupabaseBrowserClient();
    const next = params.next ?? "/today";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <p className="text-sm text-ink">
        이메일을 확인하세요. 받은 링크로 다시 돌아오면 자동 로그인됩니다.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink-2">이메일</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 rounded-md border border-card-line bg-surface px-3 text-sm focus:outline-none focus:border-primary"
          placeholder="you@example.com"
        />
      </label>
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "전송 중..." : "매직링크 받기"}
      </Button>
      {errorMsg && (
        <p className="text-xs text-danger">{errorMsg}</p>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Smoke (수동) — `pnpm dev:pwa` 후 `/login`이 렌더되는지**

(자동 검증은 Playwright Task 21에서)

- [ ] **Step 5: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/app/auth apps/pwa/app/login
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): magiclink login + auth/callback (세션 교환)"
```

---

## Task 8: 폰트 (Inter + Pretendard + JetBrains Mono) + 디자인 토큰 마무리

**Files:**
- Modify: `apps/pwa/app/layout.tsx`

> Pretendard는 next/font 직접 미지원 (CDN/self-host) — Inter + JetBrains Mono만 next/font, Pretendard는 CSS @font-face fallback. 시안과 동일하게 stack에서 Inter 우선, Pretendard 다음.

- [ ] **Step 1: Update `apps/pwa/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cadence",
  description: "Personal learning coach",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="ko" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-bg text-ink antialiased font-body">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `globals.css` — 폰트 변수 매핑**

`:root` 블록의 폰트 부분을 다음으로 교체:

```css
  --font-display:     var(--font-inter), 'Pretendard', sans-serif;
  --font-body:        var(--font-inter), 'Pretendard', sans-serif;
  --font-mono:        var(--font-jetbrains), 'JetBrains Mono', monospace;
```

- [ ] **Step 3: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/app/layout.tsx apps/pwa/app/globals.css
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): 폰트 — Inter (next/font) + Pretendard (CDN) + JetBrains Mono"
```

---

## Task 9: 보호 라우트 layout — Sidebar (desktop) + 하단 TabBar (mobile)

**Files:**
- Create: `apps/pwa/app/(app)/layout.tsx`, `apps/pwa/components/{sidebar.tsx, mobile-tabbar.tsx, app-shell.tsx}`

> 시안 Sidebar 그대로 옮김. lg(>=1024px) 이상은 sidebar, 미만은 하단 tab bar. spec §6.3은 768px 기준이지만 시안의 sidebar 220px이 768px에선 좁아 보여 1024px(lg) 사용 — 체감과 시안 양쪽 만족.

- [ ] **Step 1: Write `apps/pwa/components/sidebar.tsx`** (server-safe — active prop 받음)

```tsx
import Link from "next/link";
import { cn } from "@/lib/classnames";

type NavId = "today" | "sprint" | "settings";

const NAV_ITEMS: Array<{ id: NavId; label: string; href: string }> = [
  { id: "today", label: "Today", href: "/today" },
  { id: "sprint", label: "Sprint Progress", href: "/sprint" },
  { id: "settings", label: "Settings", href: "/settings" },
];

function NavIcon({ kind }: { kind: NavId }): JSX.Element {
  const cls = "w-4 h-4 text-muted flex-shrink-0";
  if (kind === "today")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" /><path d="M8 3v4" /><path d="M16 3v4" />
      </svg>
    );
  if (kind === "sprint")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

export function Sidebar({
  active,
  userInitials = "HJ",
  userName = "User",
  sprintLabel = "Sprint 1 · Day 3",
}: {
  active: NavId;
  userInitials?: string;
  userName?: string;
  sprintLabel?: string;
}): JSX.Element {
  return (
    <aside className="hidden lg:flex w-[220px] h-full bg-bg border-r border-hairline flex-col gap-1 px-3.5 py-6">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <div className="w-[22px] h-[22px] rounded-[5px] bg-ink text-white font-display text-xs font-bold flex items-center justify-center">
          C
        </div>
        <span className="font-display text-sm font-bold tracking-[-0.01em]">Cadence</span>
        <span className="ml-auto pill-text bg-primary-soft text-primary border border-[#D6E6FB] px-1.5 py-[2px] rounded-[3px] tracking-[0.1em] text-[9.5px] font-bold">
          ACTIVE
        </span>
      </div>
      <div className="px-2.5 pb-1.5 pt-3 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-sub">
        Workspace
      </div>
      {NAV_ITEMS.map((it) => {
        const selected = it.id === active;
        return (
          <Link
            key={it.id}
            href={it.href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md font-body text-[13.5px]",
              selected
                ? "bg-[#EFF1F4] text-ink font-semibold"
                : "text-ink-2 font-medium hover:bg-[#EFF1F4]/60"
            )}
          >
            <NavIcon kind={it.id} />
            <span>{it.label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <div className="border-t border-hairline mt-3 pt-3 flex items-center gap-2.5 px-2">
        <div className="w-[26px] h-[26px] rounded-full bg-ink text-white font-display text-[11px] font-bold flex items-center justify-center">
          {userInitials}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12.5px] font-semibold text-ink truncate">{userName}</span>
          <span className="text-[11px] text-sub truncate">{sprintLabel}</span>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Write `apps/pwa/components/mobile-tabbar.tsx`**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/classnames";

const TABS = [
  { id: "today", label: "Today", href: "/today" },
  { id: "sprint", label: "Progress", href: "/sprint" },
  { id: "settings", label: "Settings", href: "/settings" },
];

function TabIcon({ kind, active }: { kind: string; active: boolean }): JSX.Element {
  const cls = cn("w-5 h-5", active ? "text-primary" : "text-muted");
  if (kind === "today")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 9h18" /><path d="M8 3v4" /><path d="M16 3v4" />
      </svg>
    );
  if (kind === "sprint")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={cls}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

export function MobileTabbar(): JSX.Element {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-hairline-strong h-14 flex items-stretch"
      aria-label="Mobile navigation"
    >
      {TABS.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5",
              active ? "text-primary" : "text-muted"
            )}
          >
            <TabIcon kind={t.id} active={active} />
            <span className="font-display text-[10px] font-semibold tracking-wide">
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Write `apps/pwa/components/app-shell.tsx`** (RSC wrapper)

```tsx
import { Sidebar } from "./sidebar";
import { MobileTabbar } from "./mobile-tabbar";

type NavId = "today" | "sprint" | "settings";

export function AppShell({
  active,
  topBar,
  children,
}: {
  active: NavId;
  topBar?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex w-full min-h-screen bg-bg">
      <Sidebar active={active} />
      <main className="flex-1 flex flex-col min-w-0 pb-14 lg:pb-0">
        {topBar && (
          <div className="h-14 border-b border-hairline flex items-center px-7 gap-3.5 bg-bg">
            {topBar}
          </div>
        )}
        <div className="flex-1 px-5 lg:px-9 py-6 lg:py-7 overflow-x-hidden">
          {children}
        </div>
      </main>
      <MobileTabbar />
    </div>
  );
}
```

- [ ] **Step 4: Write `apps/pwa/app/(app)/layout.tsx`** (보호된 그룹 레이아웃 — auth 검증)

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  return <>{children}</>;
}
```

- [ ] **Step 5: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/{sidebar,mobile-tabbar,app-shell}.tsx apps/pwa/app/\(app\)/layout.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): app shell — Sidebar (desktop) + MobileTabbar (mobile) + protected layout"
```

---

## Task 10: 날짜 helper (KST) + queries/today.ts (RSC 데이터)

**Files:**
- Create: `apps/pwa/lib/date.ts`, `apps/pwa/lib/queries/today.ts`, `apps/pwa/tests/date.spec.ts`

> Plan 03 `apps/routine/src/utils/tz.ts`와 같은 KST 헬퍼 패턴. 단, PWA에서는 표시 포맷 (`FRI · MAY 1, 2026`, `2026년 5월 1일 금요일`)이 추가 필요.

- [ ] **Step 1: Failing test `apps/pwa/tests/date.spec.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { todayKst, formatKstHeader, formatKstShort, weekIndexFor, dayOfWeekFor } from "@/lib/date";

describe("date helpers", () => {
  it("todayKst — 2026-04-30 23:00 UTC → 2026-05-01", () => {
    vi.setSystemTime(new Date("2026-04-30T23:00:00Z"));
    expect(todayKst()).toBe("2026-05-01");
    vi.useRealTimers();
  });

  it("formatKstHeader — 2026-05-01 → 'FRI · MAY 1, 2026'", () => {
    expect(formatKstHeader("2026-05-01")).toBe("FRI · MAY 1, 2026");
  });

  it("formatKstShort — 2026-05-01 → { headline: '2026년 5월 1일 금요일', shortDow: 'FRI · MAY 1' }", () => {
    const r = formatKstShort("2026-05-01");
    expect(r.headline).toBe("2026년 5월 1일 금요일");
    expect(r.shortDow).toBe("FRI · MAY 1");
  });

  it("weekIndexFor + dayOfWeekFor — Plan 03와 동일", () => {
    expect(weekIndexFor("2026-04-29", "2026-05-01")).toBe(1);
    expect(dayOfWeekFor("2026-05-01")).toBe(4);
  });
});
```

- [ ] **Step 2: Implement `apps/pwa/lib/date.ts`**

```typescript
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nowKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

export function todayKst(): string {
  const k = nowKst();
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

const DOW_EN = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DOW_KO = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
const MONTH_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function dowIndex(date_kst: string): number {
  // Mon=0..Sun=6 — Plan 03 dayOfWeekFor와 동일 알고리즘
  const d = new Date(`${date_kst}T00:00:00+09:00`);
  return (d.getUTCDay() + 6) % 7;
}

export function formatKstHeader(date_kst: string): string {
  // 2026-05-01 → "FRI · MAY 1, 2026"
  const [yyyy, mm, dd] = date_kst.split("-").map(Number);
  const dow = DOW_EN[dowIndex(date_kst)];
  return `${dow} · ${MONTH_EN[mm - 1]} ${dd}, ${yyyy}`;
}

export function formatKstShort(date_kst: string): { headline: string; shortDow: string } {
  // headline: "2026년 5월 1일 금요일", shortDow: "FRI · MAY 1"
  const [yyyy, mm, dd] = date_kst.split("-").map(Number);
  const dowEn = DOW_EN[dowIndex(date_kst)];
  const dowKo = DOW_KO[dowIndex(date_kst)];
  return {
    headline: `${yyyy}년 ${mm}월 ${dd}일 ${dowKo}`,
    shortDow: `${dowEn} · ${MONTH_EN[mm - 1]} ${dd}`,
  };
}

export function weekIndexFor(sprintStart: string, today: string): 1 | 2 | 3 | 4 {
  const start = new Date(`${sprintStart}T00:00:00Z`).getTime();
  const t = new Date(`${today}T00:00:00Z`).getTime();
  const days = Math.floor((t - start) / (24 * 60 * 60 * 1000));
  if (days < 0) throw new Error("today before sprint start");
  if (days >= 28) return 4;
  return (Math.floor(days / 7) + 1) as 1 | 2 | 3 | 4;
}

export function dayOfWeekFor(date_kst: string): number {
  return dowIndex(date_kst);
}

export function dayIndexInSprint(sprintStart: string, today: string): number {
  // 0-based — Day 3 = idx 2
  const start = new Date(`${sprintStart}T00:00:00Z`).getTime();
  const t = new Date(`${today}T00:00:00Z`).getTime();
  return Math.floor((t - start) / (24 * 60 * 60 * 1000));
}
```

- [ ] **Step 3: Run test (PASS) + Commit**

```bash
pnpm --filter @cadence/pwa test date
```

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/lib/date.ts apps/pwa/tests/date.spec.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): KST date helpers + 표시 포맷 + 4 tests"
```

- [ ] **Step 4: Write `apps/pwa/lib/queries/today.ts`** (RSC 데이터 페치)

```typescript
import "server-only";
import type { Tables } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface TodayDataItem {
  id: string;
  slot_key: Tables<"daily_card_items">["slot_key"];
  title: string;
  url: string | null;
  kind: Tables<"daily_card_items">["kind"];
  status: Tables<"daily_card_items">["status"];
  estimated_minutes: number | null;
  auto_target: Tables<"daily_card_items">["auto_target"];
}

export interface TodayData {
  date_kst: string;
  sprint: Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status"> | null;
  card: Pick<Tables<"daily_cards">, "id" | "coach_comment" | "fallback_used"> | null;
  items: TodayDataItem[];
  yesterdaySignals: {
    repo_commits: Record<string, number>;
    fetch_status: string;
  } | null;
}

export async function fetchTodayData(date_kst: string): Promise<TodayData> {
  const supabase = await getSupabaseServerClient();

  // RLS: auth.uid() = user_id 자동 적용
  const { data: sprint } = await supabase
    .from("sprints")
    .select("id, name, start_date_kst, end_date_kst, status")
    .eq("status", "active")
    .order("start_date_kst", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: card } = await supabase
    .from("daily_cards")
    .select("id, coach_comment, fallback_used")
    .eq("date_kst", date_kst)
    .maybeSingle();

  let items: TodayDataItem[] = [];
  if (card) {
    const { data: rows } = await supabase
      .from("daily_card_items")
      .select("id, slot_key, title, url, kind, status, auto_target")
      .eq("daily_card_id", card.id);
    items = (rows ?? []).map((r) => ({
      id: r.id,
      slot_key: r.slot_key,
      title: r.title,
      url: r.url,
      kind: r.kind,
      status: r.status,
      estimated_minutes: null,
      auto_target: r.auto_target,
    }));
  }

  // 어제 신호
  const yesterday = previousDateKst(date_kst);
  const { data: signal } = await supabase
    .from("yesterday_signals")
    .select("repo_commits, fetch_status")
    .eq("date_kst", yesterday)
    .maybeSingle();

  return {
    date_kst,
    sprint,
    card,
    items,
    yesterdaySignals: signal
      ? {
          repo_commits: (signal.repo_commits as Record<string, number>) ?? {},
          fetch_status: signal.fetch_status ?? "ok",
        }
      : null,
  };
}

function previousDateKst(date_kst: string): string {
  const d = new Date(`${date_kst}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 5: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/lib/queries/today.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): queries/today.ts (RSC fetch — sprint/card/items/yesterday_signals)"
```

---

## Task 11: Today 화면 — Header + MiniActivityRing + Coach Comment

**Files:**
- Create: `apps/pwa/components/today/{today-header.tsx, mini-activity-ring.tsx, coach-comment.tsx}`

- [ ] **Step 1: Write `apps/pwa/components/today/today-header.tsx`** (시안 desktop & mobile 양쪽)

```tsx
import { Pill } from "@/components/pill";
import { formatKstHeader, formatKstShort } from "@/lib/date";

export function TodayHeader({
  date_kst,
  sprintName,
  weekIndex,
  dayInSprint,
}: {
  date_kst: string;
  sprintName: string;
  weekIndex: number;
  dayInSprint: number; // 1-based
}): JSX.Element {
  const desktopHeader = formatKstHeader(date_kst);
  const { headline, shortDow } = formatKstShort(date_kst);

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block flex-1">
        <div className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">
          {desktopHeader}
        </div>
        <h1 className="font-display text-[32px] font-bold tracking-[-0.025em] leading-[1.1] text-ink m-0">
          {headline}
        </h1>
        <div className="flex items-center gap-2.5 mt-2.5">
          <Pill variant="blue">Active</Pill>
          <span className="text-[13px] text-muted">Sprint {weekIndex} · {sprintName}</span>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex-1">
        <div className="font-display text-[10px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5">
          {shortDow}
        </div>
        <h1 className="font-display text-[22px] font-bold tracking-[-0.022em] leading-[1.2] text-ink m-0 whitespace-pre-line">
          {headline.split(" ").slice(1, 3).join(" ")}{"\n"}{headline.split(" ").slice(3).join(" ")}
        </h1>
        <div className="flex items-center gap-1.5 mt-2">
          <Pill variant="blue">Active</Pill>
          <Pill variant="default">D{dayInSprint} · W{weekIndex}</Pill>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Write `apps/pwa/components/today/mini-activity-ring.tsx`** (desktop variant — 92px ring + 3 legend)

```tsx
import { ActivityRing } from "@/components/activity-ring";

export function MiniActivityRing({
  values,
  inputRatio,
  buildRatio,
  shareRatio,
}: {
  values: [number, number, number];
  inputRatio: { done: number; total: number };
  buildRatio: { done: number; total: number };
  shareRatio: { done: number; total: number };
}): JSX.Element {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex items-center gap-3.5 px-4 py-3 border border-card-line rounded-md bg-surface">
        <ActivityRing size={92} stroke={9} gap={3} values={values} />
        <div className="flex flex-col gap-1.5 font-display">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-sub">
            오늘의 진행
          </div>
          <Legend color="var(--ring-input)" label={`정독 ${inputRatio.done}/${inputRatio.total}`} active={inputRatio.done > 0} />
          <Legend color="var(--ring-build)" label={`빌드 ${buildRatio.done}/${buildRatio.total}`} active={buildRatio.done > 0} />
          <Legend color="var(--ring-share)" label={`공유 ${shareRatio.done}/${shareRatio.total}`} active={shareRatio.done > 0} />
        </div>
      </div>

      {/* Mobile — 84px */}
      <div className="lg:hidden flex flex-col items-center gap-1">
        <ActivityRing size={84} stroke={8} gap={3} values={values} />
        <div className="font-display text-[9.5px] font-semibold uppercase tracking-[0.1em] text-sub">
          오늘
        </div>
      </div>
    </>
  );
}

function Legend({ color, label, active }: { color: string; label: string; active: boolean }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 text-[12px]">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className={`tab ${active ? "text-ink font-semibold" : "text-muted font-medium"}`}>
        {label}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Write `apps/pwa/components/today/coach-comment.tsx`** (좌측 hairline + sky fill, 그라디언트 X)

```tsx
export function CoachComment({ text, fallbackUsed }: { text: string; fallbackUsed: boolean }): JSX.Element {
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
```

- [ ] **Step 4: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/today
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): today header + mini activity ring + coach comment (sky tint, 좌측 hairline)"
```

---

## Task 12: Today — SlotCard + TaskRowToggle (Server Action 토글)

**Files:**
- Create: `apps/pwa/components/today/{slot-card.tsx, task-row-toggle.tsx, yesterday-signals.tsx}`, `apps/pwa/app/(app)/today/today-card-actions.ts`, `apps/pwa/tests/slot-card.spec.tsx`

- [ ] **Step 1: Write Server Action `apps/pwa/app/(app)/today/today-card-actions.ts`**

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ToggleSchema = z.object({
  item_id: z.string().uuid(),
  next_status: z.enum(["pending", "done", "skipped"]),
});

export type ToggleResult =
  | { ok: true; status: "pending" | "done" | "skipped" }
  | { ok: false; message: string };

export async function toggleItemStatus(
  input: z.infer<typeof ToggleSchema>
): Promise<ToggleResult> {
  const parsed = ToggleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "invalid input" };
  }
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_card_items")
    .update({
      status: parsed.data.next_status,
      status_changed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.item_id)
    .select("status")
    .single();
  if (error || !data) {
    return { ok: false, message: error?.message ?? "update failed" };
  }
  revalidatePath("/today");
  return { ok: true, status: data.status as "pending" | "done" | "skipped" };
}
```

- [ ] **Step 2: Write `apps/pwa/components/today/task-row-toggle.tsx`** (Client — optimistic UI)

```tsx
"use client";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/checkbox";
import { toggleItemStatus, type ToggleResult } from "@/app/(app)/today/today-card-actions";
import { cn } from "@/lib/classnames";

type Status = "pending" | "done" | "skipped" | "auto_done";

export function TaskRowToggle({
  itemId,
  initialStatus,
  title,
  url,
  durationLabel,
  kind,
  isLast,
}: {
  itemId: string;
  initialStatus: Status;
  title: string;
  url: string | null;
  durationLabel: string;
  kind: "manual_check" | "auto_signal";
  isLast: boolean;
}): JSX.Element {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, startTransition] = useTransition();
  const checked = status === "done" || status === "auto_done";
  const interactable = kind === "manual_check";

  function onToggle(): void {
    if (!interactable || pending) return;
    const next: "pending" | "done" = checked ? "pending" : "done";
    const prev = status;
    setStatus(next); // optimistic
    startTransition(async () => {
      const result: ToggleResult = await toggleItemStatus({ item_id: itemId, next_status: next });
      if (!result.ok) {
        setStatus(prev); // rollback
        // Toast 발송은 단순 alert로 fallback (Plan 05에서 useToast hook)
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-alert
          window.alert(`상태 업데이트 실패: ${result.message}`);
        }
      } else {
        setStatus(result.status);
      }
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3.5 px-4 py-3.5",
        !isLast && "border-b border-hairline"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!interactable || pending}
        className="flex-shrink-0 disabled:opacity-60"
        aria-label={checked ? `${title} 완료 취소` : `${title} 완료 처리`}
        aria-pressed={checked}
      >
        <Checkbox checked={checked} />
      </button>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[14px] font-semibold text-ink truncate",
            checked && "line-through decoration-sub"
          )}
        >
          {title}
        </div>
        {url && (
          <div className="text-[12px] text-muted mt-0.5 font-display truncate">
            {stripScheme(url)}
          </div>
        )}
      </div>
      <span className="font-display text-[12px] text-muted tab whitespace-nowrap">
        {durationLabel}
      </span>
    </div>
  );
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
```

- [ ] **Step 3: Write `apps/pwa/components/today/slot-card.tsx`** (server — sub-componenet 받아 렌더)

```tsx
import { Pill } from "@/components/pill";
import { ProgressBar } from "@/components/progress-bar";
import type { TodayDataItem } from "@/lib/queries/today";
import { TaskRowToggle } from "./task-row-toggle";

const SLOT_LABEL: Record<string, { label: string; ringColor: string; ringVar: string }> = {
  weekday_morning_input: {
    label: "Slot 1 · 평일 아침 30분 · 정독",
    ringColor: "var(--ring-input)",
    ringVar: "input",
  },
  weekday_evening_build: {
    label: "Slot 2 · 평일 저녁 1h · 빌드",
    ringColor: "var(--ring-build)",
    ringVar: "build",
  },
  weekend_deep: {
    label: "Slot 3 · 주말 4h · 깊이",
    ringColor: "var(--ring-build)",
    ringVar: "build",
  },
  weekend_share: {
    label: "Slot 4 · 일요일 1.5h · 공유",
    ringColor: "var(--ring-share)",
    ringVar: "share",
  },
};

export function SlotCard({
  slotKey,
  items,
}: {
  slotKey: string;
  items: TodayDataItem[];
}): JSX.Element {
  const meta = SLOT_LABEL[slotKey] ?? {
    label: slotKey,
    ringColor: "var(--ring-input)",
    ringVar: "input",
  };
  const done = items.filter(
    (i) => i.status === "done" || i.status === "auto_done"
  ).length;
  const total = items.length;
  const ratio = total === 0 ? 0 : done / total;
  const hasAuto = items.some((i) => i.kind === "auto_signal");

  return (
    <div className="bg-surface border border-card-line rounded-md">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hairline">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: meta.ringColor }}
        />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
          {meta.label}
        </span>
        {hasAuto && <Pill variant="blue">AUTO · commit ≥ 1 추적</Pill>}
        <div className="flex-1" />
        <span className="font-display text-[12px] font-semibold text-ink tab">
          {done} / {total}
        </span>
        <ProgressBar value={ratio} color={meta.ringColor} width={64} />
      </div>
      {items.map((it, idx) => (
        <TaskRowToggle
          key={it.id}
          itemId={it.id}
          initialStatus={it.status}
          title={it.title}
          url={it.url}
          durationLabel={it.estimated_minutes ? `${it.estimated_minutes}분` : "—"}
          kind={it.kind}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `apps/pwa/components/today/yesterday-signals.tsx`**

```tsx
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
}): JSX.Element {
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
```

- [ ] **Step 5: Failing test `apps/pwa/tests/slot-card.spec.tsx`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { SlotCard } from "@/components/today/slot-card";

vi.mock("@/app/(app)/today/today-card-actions", () => ({
  toggleItemStatus: vi.fn(),
}));

describe("SlotCard", () => {
  it("done count = 1 / total = 2 표시", () => {
    const { getByText } = render(
      <SlotCard
        slotKey="weekday_morning_input"
        items={[
          { id: "a", slot_key: "weekday_morning_input", title: "X", url: null, kind: "manual_check", status: "done", estimated_minutes: 30, auto_target: null },
          { id: "b", slot_key: "weekday_morning_input", title: "Y", url: null, kind: "manual_check", status: "pending", estimated_minutes: 30, auto_target: null },
        ]}
      />
    );
    expect(getByText("1 / 2")).toBeInTheDocument();
  });

  it("auto_signal item이 있으면 AUTO Pill 표시", () => {
    const { getByText } = render(
      <SlotCard
        slotKey="weekday_evening_build"
        items={[
          { id: "a", slot_key: "weekday_evening_build", title: "build", url: null, kind: "auto_signal", status: "pending", estimated_minutes: 60, auto_target: null },
        ]}
      />
    );
    expect(getByText(/AUTO/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run + commit**

```bash
pnpm --filter @cadence/pwa test slot-card
```

Expected: 2 PASS.

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/today apps/pwa/app/\(app\)/today/today-card-actions.ts apps/pwa/tests/slot-card.spec.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): SlotCard + TaskRowToggle (Server Action + optimistic) + YesterdaySignals"
```

---

## Task 13: Today page (RSC 조립)

**Files:**
- Create: `apps/pwa/app/(app)/today/page.tsx`

- [ ] **Step 1: Write `apps/pwa/app/(app)/today/page.tsx`**

```tsx
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/pill";
import { TodayHeader } from "@/components/today/today-header";
import { MiniActivityRing } from "@/components/today/mini-activity-ring";
import { CoachComment } from "@/components/today/coach-comment";
import { SlotCard } from "@/components/today/slot-card";
import { YesterdaySignals } from "@/components/today/yesterday-signals";
import { fetchTodayData } from "@/lib/queries/today";
import { todayKst, weekIndexFor, dayIndexInSprint } from "@/lib/date";

export const dynamic = "force-dynamic"; // RLS-bound 사용자별 데이터, 캐시 X

const SLOT_ORDER = [
  "weekday_morning_input",
  "weekday_evening_build",
  "weekend_deep",
  "weekend_share",
] as const;

export default async function TodayPage(): Promise<JSX.Element> {
  const date_kst = todayKst();
  const data = await fetchTodayData(date_kst);

  if (!data.sprint) {
    return (
      <AppShell active="today">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">활성 Sprint 없음</h1>
          <p className="text-sm text-muted mt-2">
            CLI에서 <code className="font-mono text-primary">cadence init-sprint</code>로 시드한 후
            새로고침하세요.
          </p>
        </div>
      </AppShell>
    );
  }

  if (!data.card) {
    return (
      <AppShell active="today">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">오늘 카드 없음</h1>
          <p className="text-sm text-muted mt-2">
            매일 KST 07:00 Routines가 카드를 생성합니다. 수동:
            <code className="font-mono text-primary mx-1">cadence regen --date {date_kst}</code>
          </p>
        </div>
      </AppShell>
    );
  }

  // 슬롯별 그룹핑
  const itemsBySlot = new Map<string, typeof data.items>();
  for (const it of data.items) {
    const arr = itemsBySlot.get(it.slot_key) ?? [];
    arr.push(it);
    itemsBySlot.set(it.slot_key, arr);
  }

  // Activity Ring 비율 계산
  const inputItems = itemsBySlot.get("weekday_morning_input") ?? [];
  const buildItems = [
    ...(itemsBySlot.get("weekday_evening_build") ?? []),
    ...(itemsBySlot.get("weekend_deep") ?? []),
  ];
  const shareItems = itemsBySlot.get("weekend_share") ?? [];

  function ratio(arr: typeof data.items): { done: number; total: number; r: number } {
    const total = arr.length;
    const done = arr.filter((i) => i.status === "done" || i.status === "auto_done").length;
    return { done, total, r: total === 0 ? 0 : done / total };
  }

  const inputR = ratio(inputItems);
  const buildR = ratio(buildItems);
  const shareR = ratio(shareItems);

  const weekIndex = weekIndexFor(data.sprint.start_date_kst, date_kst);
  const dayInSprint = dayIndexInSprint(data.sprint.start_date_kst, date_kst) + 1;
  const totalDoneCount = inputR.done + buildR.done + shareR.done;
  const totalCount = inputR.total + buildR.total + shareR.total;

  const topBar = (
    <>
      <span className="font-display text-[13px] font-semibold text-muted">Workspace</span>
      <span className="text-sub">/</span>
      <span className="font-display text-[13px] font-semibold text-ink">Today</span>
      <div className="flex-1" />
      <Pill variant="default">Day {dayInSprint} · Week {weekIndex}</Pill>
      <Pill variant="soft">{totalDoneCount} / {totalCount}</Pill>
    </>
  );

  return (
    <AppShell active="today" topBar={topBar}>
      {/* Header row */}
      <div className="flex items-start gap-6 mb-6">
        <TodayHeader
          date_kst={date_kst}
          sprintName={data.sprint.name}
          weekIndex={weekIndex}
          dayInSprint={dayInSprint}
        />
        <MiniActivityRing
          values={[inputR.r, buildR.r, shareR.r]}
          inputRatio={{ done: inputR.done, total: inputR.total }}
          buildRatio={{ done: buildR.done, total: buildR.total }}
          shareRatio={{ done: shareR.done, total: shareR.total }}
        />
      </div>

      <CoachComment text={data.card.coach_comment} fallbackUsed={data.card.fallback_used} />

      <div className="flex flex-col gap-4">
        {SLOT_ORDER.map((slot) => {
          const items = itemsBySlot.get(slot);
          if (!items || items.length === 0) return null;
          return <SlotCard key={slot} slotKey={slot} items={items} />;
        })}

        <YesterdaySignals
          commits={Object.values(data.yesterdaySignals?.repo_commits ?? {}).reduce((a, b) => a + b, 0)}
          inputDone={inputR.done}
          inputTotal={inputR.total}
          buildDone={buildR.done}
        />

        <div className="flex items-center gap-5 text-[13px] text-muted mt-1">
          <Link href="/sprint" className="underline underline-offset-[3px] decoration-[#C7CCD1]">
            Sprint Progress
          </Link>
          <Link href="/settings" className="underline underline-offset-[3px] decoration-[#C7CCD1]">
            Settings
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Smoke (수동) — `pnpm dev:pwa` 후 로그인 → `/today` 렌더 확인**

(자동 검증은 Task 21 Playwright)

- [ ] **Step 3: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/app/\(app\)/today/page.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): /today RSC page (header/ring/coach/slots/signals 조립)"
```

---

## Task 14: queries/sprint.ts (Sprint Progress 데이터)

**Files:**
- Create: `apps/pwa/lib/queries/sprint.ts`

- [ ] **Step 1: Write `apps/pwa/lib/queries/sprint.ts`**

```typescript
import "server-only";
import type { Tables } from "@cadence/db";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface SprintProgressDay {
  date_kst: string;
  done_count: number; // 0,1,2,3+ → cell 등급 (3이상이면 3)
  has_card: boolean;
  is_today: boolean;
}

export interface SprintProgressData {
  sprint: Pick<Tables<"sprints">, "id" | "name" | "start_date_kst" | "end_date_kst" | "status">;
  totals: {
    inputDone: number;
    inputTotal: number;
    buildDone: number;
    buildTotal: number;
    shareDone: number;
    shareTotal: number;
  };
  days: SprintProgressDay[]; // length = 30
  todayIndex: number; // 0-based
}

export async function fetchSprintProgress(date_kst: string): Promise<SprintProgressData | null> {
  const supabase = await getSupabaseServerClient();

  const { data: sprint } = await supabase
    .from("sprints")
    .select("id, name, start_date_kst, end_date_kst, status")
    .eq("status", "active")
    .order("start_date_kst", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sprint) return null;

  // backbone로 total 계산 (slot별 카운트)
  const { data: backbone } = await supabase
    .from("sprint_backbone_items")
    .select("slot_key, week_index, day_of_week_mask")
    .eq("sprint_id", sprint.id)
    .or(`effective_until.is.null,effective_until.gte.${date_kst}`);

  // total은 backbone "예정 occurrence 수" — week × day_mask 비트 계산
  function popcount(n: number): number {
    let c = 0;
    while (n) { c += n & 1; n >>= 1; }
    return c;
  }
  const totals = { input: 0, build: 0, share: 0 };
  for (const b of backbone ?? []) {
    const occurrences = popcount(b.day_of_week_mask ?? 0); // 1주에 X번
    if (b.slot_key === "weekday_morning_input") totals.input += occurrences;
    else if (b.slot_key === "weekday_evening_build" || b.slot_key === "weekend_deep") totals.build += occurrences;
    else if (b.slot_key === "weekend_share") totals.share += occurrences;
  }

  // 30일 카드 일괄 조회
  const { data: cards } = await supabase
    .from("daily_cards")
    .select("id, date_kst")
    .gte("date_kst", sprint.start_date_kst)
    .lte("date_kst", sprint.end_date_kst);

  const cardIds = (cards ?? []).map((c) => c.id);
  let allItems: Array<{ daily_card_id: string; slot_key: string; status: string }> = [];
  if (cardIds.length > 0) {
    const { data: items } = await supabase
      .from("daily_card_items")
      .select("daily_card_id, slot_key, status")
      .in("daily_card_id", cardIds);
    allItems = items ?? [];
  }

  const cardByDate = new Map<string, string>();
  for (const c of cards ?? []) cardByDate.set(c.date_kst, c.id);

  const itemsByCard = new Map<string, typeof allItems>();
  for (const it of allItems) {
    const arr = itemsByCard.get(it.daily_card_id) ?? [];
    arr.push(it);
    itemsByCard.set(it.daily_card_id, arr);
  }

  // sprint days
  const days: SprintProgressDay[] = [];
  const startMs = new Date(`${sprint.start_date_kst}T00:00:00Z`).getTime();
  for (let i = 0; i < 30; i++) {
    const d = new Date(startMs + i * 24 * 60 * 60 * 1000);
    const ymd = d.toISOString().slice(0, 10);
    const cardId = cardByDate.get(ymd);
    const items = cardId ? itemsByCard.get(cardId) ?? [] : [];
    const doneCount = items.filter((i) => i.status === "done" || i.status === "auto_done").length;
    days.push({
      date_kst: ymd,
      done_count: doneCount,
      has_card: !!cardId,
      is_today: ymd === date_kst,
    });
  }

  // 카테고리별 done
  const totalsDone = { input: 0, build: 0, share: 0 };
  for (const it of allItems) {
    if (it.status !== "done" && it.status !== "auto_done") continue;
    if (it.slot_key === "weekday_morning_input") totalsDone.input++;
    else if (it.slot_key === "weekday_evening_build" || it.slot_key === "weekend_deep") totalsDone.build++;
    else if (it.slot_key === "weekend_share") totalsDone.share++;
  }

  const todayIndex = days.findIndex((d) => d.is_today);

  return {
    sprint,
    totals: {
      inputDone: totalsDone.input,
      inputTotal: totals.input,
      buildDone: totalsDone.build,
      buildTotal: totals.build,
      shareDone: totalsDone.share,
      shareTotal: totals.share,
    },
    days,
    todayIndex: todayIndex < 0 ? 0 : todayIndex,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/lib/queries/sprint.ts
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): queries/sprint.ts (30일 days + 카테고리 totals + RLS aggregation)"
```

---

## Task 15: Sprint Progress — SprintHero (Activity Ring 280px + 3 metric cards)

**Files:**
- Create: `apps/pwa/components/sprint/{sprint-hero.tsx, metric-card.tsx}`

- [ ] **Step 1: Write `apps/pwa/components/sprint/metric-card.tsx`**

```tsx
import { ProgressBar } from "@/components/progress-bar";

export function MetricCard({
  color,
  label,
  done,
  total,
}: {
  color: string;
  label: string;
  done: number;
  total: number;
}): JSX.Element {
  const ratio = total === 0 ? 0 : done / total;
  return (
    <div className="flex-1 border border-card-line rounded-data px-4 py-4 flex flex-col gap-2.5 bg-surface">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {label}
        </span>
        <div className="flex-1" />
        <span className="font-display text-[12px] font-semibold tab" style={{ color }}>
          {Math.round(ratio * 100)}%
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display tab font-bold text-[32px] text-ink tracking-[-0.025em]">
          {done}
        </span>
        <span className="font-display tab font-semibold text-[16px] text-sub">/ {total}</span>
      </div>
      <ProgressBar value={ratio} color={color} width="100%" height={3} />
    </div>
  );
}
```

- [ ] **Step 2: Write `apps/pwa/components/sprint/sprint-hero.tsx`**

```tsx
import { ActivityRing } from "@/components/activity-ring";
import { MetricCard } from "./metric-card";

export function SprintHero({
  inputDone,
  inputTotal,
  buildDone,
  buildTotal,
  shareDone,
  shareTotal,
}: {
  inputDone: number;
  inputTotal: number;
  buildDone: number;
  buildTotal: number;
  shareDone: number;
  shareTotal: number;
}): JSX.Element {
  function ratio(done: number, total: number): number {
    return total === 0 ? 0 : done / total;
  }
  const allTotal = inputTotal + buildTotal + shareTotal;
  const allDone = inputDone + buildDone + shareDone;
  const overall = allTotal === 0 ? 0 : allDone / allTotal;

  return (
    <>
      {/* Desktop hero */}
      <div className="hidden lg:flex gap-8 items-stretch border border-card-line rounded-md p-7 bg-surface mb-6">
        <div className="flex items-center justify-center min-w-[280px]">
          <ActivityRing
            size={280}
            stroke={26}
            gap={6}
            values={[ratio(inputDone, inputTotal), ratio(buildDone, buildTotal), ratio(shareDone, shareTotal)]}
            centerLabel={`${Math.round(overall * 100)}%`}
            centerSub="OVERALL"
          />
        </div>
        <div className="flex-1 flex flex-col gap-3.5 justify-center">
          <MetricCard color="var(--ring-input)" label="인풋 · 정독" done={inputDone} total={inputTotal} />
          <MetricCard color="var(--ring-build)" label="빌드 · commit" done={buildDone} total={buildTotal} />
          <MetricCard color="var(--ring-share)" label="공유 · post" done={shareDone} total={shareTotal} />
        </div>
      </div>

      {/* Mobile hero */}
      <div className="lg:hidden border border-card-line rounded-md bg-surface px-3 pt-4 pb-3 mb-3.5 flex flex-col items-center gap-3">
        <ActivityRing
          size={210}
          stroke={20}
          gap={5}
          values={[ratio(inputDone, inputTotal), ratio(buildDone, buildTotal), ratio(shareDone, shareTotal)]}
          centerLabel={`${Math.round(overall * 100)}%`}
          centerSub="OVERALL"
        />
        <div className="w-full grid grid-cols-3 pt-2.5 border-t border-hairline">
          {[
            { color: "var(--ring-input)", label: "인풋", done: inputDone, total: inputTotal },
            { color: "var(--ring-build)", label: "빌드", done: buildDone, total: buildTotal },
            { color: "var(--ring-share)", label: "공유", done: shareDone, total: shareTotal },
          ].map((m, i) => (
            <div
              key={m.label}
              className={`px-2 py-1 flex flex-col gap-1 items-start ${
                i < 2 ? "border-r border-hairline" : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: m.color }} />
                <span className="font-display text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted">
                  {m.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-display tab font-bold text-[18px] text-ink tracking-[-0.02em]">
                  {m.done}
                </span>
                <span className="font-display tab font-semibold text-[11px] text-sub">/{m.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/sprint
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): SprintHero (Activity Ring 280px + 3 metric cards) + mobile variant"
```

---

## Task 16: Sprint Progress — Calendar30 (30일 그리드, 5×7 + 오늘 강조)

**Files:**
- Create: `apps/pwa/components/sprint/calendar-30.tsx`, `apps/pwa/tests/calendar-30.spec.tsx`

- [ ] **Step 1: Failing test `apps/pwa/tests/calendar-30.spec.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Calendar30 } from "@/components/sprint/calendar-30";
import type { SprintProgressDay } from "@/lib/queries/sprint";

function days(todayIdx: number): SprintProgressDay[] {
  return Array.from({ length: 30 }).map((_, i) => ({
    date_kst: `2026-04-${String(29 + i).padStart(2, "0")}`,
    done_count: i === 0 ? 2 : i === 1 ? 3 : 0,
    has_card: i <= 2,
    is_today: i === todayIdx,
  }));
}

describe("Calendar30", () => {
  it("30 cell + 5 trailing = 35 cell 렌더", () => {
    const { container } = render(
      <Calendar30 days={days(2)} todayIndex={2} />
    );
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells.length).toBeGreaterThanOrEqual(30);
  });

  it("today cell은 inset ring border (강조 표시)", () => {
    const { container } = render(<Calendar30 days={days(2)} todayIndex={2} />);
    const todayCell = container.querySelector("[data-today=true]");
    expect(todayCell).not.toBeNull();
  });
});
```

- [ ] **Step 2: Implement `apps/pwa/components/sprint/calendar-30.tsx`**

```tsx
import { Hairline } from "@/components/hairline";
import type { SprintProgressDay } from "@/lib/queries/sprint";
import { cn } from "@/lib/classnames";

const DAY_HEADERS_DESKTOP = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_HEADERS_MOBILE = ["M", "T", "W", "T", "F", "S", "S"];

function cellLevel(done: number): 0 | 1 | 2 | 3 {
  if (done === 0) return 0;
  if (done === 1) return 1;
  if (done === 2) return 2;
  return 3;
}

function cellBg(level: 0 | 1 | 2 | 3): string {
  if (level === 1) return "var(--cell-1)";
  if (level === 2) return "var(--cell-2)";
  if (level === 3) return "var(--cell-3)";
  return "var(--cell-empty)";
}

export function Calendar30({
  days,
  todayIndex,
  daysRemaining,
  paceLabel,
}: {
  days: SprintProgressDay[];
  todayIndex: number;
  daysRemaining?: number;
  paceLabel?: string;
}): JSX.Element {
  const today = days[todayIndex];
  return (
    <div className="border border-card-line rounded-md p-4 lg:p-6 bg-surface">
      <div className="flex items-center mb-3 lg:mb-4">
        <span className="font-display text-[9.5px] lg:text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          30일 진행 · Daily activity
        </span>
        <div className="flex-1" />
        <Legend />
      </div>

      {/* Desktop: W1-W5 row labels + 7-col grid */}
      <div className="hidden lg:flex gap-3">
        <div className="flex flex-col gap-2 pt-1.5">
          {["W1", "W2", "W3", "W4", "W5"].map((w) => (
            <div
              key={w}
              className="h-10 flex items-center font-display text-[10.5px] font-bold tracking-[0.14em] text-sub"
            >
              {w}
            </div>
          ))}
        </div>
        <div
          className="flex-1 grid grid-cols-7 gap-2"
          style={{ gridTemplateRows: "auto repeat(5, 40px)" }}
        >
          {DAY_HEADERS_DESKTOP.map((d) => (
            <div
              key={d}
              className="font-display text-[10px] font-semibold tracking-[0.1em] text-sub uppercase text-center pb-0.5"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, idx) => renderCell(idx, days, todayIndex, "desktop"))}
        </div>
      </div>

      {/* Mobile: 단순 7-col grid */}
      <div className="lg:hidden">
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_HEADERS_MOBILE.map((d, i) => (
            <div key={i} className="font-display text-[9px] font-semibold text-sub text-center pb-0.5">
              {d}
            </div>
          ))}
          {Array.from({ length: 35 }).map((_, idx) => renderCell(idx, days, todayIndex, "mobile"))}
        </div>
      </div>

      <div
        className="mt-4 pt-3.5 border-t border-hairline flex items-center gap-3.5 font-display text-[12px] text-muted"
      >
        <span>
          <span className="text-primary font-bold tab">{todayIndex + 1}</span>일차 ·{" "}
          <span className="text-ink font-semibold">{today ? today.date_kst.slice(5) : "—"}</span>
        </span>
        {daysRemaining !== undefined && (
          <>
            <Hairline vertical className="h-3" />
            <span className="tab">
              남은 일수 <strong className="text-ink">{daysRemaining}</strong>
            </span>
          </>
        )}
        {paceLabel && (
          <>
            <Hairline vertical className="h-3" />
            <span className="tab">
              현재 페이스 <strong className="text-ink">{paceLabel}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function renderCell(
  idx: number,
  days: SprintProgressDay[],
  todayIndex: number,
  variant: "desktop" | "mobile"
): JSX.Element {
  if (idx >= 30) {
    return (
      <div
        key={idx}
        className={cn(
          "rounded-cell opacity-40",
          variant === "mobile" && "aspect-square"
        )}
        style={{ background: "var(--cell-empty)" }}
      />
    );
  }
  const day = days[idx];
  const level = day ? cellLevel(day.done_count) : 0;
  const isToday = idx === todayIndex;
  const isFuture = day && idx > todayIndex && !day.has_card;
  return (
    <div
      key={idx}
      data-cell
      data-today={isToday || undefined}
      className={cn(
        "rounded-cell flex items-center justify-center font-display text-[10px] lg:text-[11px] font-semibold tab",
        variant === "mobile" && "aspect-square"
      )}
      style={{
        background: isToday ? "var(--surface)" : isFuture ? "var(--cell-empty)" : cellBg(level),
        boxShadow: isToday ? "inset 0 0 0 1.5px var(--primary)" : undefined,
        color: isToday
          ? "var(--primary)"
          : level >= 2
            ? "var(--ink)"
            : level === 1
              ? "var(--ink-2)"
              : "var(--sub)",
      }}
    >
      {idx + 1}
    </div>
  );
}

function Legend(): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 lg:gap-2 font-display text-[11px] text-muted">
      <span className="hidden lg:inline">적음</span>
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-empty)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-1)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-2)" }} />
      <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: "var(--cell-3)" }} />
      <span className="hidden lg:inline">많음</span>
    </div>
  );
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @cadence/pwa test calendar-30
```

Expected: 2 PASS.

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/sprint/calendar-30.tsx apps/pwa/tests/calendar-30.spec.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): Calendar30 (5×7 grid + 오늘 강조 + level 0~3 cell)"
```

---

## Task 17: Sprint Progress — Week breakdown (4주 행)

**Files:**
- Create: `apps/pwa/components/sprint/week-breakdown.tsx`

- [ ] **Step 1: Write `apps/pwa/components/sprint/week-breakdown.tsx`**

```tsx
import { ProgressBar } from "@/components/progress-bar";
import type { SprintProgressDay } from "@/lib/queries/sprint";

export function WeekBreakdown({ days }: { days: SprintProgressDay[] }): JSX.Element {
  // 4 주 chunks (28일) — 잔여 2일은 W4에 포함
  const weeks = [0, 1, 2, 3].map((w) => {
    const start = w * 7;
    const end = w === 3 ? 30 : start + 7;
    const slice = days.slice(start, end);
    const totalCells = slice.length;
    const doneCells = slice.filter((d) => d.done_count > 0).length;
    return {
      week: w + 1,
      totalCells,
      doneCells,
      ratio: totalCells === 0 ? 0 : doneCells / totalCells,
      activeDays: slice.filter((d) => d.has_card).length,
    };
  });

  return (
    <div className="border border-card-line rounded-md bg-surface mt-6 lg:mt-6">
      <div className="px-4 lg:px-6 py-3 border-b border-hairline">
        <span className="font-display text-[9.5px] lg:text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          주간 진행 · Week breakdown
        </span>
      </div>
      <div className="divide-y divide-hairline">
        {weeks.map((w) => (
          <div key={w.week} className="px-4 lg:px-6 py-3.5 flex items-center gap-4">
            <span className="font-display text-[11px] font-bold tracking-[0.14em] text-sub w-8">
              W{w.week}
            </span>
            <span className="font-display tab text-[13px] font-semibold text-ink w-12">
              {w.doneCells}/{w.totalCells}
            </span>
            <div className="flex-1">
              <ProgressBar value={w.ratio} color="var(--ring-input)" width="100%" height={3} />
            </div>
            <span className="font-display tab text-[11px] text-muted w-16 text-right">
              {Math.round(w.ratio * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/components/sprint/week-breakdown.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): WeekBreakdown (4주 행 + ratio bar)"
```

---

## Task 18: Sprint Progress page (RSC 조립)

**Files:**
- Create: `apps/pwa/app/(app)/sprint/page.tsx`

- [ ] **Step 1: Write `apps/pwa/app/(app)/sprint/page.tsx`**

```tsx
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/pill";
import { Hairline } from "@/components/hairline";
import { SprintHero } from "@/components/sprint/sprint-hero";
import { Calendar30 } from "@/components/sprint/calendar-30";
import { WeekBreakdown } from "@/components/sprint/week-breakdown";
import { fetchSprintProgress } from "@/lib/queries/sprint";
import { todayKst, dayIndexInSprint } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function SprintPage(): Promise<JSX.Element> {
  const date_kst = todayKst();
  const data = await fetchSprintProgress(date_kst);

  if (!data) {
    return (
      <AppShell active="sprint">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">활성 Sprint 없음</h1>
        </div>
      </AppShell>
    );
  }

  const dayInSprint = dayIndexInSprint(data.sprint.start_date_kst, date_kst) + 1;
  const daysRemaining = Math.max(0, 30 - dayInSprint);

  const topBar = (
    <>
      <span className="font-display text-[13px] font-semibold text-muted">Workspace</span>
      <span className="text-sub">/</span>
      <span className="font-display text-[13px] font-semibold text-ink">Sprint Progress</span>
      <div className="flex-1" />
      <Pill variant="blue">Active</Pill>
      <Pill variant="default">Day {dayInSprint} / 30</Pill>
    </>
  );

  return (
    <AppShell active="sprint" topBar={topBar}>
      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <div className="font-display text-[10px] lg:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-1.5 lg:mb-2">
          SPRINT 01
        </div>
        <h1 className="font-display text-[19px] lg:text-[32px] font-bold tracking-[-0.025em] text-ink m-0 leading-[1.2]">
          {data.sprint.name}
        </h1>
        <div className="flex items-center gap-3 mt-2 text-[11px] lg:text-[13px] text-muted font-display">
          <span className="tab">
            {data.sprint.start_date_kst} → {data.sprint.end_date_kst}
          </span>
          <Hairline vertical className="h-3" />
          <span>30일 스프린트</span>
        </div>
      </div>

      <SprintHero
        inputDone={data.totals.inputDone}
        inputTotal={data.totals.inputTotal}
        buildDone={data.totals.buildDone}
        buildTotal={data.totals.buildTotal}
        shareDone={data.totals.shareDone}
        shareTotal={data.totals.shareTotal}
      />

      <Calendar30
        days={data.days}
        todayIndex={data.todayIndex}
        daysRemaining={daysRemaining}
        paceLabel="—"
      />

      <WeekBreakdown days={data.days} />
    </AppShell>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/app/\(app\)/sprint/page.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): /sprint RSC page (header/hero/calendar30/weekbreakdown)"
```

---

## Task 19: Error / NotFound boundary + Settings stub link

**Files:**
- Create: `apps/pwa/app/error.tsx`, `apps/pwa/app/not-found.tsx`, `apps/pwa/app/(app)/settings/page.tsx`

- [ ] **Step 1: Write `apps/pwa/app/error.tsx`**

```tsx
"use client";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[28px] font-bold text-ink mb-2">문제가 발생했습니다</h1>
        <p className="text-sm text-muted mb-6">{error.message}</p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `apps/pwa/app/not-found.tsx`**

```tsx
import Link from "next/link";

export default function NotFound(): JSX.Element {
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
```

- [ ] **Step 3: Write `apps/pwa/app/(app)/settings/page.tsx`** (Plan 05 자리만 잡기)

```tsx
import { AppShell } from "@/components/app-shell";

export default function SettingsPage(): JSX.Element {
  return (
    <AppShell active="settings">
      <div className="max-w-2xl">
        <h1 className="font-display text-[28px] font-bold text-ink mb-2">Settings</h1>
        <p className="text-sm text-muted">
          GitHub username · Discord webhook · 알림 시간 — Plan 05에서 구현 예정.
        </p>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/app/error.tsx apps/pwa/app/not-found.tsx apps/pwa/app/\(app\)/settings/page.tsx
git -C "C:/Dev/Workspace/cadence" commit -m "feat(pwa): error/not-found boundary + Settings stub (Plan 05 placeholder)"
```

---

## Task 20: ESLint + lint:fix + 전체 typecheck

**Files:**
- Create: `apps/pwa/.eslintrc.json`

- [ ] **Step 1: Write `apps/pwa/.eslintrc.json`**

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off"
  }
}
```

- [ ] **Step 2: Run lint + typecheck (수정 필요 시 반복)**

```bash
pnpm --filter @cadence/pwa lint
pnpm --filter @cadence/pwa typecheck
pnpm --filter @cadence/pwa test
```

Expected: 0 error.

- [ ] **Step 3: Commit (필요 시)**

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/.eslintrc.json
git -C "C:/Dev/Workspace/cadence" commit -m "chore(pwa): ESLint Next.js core-web-vitals + 전체 typecheck PASS"
```

---

## Task 21: Playwright e2e smoke (Today 렌더 + status 토글)

**Files:**
- Create: `apps/pwa/e2e/playwright.config.ts`, `apps/pwa/e2e/today.spec.ts`

> e2e는 **2 케이스만**: (1) login 페이지 렌더, (2) `/today`로 unauth 접근 시 `/login`로 리다이렉트. 실제 magiclink 흐름·DB 시드는 Plan 04 게이트 (Task 22) 수동 검증.

- [ ] **Step 1: Write `apps/pwa/e2e/playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PWA_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter @cadence/pwa dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: Write `apps/pwa/e2e/today.spec.ts`**

```typescript
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
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @cadence/pwa exec playwright install chromium
pnpm --filter @cadence/pwa e2e
```

Expected: 2 PASS.

```bash
git -C "C:/Dev/Workspace/cadence" add apps/pwa/e2e
git -C "C:/Dev/Workspace/cadence" commit -m "test(pwa): Playwright smoke — login 렌더 + /today 미인증 redirect"
```

---

## Task 22: docs/operations/pwa-local.md + README + Plan 04 게이트

**Files:**
- Create: `docs/operations/pwa-local.md`, `apps/pwa/README.md`

- [ ] **Step 1: Write `apps/pwa/README.md`**

```markdown
# @cadence/pwa

Cadence Personal Learning Coach — Next.js 15 App Router PWA.

## Local dev

\`\`\`bash
# 1. Supabase local 가동 (pnpm supabase:start) — Plan 01 참고
# 2. 본인 user 생성 (Studio Auth tab)
# 3. CLI로 Sprint 시드 (apps/cli)
# 4. Routine 또는 cadence regen으로 daily card 1건 생성
# 5. PWA 가동
pnpm dev:pwa
\`\`\`

## env

`.env.local` (apps/pwa 안) 또는 root `.env`:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
\`\`\`

## 화면

- `/today` — 오늘 카드 + Activity Ring + slot/task list + status 토글
- `/sprint` — Sprint 진행 + 30일 캘린더 + 주간 breakdown
- `/login` — magiclink 이메일 로그인

## 디자인 토큰

- spec §6.2 + `docs/design/demos/today-hybrid.html` ground truth
- `app/globals.css` → CSS 변수 정의, `tailwind.config.ts` → Tailwind 매핑
- 안티-AI-slop: 그라디언트 일반 카드 X, 둥근 16~20px 일반 카드 X, 보라색 X

## 테스트

\`\`\`bash
pnpm --filter @cadence/pwa test       # vitest (atoms + queries 단위)
pnpm --filter @cadence/pwa e2e        # Playwright smoke
pnpm --filter @cadence/pwa typecheck
pnpm --filter @cadence/pwa lint
\`\`\`
```

- [ ] **Step 2: Write `docs/operations/pwa-local.md`**

```markdown
# Cadence PWA — 로컬 개발 셋업 (Plan 04)

## 사전 조건

- Plan 01~03 완료 (Supabase + MCP + Routine + CLI)
- pnpm 9.x, Node 20.10+
- Supabase local: `pnpm supabase:start`로 가동 — `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`

## 1. user 시드

Studio (`http://127.0.0.1:54323`) → Authentication → Add user — 본인 이메일 + 임시 비번 (또는 magiclink 자체 발송).

생성된 uuid를 root `.env`의 `COACH_USER_ID`에 넣으면 Routine·CLI에서 사용.

## 2. Sprint + 카드 시드

\`\`\`bash
pnpm cadence init-sprint --from <report.md path> --user $COACH_USER_ID
pnpm tsx apps/routine/src/index.ts   # 매뉴얼 카드 생성
\`\`\`

## 3. PWA 가동

\`\`\`bash
pnpm dev:pwa
# http://localhost:3000 → 로그인 (magiclink는 Studio Auth → Email logs에서 확인)
\`\`\`

## 4. 검증 체크리스트

- [ ] `/login` 페이지 렌더
- [ ] magiclink 발송 후 `/auth/callback?code=...` → `/today` 자동 이동
- [ ] `/today`에 헤더 날짜 + Activity Ring + Coach Comment + slot/task 카드 표시
- [ ] task checkbox 클릭 → status `done` 즉시 반영 (optimistic) + DB 갱신
- [ ] `/sprint`에 Activity Ring 280px + 3 metric card + 30일 calendar
- [ ] mobile viewport (≤ 1024px)에서 sidebar 숨김 + 하단 tabbar 표시

## 5. 트러블슈팅

- magiclink 이메일이 안 옴 → Studio → Authentication → Email logs (local SMTP는 mailcatcher)
- `/today` 빈 화면 → daily card 미생성. `pnpm cadence regen --date <today_kst> --user $COACH_USER_ID`
- 폰트 깨짐 → Pretendard CDN 차단 가능성. 네트워크 OK 확인.
- RLS 거부 → user_id 일치 안 함. user_settings row 직접 INSERT 필요할 수 있음 (Plan 05 Onboarding이 자동화).
```

- [ ] **Step 3: Plan 04 게이트 — 다음 항목 모두 통과**

```bash
pnpm --filter @cadence/pwa typecheck    # 0 error
pnpm --filter @cadence/pwa lint          # 0 error
pnpm --filter @cadence/pwa test          # all PASS
pnpm --filter @cadence/pwa e2e           # 2 PASS
pnpm --filter @cadence/pwa build         # build success
```

수동 검증:
- [ ] 본인 이메일로 magiclink → `/today` 진입 → 카드 + Ring + slot 표시 확인
- [ ] Today에서 checkbox 클릭 → DB `daily_card_items.status` 변경 확인
- [ ] `/sprint`에서 Activity Ring 진행률·30일 grid·Week breakdown 표시 확인
- [ ] DevTools mobile viewport (393×852) — sidebar 숨김 + 하단 tabbar 표시
- [ ] 시안 (`docs/design/demos/today-hybrid.png`)과 시각 비교 — radius/색/간격 어긋남 없음

- [ ] **Step 4: Tag**

```bash
git -C "C:/Dev/Workspace/cadence" add docs/operations/pwa-local.md apps/pwa/README.md
git -C "C:/Dev/Workspace/cadence" commit -m "docs(pwa): 로컬 셋업 가이드 + apps/pwa README"
git -C "C:/Dev/Workspace/cadence" tag plan-04-complete
```

---

## Self-Review

- [x] **Spec coverage**:
  - § 6.1 (6 화면) — Today + Sprint Progress 본 plan, Onboarding/Settings/Today read-only는 Plan 05 명시
  - § 6.2 (디자인 토큰) — Task 2 globals.css + tailwind.config.ts에 1:1 매핑, anti-AI-slop 가드 (그라디언트·둥근 16~20px 일반 카드·보라 금지) 코드에 반영
  - § 6.3 (네비게이션) — Task 9 Sidebar/MobileTabbar (lg 분기, 시안 220px sidebar 그대로)
  - § 4 (데이터 모델) — Task 10/14 queries에서 `daily_cards` / `daily_card_items` / `sprints` / `sprint_backbone_items` / `yesterday_signals` 정확히 사용
  - § 4.3 (RLS) — anon key + `auth.uid()` 자동 RLS, service_role PWA에 노출 X
  - § 6.4 (PWA 설정) — manifest/SW는 Plan 05로 명시 분리

- [x] **Placeholder scan**:
  - Settings page는 Plan 05 placeholder (의도적, Task 19 명시)
  - `paceLabel="—"` Calendar30 — 페이스 계산은 Plan 05 (현재 backbone 일정 vs 실제 진행 비교 로직 필요)
  - Toast 사용 시 상태 업데이트 실패는 alert로 fallback (Task 12) — Plan 05에서 useToast hook으로 교체

- [x] **Type consistency**:
  - `@cadence/db`의 `Tables<"daily_cards">` / `Tables<"daily_card_items">` / `Tables<"sprints">` 일관 사용
  - `Database` 제네릭 supabase client 양쪽(server/browser/middleware)에 적용
  - 모든 `date_kst` string 형식 `YYYY-MM-DD` (Plan 03 utils와 동일)

- [x] **Dependencies**:
  - **상위 plan**: Plan 01 (Supabase tables/RLS) + Plan 03 (`daily_cards` 생성 routine)
  - **하위 plan**: Plan 05 (Onboarding이 user_settings INSERT, Settings 폼, manifest/SW, Today read-only, 페이스 계산)
  - **외부**: `@supabase/ssr` 0.5.x, Next.js 15 App Router, React 19

- [x] **디자인 데모 반영**:
  - 시안 `today-hybrid.html`의 정확한 hex (TOK 객체 1:1) — `globals.css`
  - SVG ActivityRing 알고리즘 그대로 (Task 4 Step 5)
  - Sidebar 220px / 카드 6px radius / metric card 14px radius / cell 8px radius — spec §6.2 + 시안 그대로
  - Coach Comment 좌측 hairline + sky-50 fill — anti-slop 가드 준수
  - 모바일 393px (iPhone 15 Pro 시안) → mobile-tabbar lg breakpoint 분기

- [x] **EXCLUDED 항목 검증**:
  - Onboarding (4-step 폼) → Task 0 (없음). Plan 05.
  - Settings (실제 폼) → Task 19 stub만. Plan 05.
  - Today (read-only / 과거 카드) → 없음. Plan 05.
  - PWA manifest + service worker → 없음. Plan 05 명시.
  - Web push → 없음. D+30.

---

## Plan 04 산출물 요약

- `apps/pwa` — Next.js 15 App Router + React 19 PWA workspace
- 디자인 토큰 (`globals.css` + `tailwind.config.ts`) — spec §6.2 + 시안 1:1
- shadcn/ui Button/Card/Toast + Tailwind 토큰 통합
- Supabase Auth (magiclink) — `@supabase/ssr` server/browser/middleware client + 보호 경로 redirect
- App shell — Sidebar (lg+ 220px) + 하단 TabBar (<lg)
- **Today 화면** — Header + MiniActivityRing + Coach Comment + 4 slot card + status 토글 (Server Action + optimistic) + Yesterday signals
- **Sprint Progress 화면** — SprintHero (Activity Ring 280px + 3 metric card) + Calendar30 (5×7 + 오늘 강조) + WeekBreakdown
- e2e Playwright smoke (login 렌더 + 보호 경로 redirect, 2 case)
- Vitest 단위 테스트 (date · activity-ring · slot-card · calendar-30, 12 case)
- `docs/operations/pwa-local.md` + `apps/pwa/README.md`
- 22 tasks · ~140 steps
- 예상 작업 시간: **30~40h** (Day 12~16) — Next.js 15 / shadcn / RSC 새 학습 시 +5h

**다음**: Plan 05 — Onboarding (4-step) + Settings 폼 + Today read-only (과거 카드) + PWA manifest + service worker + 폴리시·접근성 마무리. Plan 05 완료 = MVP 완전 가동.
