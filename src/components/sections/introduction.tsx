"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { LibrarySelector } from "@/components/editor/library-selector";
import { PolishButton } from "@/components/editor/polish-button";
import type { IntroductionContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface IntroductionProps {
  content: IntroductionContent;
  onChange: (content: IntroductionContent, changeType?: "human" | "ai") => void;
  sectionTypeId: string;
  libraryItemId: string | null;
  onLibrarySelect: (item: Tables<"library_items">) => void;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function Introduction({
  content,
  onChange,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  fieldAttributions,
  fieldHighlights,
}: IntroductionProps) {
  return (
    <AuthoredField
      attribution={fieldAttributions?.body}
      actions={
        <>
          <PolishButton
            html={content.body || ""}
            onAccept={(polished, ct) => onChange({ ...content, body: polished }, ct)}
          />
          <LibrarySelector
            sectionTypeId={sectionTypeId}
            selectedItemId={libraryItemId}
            onSelect={onLibrarySelect}
          />
        </>
      }
    >
      <RichTextEditor
        content={content.body || ""}
        onChange={(html) => onChange({ ...content, body: html })}
        placeholder="Write your introduction..."
        authorHighlights={fieldHighlights?.body}
      />
    </AuthoredField>
  );
}
