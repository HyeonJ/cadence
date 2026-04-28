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
