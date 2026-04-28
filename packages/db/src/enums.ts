// SLOT KEY — sprint_backbone_items.slot_key + daily_card_items.slot_key
export const SLOT_KEYS = [
  "weekday_morning_input",
  "weekday_evening_build",
  "weekend_deep",
  "weekend_share",
] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export interface SlotDef {
  key: SlotKey;
  label: string;
  defaultMinutes: number;
  daysOfWeek: number[]; // 0=Mon ... 6=Sun
  category: "input" | "build" | "share" | "scan";
}

export const SLOT_DEFS: Readonly<Record<SlotKey, SlotDef>> = Object.freeze({
  weekday_morning_input: {
    key: "weekday_morning_input",
    label: "평일 아침 30분",
    defaultMinutes: 30,
    daysOfWeek: [0, 1, 2, 3, 4],
    category: "input",
  },
  weekday_evening_build: {
    key: "weekday_evening_build",
    label: "평일 저녁 1h",
    defaultMinutes: 60,
    daysOfWeek: [1, 3, 6], // 화·목·일
    category: "build",
  },
  weekend_deep: {
    key: "weekend_deep",
    label: "주말 토 4h",
    defaultMinutes: 240,
    daysOfWeek: [5], // 토
    category: "build",
  },
  weekend_share: {
    key: "weekend_share",
    label: "주말 일 1.5h",
    defaultMinutes: 90,
    daysOfWeek: [6], // 일
    category: "share",
  },
});

// daily_card_items.kind
export const ITEM_KINDS = ["manual_check", "auto_signal"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

// daily_card_items.status
export const ITEM_STATUSES = ["pending", "done", "skipped", "auto_done"] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

// yesterday_signals.fetch_status
export const FETCH_STATUSES = ["ok", "rate_limited", "5xx", "partial"] as const;
export type FetchStatus = (typeof FETCH_STATUSES)[number];

// sprints.status
export const SPRINT_STATUSES = ["active", "completed", "aborted"] as const;
export type SprintStatus = (typeof SPRINT_STATUSES)[number];
