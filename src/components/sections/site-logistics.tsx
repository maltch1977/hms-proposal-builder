"use client";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { LibrarySelector } from "@/components/editor/library-selector";
import { PolishButton } from "@/components/editor/polish-button";
import { ContentUploadButton } from "@/components/editor/content-upload-button";
import { EmrTable } from "@/components/sections/emr-table";
import type { SiteLogisticsContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface SiteLogisticsProps {
  content: SiteLogisticsContent;
  onChange: (content: SiteLogisticsContent, changeType?: "human" | "ai") => void;
  sectionTypeId: string;
  libraryItemId: string | null;
  onLibrarySelect: (item: Tables<"library_items">) => void;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function SiteLogistics({
  content,
  onChange,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  fieldAttributions,
  fieldHighlights,
}: SiteLogisticsProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Safety & Logistics Narrative
          </h4>
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
            placeholder="Describe site logistics and safety procedures..."
            authorHighlights={fieldHighlights?.body}
          />
        </AuthoredField>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Experience Modification Rating (EMR)
        </h4>
        <EmrTable />
      </div>
    </div>
  );
}
