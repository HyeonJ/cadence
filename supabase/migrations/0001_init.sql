-- Cadence v1 initial schema (Plan 01)
-- Generated 2026-04-28
-- Spec ref: docs/superpowers/specs/2026-04-28-cadence-design.md §4
-- KST policy: all `date_kst` columns store KST calendar day; application enforces TZ.

set check_function_bodies = off;

-- Extensions used
create extension if not exists "pgcrypto";   -- gen_random_uuid
create extension if not exists "uuid-ossp";  -- legacy UUID helpers if needed

-- Helper: validate slot_key string against TS-managed enum
-- (CHECK constraints inline; no separate Postgres ENUM type to allow easier migration)

-- ======================================================================
-- user_settings
-- ======================================================================
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notify_schedule jsonb not null default '[]'::jsonb,
  -- example: [{"time":"07:00","kind":"today_push"},{"time":"22:00","kind":"tomorrow_preview"}]
  discord_webhook_url text,
  github_username text,
  monitored_repos text[] not null default array[]::text[],
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notify_schedule_is_array check (jsonb_typeof(notify_schedule) = 'array')
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_touch
before update on public.user_settings
for each row execute function public.touch_updated_at();

alter table public.user_settings enable row level security;

create policy user_settings_select_own on public.user_settings
  for select using (auth.uid() = user_id);
create policy user_settings_insert_own on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy user_settings_update_own on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy user_settings_delete_own on public.user_settings
  for delete using (auth.uid() = user_id);

-- ======================================================================
-- sprints
-- ======================================================================
create table public.sprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  start_date_kst date not null,
  end_date_kst date not null,
  status text not null default 'active'
    check (status in ('active','completed','aborted')),
  source_md_path text,
  evergreen_targets text[] not null default array[]::text[],
  frontier_targets text[] not null default array[]::text[],
  toy_project_repo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sprint_dates_ordered check (start_date_kst <= end_date_kst)
);

create trigger sprints_touch
before update on public.sprints
for each row execute function public.touch_updated_at();

create unique index sprints_user_active_unique
  on public.sprints (user_id) where status = 'active';
-- 한 user당 active sprint 1개만

alter table public.sprints enable row level security;

create policy sprints_select_own on public.sprints
  for select using (auth.uid() = user_id);
create policy sprints_insert_own on public.sprints
  for insert with check (auth.uid() = user_id);
create policy sprints_update_own on public.sprints
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sprints_delete_own on public.sprints
  for delete using (auth.uid() = user_id);

-- ======================================================================
-- sprint_backbone_items
-- ======================================================================
create table public.sprint_backbone_items (
  id uuid primary key default gen_random_uuid(),
  sprint_id uuid not null references public.sprints (id) on delete cascade,
  week_index int not null check (week_index between 1 and 4),
  slot_key text not null check (slot_key in (
    'weekday_morning_input','weekday_evening_build','weekend_deep','weekend_share'
  )),
  day_of_week_mask int not null check (day_of_week_mask between 1 and 127),
  content jsonb not null,
  order_in_week int not null default 0,
  effective_from date not null,
  effective_until date,
  created_at timestamptz not null default now(),
  constraint sbi_content_is_object check (jsonb_typeof(content) = 'object'),
  constraint sbi_effective_range check (
    effective_until is null or effective_until > effective_from
  )
);
comment on column public.sprint_backbone_items.effective_from is 'KST calendar day. App-level enforcement.';
comment on column public.sprint_backbone_items.effective_until is 'KST calendar day. NULL = open-ended.';

create index sbi_sprint_week_slot
  on public.sprint_backbone_items (sprint_id, week_index, slot_key);

alter table public.sprint_backbone_items enable row level security;

create policy sbi_select on public.sprint_backbone_items
  for select using (
    exists (select 1 from public.sprints s
            where s.id = sprint_id and s.user_id = auth.uid())
  );
create policy sbi_insert on public.sprint_backbone_items
  for insert with check (
    exists (select 1 from public.sprints s
            where s.id = sprint_id and s.user_id = auth.uid())
  );
create policy sbi_update on public.sprint_backbone_items
  for update using (
    exists (select 1 from public.sprints s
            where s.id = sprint_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.sprints s
            where s.id = sprint_id and s.user_id = auth.uid())
  );
create policy sbi_delete on public.sprint_backbone_items
  for delete using (
    exists (select 1 from public.sprints s
            where s.id = sprint_id and s.user_id = auth.uid())
  );

-- ======================================================================
-- daily_cards
-- ======================================================================
create table public.daily_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_kst date not null,
  sprint_id uuid not null references public.sprints (id) on delete cascade,
  generated_at timestamptz not null default now(),
  coach_comment text,
  fallback_used boolean not null default false,
  generation_meta jsonb not null default '{}'::jsonb,
  -- {llm_model, input_tokens, output_tokens, cache_read_tokens, fetch_status, prompt_hash}
  card_raw jsonb,
  unique (user_id, date_kst)
);
comment on column public.daily_cards.date_kst is 'KST calendar day. App-level TZ enforcement.';

create index daily_cards_user_date on public.daily_cards (user_id, date_kst desc);

alter table public.daily_cards enable row level security;

create policy daily_cards_select_own on public.daily_cards
  for select using (auth.uid() = user_id);
create policy daily_cards_insert_own on public.daily_cards
  for insert with check (auth.uid() = user_id);
create policy daily_cards_update_own on public.daily_cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy daily_cards_delete_own on public.daily_cards
  for delete using (auth.uid() = user_id);

-- ======================================================================
-- daily_card_items
-- ======================================================================
create table public.daily_card_items (
  id uuid primary key default gen_random_uuid(),
  daily_card_id uuid not null references public.daily_cards (id) on delete cascade,
  slot_key text not null check (slot_key in (
    'weekday_morning_input','weekday_evening_build','weekend_deep','weekend_share'
  )),
  title text not null,
  url text,
  kind text not null check (kind in ('manual_check','auto_signal')),
  auto_target jsonb,
  -- {type:'commit_count', repo:'owner/name', min:1}
  status text not null default 'pending'
    check (status in ('pending','done','skipped','auto_done')),
  status_changed_at timestamptz not null default now(),
  auto_detected boolean not null default false,
  note text,
  constraint note_length check (note is null or char_length(note) <= 500),
  constraint auto_target_required_for_auto check (
    (kind = 'auto_signal' and auto_target is not null)
    or (kind = 'manual_check')
  )
);

create index daily_card_items_card on public.daily_card_items (daily_card_id);

alter table public.daily_card_items enable row level security;

create policy dci_select on public.daily_card_items
  for select using (
    exists (select 1 from public.daily_cards c
            where c.id = daily_card_id and c.user_id = auth.uid())
  );
create policy dci_insert on public.daily_card_items
  for insert with check (
    exists (select 1 from public.daily_cards c
            where c.id = daily_card_id and c.user_id = auth.uid())
  );
create policy dci_update on public.daily_card_items
  for update using (
    exists (select 1 from public.daily_cards c
            where c.id = daily_card_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.daily_cards c
            where c.id = daily_card_id and c.user_id = auth.uid())
  );
create policy dci_delete on public.daily_card_items
  for delete using (
    exists (select 1 from public.daily_cards c
            where c.id = daily_card_id and c.user_id = auth.uid())
  );

-- ======================================================================
-- yesterday_signals
-- ======================================================================
create table public.yesterday_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date_kst date not null,
  github_events_count int not null default 0,
  repo_commits jsonb not null default '{}'::jsonb,
  -- { 'owner/repo': 3 }
  blog_new_posts int not null default 0,
  fetch_status text not null
    check (fetch_status in ('ok','rate_limited','5xx','partial')),
  fetch_error text,
  rate_limit_remaining int,
  raw jsonb,
  fetched_at timestamptz not null default now(),
  unique (user_id, date_kst)
);
comment on column public.yesterday_signals.date_kst is 'KST calendar day for which signals were collected.';

create index yesterday_signals_user_date on public.yesterday_signals (user_id, date_kst desc);

alter table public.yesterday_signals enable row level security;

create policy ys_select_own on public.yesterday_signals
  for select using (auth.uid() = user_id);
create policy ys_insert_own on public.yesterday_signals
  for insert with check (auth.uid() = user_id);
create policy ys_update_own on public.yesterday_signals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ys_delete_own on public.yesterday_signals
  for delete using (auth.uid() = user_id);

