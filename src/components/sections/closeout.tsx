"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { LibrarySelector } from "@/components/editor/library-selector";
import { PolishButton } from "@/components/editor/polish-button";
import { ContentUploadButton } from "@/components/editor/content-upload-button";
import type { CloseoutContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface CloseoutProps {
  content: CloseoutContent;
  onChange: (content: CloseoutContent, changeType?: "human" | "ai") => void;
  sectionTypeId: string;
  libraryItemId: string | null;
  onLibrarySelect: (item: Tables<"library_items">) => void;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function Closeout({
  content,
  onChange,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  fieldAttributions,
  fieldHighlights,
}: CloseoutProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Describe project closeout and warranty procedures.
        </p>
        <div className="flex items-center gap-2">
          <ContentUploadButton
            onAccept={(html, ct) => onChange({ ...content, body: html }, ct)}
          />
          <PolishButton
            html={content.body || ""}
            onAccept={(polished, ct) => onChange({ ...content, body: polished }, ct)}
          />
          <LibrarySelector
            sectionTypeId={sectionTypeId}
            selectedItemId={libraryItemId}
            onSelect={onLibrarySelect}
          />
        </div>
      </div>
      <AuthoredField attribution={fieldAttributions?.body}>
        <RichTextEditor
          content={content.body || ""}
          onChange={(html) => onChange({ ...content, body: html })}
          placeholder="Describe closeout procedures, warranty terms, and final deliverables..."
          authorHighlights={fieldHighlights?.body}
        />
      </AuthoredField>
    </div>
  );
}
