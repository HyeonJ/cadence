# @cadence/routine

매일 아침 7시(KST)에 실행되는 daily card generator 루틴.

## 운영 환경

- 환경변수: root `.env` (production = Cloud Supabase). 테스트는 `.env.test` (로컬 Supabase).
- 실패 시 `DISCORD_ADMIN_WEBHOOK_URL`로 1건 알림 (`[ERROR] cadence-routine: …`).
- PC가 7am KST에 켜져 있어야 카드 생성. PC 꺼짐 시 그날 누락 — 1인 dogfooding 한도 내 수용.
