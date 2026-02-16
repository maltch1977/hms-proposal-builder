"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { LibrarySelector } from "@/components/editor/library-selector";
import { PolishButton } from "@/components/editor/polish-button";
import type { QAQCContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface QAQCCommissioningProps {
  content: QAQCContent;
  onChange: (content: QAQCContent, changeType?: "human" | "ai") => void;
  sectionTypeId: string;
  libraryItemId: string | null;
  onLibrarySelect: (item: Tables<"library_items">) => void;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function QAQCCommissioning({
  content,
  onChange,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  fieldAttributions,
  fieldHighlights,
}: QAQCCommissioningProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <LibrarySelector
          sectionTypeId={sectionTypeId}
          selectedItemId={libraryItemId}
          onSelect={onLibrarySelect}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Quality Assurance
          </h4>
          <PolishButton
            html={content.quality_assurance || ""}
            onAccept={(polished, ct) => onChange({ ...content, quality_assurance: polished }, ct)}
          />
        </div>
        <AuthoredField attribution={fieldAttributions?.quality_assurance}>
          <RichTextEditor
            content={content.quality_assurance || ""}
            onChange={(html) =>
              onChange({ ...content, quality_assurance: html })
            }
            placeholder="Describe quality assurance procedures..."
            authorHighlights={fieldHighlights?.quality_assurance}
          />
        </AuthoredField>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Quality Control
          </h4>
          <PolishButton
            html={content.quality_control || ""}
            onAccept={(polished, ct) => onChange({ ...content, quality_control: polished }, ct)}
          />
        </div>
        <AuthoredField attribution={fieldAttributions?.quality_control}>
          <RichTextEditor
            content={content.quality_control || ""}
            onChange={(html) =>
              onChange({ ...content, quality_control: html })
            }
            placeholder="Describe quality control procedures..."
            authorHighlights={fieldHighlights?.quality_control}
          />
        </AuthoredField>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Commissioning
          </h4>
          <PolishButton
            html={content.commissioning || ""}
            onAccept={(polished, ct) => onChange({ ...content, commissioning: polished }, ct)}
          />
        </div>
        <AuthoredField attribution={fieldAttributions?.commissioning}>
          <RichTextEditor
            content={content.commissioning || ""}
            onChange={(html) =>
              onChange({ ...content, commissioning: html })
            }
            placeholder="Describe commissioning procedures..."
            authorHighlights={fieldHighlights?.commissioning}
          />
        </AuthoredField>
      </div>
    </div>
  );
}
