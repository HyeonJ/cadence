import type { DailyCardResponse } from "./daily-card.ts";

export function validateAgainstBackbone(
  card: DailyCardResponse,
  todayBackboneIds: Set<string>
): void {
  for (const item of card.items) {
    if (!todayBackboneIds.has(item.source_backbone_id)) {
      throw new Error(
        `Hallucination: item.source_backbone_id=${item.source_backbone_id} not in backbone (size=${todayBackboneIds.size})`
      );
    }
  }
}
