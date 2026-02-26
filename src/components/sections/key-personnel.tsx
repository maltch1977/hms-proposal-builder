"use client";

import { useState } from "react";
import Image from "next/image";
import { OrgChart } from "@/components/sections/org-chart";
import { PersonnelTable } from "@/components/sections/personnel-table";
import { LibrarySelector } from "@/components/editor/library-selector";
import { AssetLibraryPanel } from "@/components/editor/asset-library-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Library } from "lucide-react";
import type { Tables } from "@/lib/types/database";
import type { KeyPersonnelContent } from "@/lib/types/section";

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
        onClick={() => setPanelOpen(true)}
      >
        <Library className="h-3.5 w-3.5" />
        Manage Team Members
      </Button>
      <AssetLibraryPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        assetType="personnel"
        proposalId={proposalId}
        onSelectionChange={onTeamChange}
      />

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
