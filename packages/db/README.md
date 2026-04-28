# @cadence/db

Cadence v1 데이터 스키마 (Supabase Postgres) + 시드 유틸.

## Local 셋업

```bash
pnpm supabase:start          # Docker 컨테이너 기동
pnpm supabase:reset          # 0001_init.sql 적용 + seed.sql 실행
pnpm supabase:gen-types      # types.ts 재생성
```

## 테스트

```bash
pnpm --filter @cadence/db test
```

`.env.test`에 `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` 필요. `pnpm supabase status`로 키 확인.

## 시드 사용

```typescript
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { seedSprint1FromMarkdown } from "@cadence/db";

const service = createClient(URL, SERVICE_ROLE_KEY);
const md = await readFile("docs/.../report.md", "utf-8");
const sprintId = await seedSprint1FromMarkdown(service, userId, md);
```

## 테이블 (Plan 01)

- user_settings · sprints · sprint_backbone_items · daily_cards · daily_card_items · yesterday_signals
- 모든 테이블 RLS = `auth.uid() = user_id` (중첩 테이블은 부모 sprint/card 경유)
- KST 정책: `date_kst` 컬럼은 application 레벨 강제

## 다음 단계

Plan 02 (MCP servers)에서 이 패키지의 `Tables`/`InsertTables` 타입을 import하여 도구 구현.
