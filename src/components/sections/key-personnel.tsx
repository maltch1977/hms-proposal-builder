"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { OrgChart } from "@/components/sections/org-chart";
import { PersonnelTable } from "@/components/sections/personnel-table";
import { LibrarySelector } from "@/components/editor/library-selector";
import { AssetLibraryPanel } from "@/components/editor/asset-library-panel";
import { SelectedAssetsSummary } from "@/components/editor/selected-assets-summary";
import { ASSET_CONFIGS } from "@/lib/config/asset-registry";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";
import type { KeyPersonnelContent } from "@/lib/types/section";
import type { AssetItem } from "@/lib/types/asset-library";

type Personnel = Tables<"personnel">;
type ProposalTeamMember = Tables<"proposal_team_members">;

export interface TeamMemberWithPersonnel extends ProposalTeamMember {
  personnel: Personnel;
}

interface KeyPersonnelProps {
  proposalId: string;
  teamMembers: TeamMemberWithPersonnel[];
  onTeamChange: () => void;
  content?: KeyPersonnelContent;
  onChange?: (content: KeyPersonnelContent) => void;
  sectionTypeId?: string;
  libraryItemId?: string | null;
  onLibrarySelect?: (item: Tables<"library_items">) => void;
}

export function KeyPersonnel({
  proposalId,
  teamMembers,
  onTeamChange,
  content,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
}: KeyPersonnelProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<AssetItem | null>(null);

  const handleSelectionChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
    onTeamChange();
  }, [onTeamChange]);

  const handleItemClick = useCallback((item: AssetItem) => {
    setEditItem(item);
    setPanelOpen(true);
  }, []);

  const handleSetReportsTo = async (memberId: string, parentId: string | null) => {
    const res = await fetch(`/api/proposals/${proposalId}/team-members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: memberId,
        hierarchy_position: parentId ? { parent_id: parentId } : {},
      }),
    });

    if (!res.ok) {
      toast.error("Failed to update hierarchy");
      return;
    }
    onTeamChange();
  };

  return (
    <div className="space-y-6">
      {sectionTypeId && onLibrarySelect && (
        <LibrarySelector
          sectionTypeId={sectionTypeId}
          selectedItemId={libraryItemId ?? null}
          onSelect={onLibrarySelect}
        />
      )}

      {content?.org_chart_image && (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <div className="bg-muted/30 px-4 py-2 border-b border-border/40">
            <p className="text-xs font-medium text-muted-foreground">Organization Chart</p>
          </div>
          <div className="p-4 flex justify-center">
            <Image
              src={content.org_chart_image}
              alt="Organization Chart"
              width={800}
              height={500}
              className="max-w-full h-auto rounded"
              unoptimized
            />
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => { setEditItem(null); setPanelOpen(true); }}
      >
        <Library className="h-3.5 w-3.5" />
        Manage Team Members
      </Button>
      <SelectedAssetsSummary
        config={ASSET_CONFIGS.personnel}
        proposalId={proposalId}
        refreshKey={refreshKey}
        onItemClick={handleItemClick}
      />
      <AssetLibraryPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        assetType="personnel"
        proposalId={proposalId}
        onSelectionChange={handleSelectionChange}
        initialEditItem={editItem}
      />

      {/* Hierarchy editor — define reporting structure for org chart */}
      {teamMembers.length >= 2 && (
        <div className="border-t border-border pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Reporting Structure
          </p>
          <p className="text-xs text-muted-foreground">
            Define who each team member reports to. This drives the org chart layout.
          </p>
          <div className="space-y-1">
            {teamMembers.map((member) => {
              const hp = member.hierarchy_position as { parent_id?: string } | null;
              const currentParentId = hp?.parent_id || "";
              const otherMembers = teamMembers.filter((m) => m.id !== member.id);

              return (
                <div key={member.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="flex-1 min-w-0 truncate font-medium">
                    {member.personnel.full_name}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Select
                    value={currentParentId}
                    onValueChange={(val) =>
                      handleSetReportsTo(member.id, val === "__none__" ? null : val)
                    }
                  >
                    <SelectTrigger className="h-7 w-[160px] text-xs">
                      <SelectValue placeholder="Reports to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">No one (top level)</span>
                      </SelectItem>
                      {otherMembers.map((other) => (
                        <SelectItem key={other.id} value={other.id}>
                          {other.personnel.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {teamMembers.length > 0 && (
        <Tabs defaultValue="orgchart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orgchart">Org Chart</TabsTrigger>
            <TabsTrigger value="table">Personnel Table</TabsTrigger>
          </TabsList>
          <TabsContent value="orgchart" className="mt-4">
            <OrgChart teamMembers={teamMembers} />
          </TabsContent>
          <TabsContent value="table" className="mt-4">
            <PersonnelTable teamMembers={teamMembers} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
