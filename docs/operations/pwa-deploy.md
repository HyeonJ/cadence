# Cadence PWA — 배포 가이드 (Plan 05 산출 / Plan 06에서 본격 적용)

## 사전 조건

- Supabase Cloud 프로젝트 생성 완료 (Plan 06에서 실시)
- Vercel 계정 + GitHub 연동
- 도메인 (선택 — `cadence.example.com`) — 없어도 vercel.app 서브도메인 OK

## 1. Supabase Cloud 마이그레이션

```bash
# 로컬 → Cloud로 schema/policy push
supabase login
supabase link --project-ref <ref>
supabase db push
```

`packages/db/supabase/migrations/` 의 마이그레이션이 모두 적용. RLS 정책도 함께 적용.

> 주의: `auth.users`에는 본인 user 1명을 Supabase Studio (Cloud) → Auth → Users에서 magiclink로 신규 발송해 생성. user_settings는 PWA Onboarding이 INSERT 하므로 사전 시드 X.

## 2. Vercel project 설정

- Root: `apps/pwa`
- Build command: `pnpm --filter @cadence/pwa build`
- Install command: `pnpm install --frozen-lockfile`
- Framework preset: Next.js
- Node version: 20.10+

### 환경 변수 (Vercel → Settings → Environment Variables)

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (Cloud Project Settings → API → anon public) |

> service_role 키는 PWA에 절대 넣지 말 것. Routine(Plan 03)만 사용.

## 3. Supabase Auth — Site URL + Redirect URL

Cloud Project Settings → Authentication → URL Configuration:
- Site URL: `https://cadence.example.com`
- Redirect URLs: `https://cadence.example.com/auth/callback`

매직링크 이메일이 자동으로 위 URL을 호출.

## 4. PWA 설치 검증 (배포 후)

### iOS Safari
1. https://cadence.example.com 접속 → 로그인 → /today 표시
2. 하단 공유 아이콘 → "홈 화면에 추가" → 아이콘 + 이름 확인
3. 홈 화면 아이콘 탭 → standalone 모드(주소창 없음) + Cadence ink 아이콘

### Android Chrome
1. 첫 방문 시 manifest.beforeinstallprompt → 자동 prompt
2. "설치" 누르면 Cadence가 앱 목록에 표시

### Lighthouse
- DevTools → Lighthouse → Progressive Web App 카테고리 → 점수 ≥ 90 목표
- 주요 체크: manifest 유효 / SW 등록 / theme-color 일치 / icons 192+512 / start_url 응답 200

## 5. Service Worker 검증

DevTools → Application → Service Workers:
- `/sw.js` activated
- Network 탭에서 정적 자산(`/_next/static/*.js`, fonts)은 from ServiceWorker
- `/today`, `/sprint`, Supabase API는 NetworkOnly (cache-first 안 됨)

## 6. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인 magiclink가 localhost로 보냄 | Site URL 미설정 | Step 3 다시 확인 |
| /today에서 빈 화면 | user_settings row 없음 | /onboarding 자동 redirect 동작 확인 |
| iOS 추가 안내가 안 사라짐 | localStorage 차단 | Safari Settings → Privacy → Allow All Cookies |
| SW가 dev에서 안 동작 | `disable: NODE_ENV !== "production"` 의도 | `pnpm build && pnpm start`로 검증 |
| 빌드 시 sharp 에러 | SVG → PNG 단계 별도 도구 필요 | Plan 05 Task 15 옵션 A/B/C 참고 |

## 7. Plan 06 (실 배포)에서 추가될 항목

- 도메인 + DNS 설정 (Vercel custom domain)
- 데이터 export (Settings → 다운로드)
- 실제 계정 삭제 (auth.users + cascade)
- 운영 알림 (Discord webhook으로 build 실패/Routine 실패)
