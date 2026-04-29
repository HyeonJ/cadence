-- Cadence v1 — daily_card_items.source_backbone_id (Plan 06 후속)
-- 카드 item이 어떤 backbone에서 파생됐는지 추적해서 PWA 디테일 뷰에서 metadata JOIN 가능.
-- nullable로 추가 — 기존 row는 null로 유지 (best-effort backfill은 별도).

alter table public.daily_card_items
  add column source_backbone_id uuid references public.sprint_backbone_items(id) on delete set null;

create index daily_card_items_source_backbone
  on public.daily_card_items (source_backbone_id);

comment on column public.daily_card_items.source_backbone_id is
  '연결된 sprint_backbone_items.id. NULL = 마이그레이션 전 데이터 또는 매핑 실패.';
