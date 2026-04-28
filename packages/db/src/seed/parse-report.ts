import { z } from "zod";
import type { SlotKey } from "../enums.ts";

export interface BackboneItemSeed {
  week_index: 1 | 2 | 3 | 4;
  slot_key: SlotKey;
  day_of_week_mask: number;
  content: {
    title: string;
    materials: Array<{ name: string; url?: string; source_tag?: string }>;
    targets: string[];
    estimated_minutes: number;
  };
  order_in_week: number;
}

export interface Sprint1ParseResult {
  name: string;
  start_date_kst: string;
  end_date_kst: string;
  evergreen_targets: string[];
  frontier_targets: string[];
  toy_project_repo: string | null;
  backbone_items: BackboneItemSeed[];
}

const DAY_MASK = {
  weekday: 0b0011111, // Mon-Fri = bits 0..4 = 31
  tue_thu_sun: (1 << 1) | (1 << 3) | (1 << 6), // 화·목·일
  saturday: 1 << 5,
  sunday: 1 << 6,
} as const;

function extractMaterial(line: string): { name: string; url?: string; source_tag?: string } {
  // 예: "  - Claude Agent SDK Overview + Quickstart [web §4.1 #1, #2]"
  const sourceTagMatch = line.match(/\[(web|acad|comm|xv)\s+§[^\]]+\]/);
  const urlMatch = line.match(/\((https?:\/\/[^)]+)\)/);
  const cleaned = line
    .replace(/^[\s-]*/, "")
    .replace(/\[(web|acad|comm|xv)\s+§[^\]]+\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*\*/g, "")
    .trim();
  return {
    name: cleaned,
    ...(urlMatch && { url: urlMatch[1] }),
    ...(sourceTagMatch && { source_tag: sourceTagMatch[0] }),
  };
}

function extractListItems(section: string): string[] {
  return section
    .split("\n")
    .filter((l) => /^\s+-\s+/.test(l))
    .map((l) => l.replace(/^\s+-\s+/, "").trim())
    .filter(Boolean);
}

export function parseSprint1(md: string): Sprint1ParseResult {
  // Sprint 1 헤더 추출
  const headerMatch = md.match(
    /Sprint 1\s*\(Day\s*(\d+)~(\d+),\s*(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\)/
  );
  if (!headerMatch) throw new Error("Sprint 1 header not found in markdown");
  const start_date_kst = headerMatch[3];
  const end_date_kst = headerMatch[4];

  // evergreen / frontier targets
  const evergreenMatch = md.match(/목표 evergreen\*?\*?:\s*([^\n]+)/);
  const frontierMatch = md.match(/목표 frontier\*?\*?:\s*([^\n]+)/);
  const evergreen_targets = evergreenMatch
    ? Array.from(evergreenMatch[1].matchAll(/Core\s*(\d+)/g)).map((m) => `core_${m[1]}`)
    : [];
  const frontier_targets = frontierMatch
    ? Array.from(frontierMatch[1].matchAll(/Frontier\s*#?(\d+)/g)).map((m) => `frontier_${m[1]}`)
    : [];

  // W1 자료 (weekday_morning_input)
  const w1Section = md.match(/\*\*자료 W1\*\*:([\s\S]*?)(?=\n-\s+\*\*|$)/);
  const w1Items = w1Section ? extractListItems(w1Section[1]) : [];

  const backbone_items: BackboneItemSeed[] = w1Items.map((line, i) => ({
    week_index: 1 as const,
    slot_key: "weekday_morning_input" as const,
    day_of_week_mask: DAY_MASK.weekday,
    content: {
      title: extractMaterial(line).name,
      materials: [extractMaterial(line)],
      targets: ["core_2", "core_6"],
      estimated_minutes: 30,
    },
    order_in_week: i,
  }));

  // W2~W3 토이 빌드 (weekday_evening_build) — 2주 분 5 entries each
  const w23Match = md.match(/\*\*토이 W2~3\*\*:([^\n]+)/);
  const toyTitle = w23Match
    ? w23Match[1]
        .replace(/\*\*/g, "")
        .replace(/\.$/, "")
        .trim()
    : "MCP 서버 wrapping";

  for (const week_index of [2, 3] as const) {
    backbone_items.push({
      week_index,
      slot_key: "weekday_evening_build",
      day_of_week_mask: DAY_MASK.tue_thu_sun,
      content: {
        title: toyTitle,
        materials: [],
        targets: ["core_2", "core_6", "frontier_1"],
        estimated_minutes: 60,
      },
      order_in_week: 0,
    });
    backbone_items.push({
      week_index,
      slot_key: "weekend_deep",
      day_of_week_mask: DAY_MASK.saturday,
      content: {
        title: `${toyTitle} (deep work)`,
        materials: [],
        targets: ["core_2", "core_6"],
        estimated_minutes: 240,
      },
      order_in_week: 0,
    });
  }

  // W4 산출물 (weekend_share)
  const w4Match = md.match(/\*\*산출물 W4\*\*:([^\n]+)/);
  const w4Title = w4Match
    ? w4Match[1].replace(/\*\*/g, "").replace(/\.$/, "").trim()
    : "W4 산출물 (블로그/PR)";
  backbone_items.push({
    week_index: 4,
    slot_key: "weekend_share",
    day_of_week_mask: DAY_MASK.sunday,
    content: {
      title: w4Title,
      materials: [],
      targets: ["share"],
      estimated_minutes: 90,
    },
    order_in_week: 0,
  });

  return {
    name: "Sprint 1: Agent SDK + MCP",
    start_date_kst,
    end_date_kst,
    evergreen_targets,
    frontier_targets,
    toy_project_repo: null,
    backbone_items,
  };
}
