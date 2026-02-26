"use client";

import { useState, useCallback } from "react";
import { AssetLibraryPanel } from "@/components/editor/asset-library-panel";
import { SelectedAssetsSummary } from "@/components/editor/selected-assets-summary";
import { ASSET_CONFIGS } from "@/lib/config/asset-registry";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";

interface ReferenceCheckProps {
  proposalId: string;
}

export function ReferenceCheck({ proposalId }: ReferenceCheckProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSelectionChange = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Select references from your organization&apos;s reference roster. These
        contacts will be listed in the proposal for the client to verify.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setPanelOpen(true)}
      >
        <Library className="h-3.5 w-3.5" />
        Manage References
      </Button>
      <SelectedAssetsSummary
        config={ASSET_CONFIGS.references}
        proposalId={proposalId}
        refreshKey={refreshKey}
      />
      <AssetLibraryPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        assetType="references"
        proposalId={proposalId}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
}
