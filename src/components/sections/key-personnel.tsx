"use client";

import Image from "next/image";
import { TeamSelector } from "@/components/sections/team-selector";
import { OrgChart } from "@/components/sections/org-chart";
import { PersonnelTable } from "@/components/sections/personnel-table";
import { LibrarySelector } from "@/components/editor/library-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <TeamSelector
        proposalId={proposalId}
        selectedMembers={teamMembers}
        onTeamChange={onTeamChange}
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
