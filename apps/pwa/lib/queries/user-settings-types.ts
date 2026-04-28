import type { Tables } from "@cadence/db";

export type UserSettings = Pick<
  Tables<"user_settings">,
  | "user_id"
  | "timezone"
  | "github_username"
  | "monitored_repos"
  | "discord_webhook_url"
  | "notify_schedule"
>;

export interface NotifySlot {
  time: string;
  kind: "today_push" | "tomorrow_preview";
}

export const DEFAULT_NOTIFY_SCHEDULE: NotifySlot[] = [
  { time: "07:00", kind: "today_push" },
  { time: "22:00", kind: "tomorrow_preview" },
];
