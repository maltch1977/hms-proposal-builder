"use client";

import { useState, useCallback } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { LibrarySelector } from "@/components/editor/library-selector";
import { PolishButton } from "@/components/editor/polish-button";
import { ContentUploadButton } from "@/components/editor/content-upload-button";
import { AssetLibraryPanel } from "@/components/editor/asset-library-panel";
import { SelectedAssetsSummary } from "@/components/editor/selected-assets-summary";
import { ASSET_CONFIGS } from "@/lib/config/asset-registry";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import type { FirmBackgroundContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface FirmBackgroundProps {
  content: FirmBackgroundContent;
  onChange: (content: FirmBackgroundContent, changeType?: "human" | "ai") => void;
  proposalId: string;
  sectionTypeId: string;
  libraryItemId: string | null;
  onLibrarySelect: (item: Tables<"library_items">) => void;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function FirmBackground({
  content,
  onChange,
  proposalId,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  fieldAttributions,
  fieldHighlights,
}: FirmBackgroundProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<import("@/lib/types/asset-library").AssetItem | null>(null);
  const handleSelectionChange = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handleItemClick = useCallback((item: import("@/lib/types/asset-library").AssetItem) => {
    setEditItem(item);
    setPanelOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">
            Company Narrative
          </h4>
          <div className="flex items-center gap-2">
            <ContentUploadButton
              onAccept={(html, ct) => onChange({ ...content, narrative: html }, ct)}
            />
            <PolishButton
              html={content.narrative || ""}
              onAccept={(polished, ct) => onChange({ ...content, narrative: polished }, ct)}
            />
            <LibrarySelector
              sectionTypeId={sectionTypeId}
              selectedItemId={libraryItemId}
              onSelect={onLibrarySelect}
            />
          </div>
        </div>
        <AuthoredField attribution={fieldAttributions?.narrative}>
          <RichTextEditor
            content={content.narrative || ""}
            onChange={(html) => onChange({ ...content, narrative: html })}
            placeholder="Describe HMS qualifications and experience..."
            authorHighlights={fieldHighlights?.narrative}
          />
        </AuthoredField>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Case Studies
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Select 1-5 past projects to showcase as case studies.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => { setEditItem(null); setPanelOpen(true); }}
        >
          <Library className="h-3.5 w-3.5" />
          Manage Case Studies
        </Button>
        <SelectedAssetsSummary
          config={ASSET_CONFIGS.past_projects}
          proposalId={proposalId}
          refreshKey={refreshKey}
          onItemClick={handleItemClick}
        />
        <AssetLibraryPanel
          open={panelOpen}
          onOpenChange={setPanelOpen}
          assetType="past_projects"
          proposalId={proposalId}
          onSelectionChange={handleSelectionChange}
          initialEditItem={editItem}
        />
      </div>
    </div>
  );
}
