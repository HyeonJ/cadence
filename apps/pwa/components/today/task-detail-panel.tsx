"use client";
import * as React from "react";
import type { TodayDataItem } from "@/lib/queries/today";
import { StudyGuidePanel } from "./study-guide-panel";
import { MetadataPanel, NoteSection } from "./metadata-panel";

export function TaskDetailPanel({
  item,
  noteInput,
  onNoteChange,
  onNoteSave,
  notePending,
  noteFeedback,
  readOnly = false,
}: {
  item: TodayDataItem;
  noteInput: string;
  onNoteChange: (v: string) => void;
  onNoteSave: () => void;
  notePending: boolean;
  noteFeedback: string | null;
  readOnly?: boolean;
}): React.JSX.Element {
  const guide = item.backbone?.study_guide;

  if (!guide) {
    return (
      <MetadataPanel
        item={item}
        noteInput={noteInput}
        onNoteChange={onNoteChange}
        onNoteSave={onNoteSave}
        notePending={notePending}
        noteFeedback={noteFeedback}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="bg-bg border-t border-hairline">
      <StudyGuidePanel guide={guide} url={item.url} />
      <div className="px-4 pb-4">
        <NoteSection
          itemId={item.id}
          noteInput={noteInput}
          onNoteChange={onNoteChange}
          onNoteSave={onNoteSave}
          notePending={notePending}
          noteFeedback={noteFeedback}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
