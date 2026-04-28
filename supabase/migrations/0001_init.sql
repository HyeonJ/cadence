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
