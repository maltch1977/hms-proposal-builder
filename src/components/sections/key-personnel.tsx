"use client";

import { useState, useCallback } from "react";
import { OrgChart } from "@/components/sections/org-chart";
import { PersonnelBioCard } from "@/components/sections/personnel-bio-card";
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
import { FileUpload } from "@/components/editor/file-upload";
import { Library, ChevronRight, ChevronDown, ListChecks, Upload, GitBranch } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";
import type { KeyPersonnelContent } from "@/lib/types/section";
import type { RFPRequirement } from "@/lib/ai/types";
import type { AssetItem } from "@/lib/types/asset-library";

type Personnel = Tables<"personnel">;
type ProposalTeamMember = Tables<"proposal_team_members">;

const DEFAULT_ORG_CHART_URL = "/images/hms_org_chart.png";

export interface TeamMemberWithPersonnel extends ProposalTeamMember {
  personnel: Personnel;
}

/* Collapsible read-only block showing RFP requirements as reference */
function RFPReferenceBlock({ requirements }: { requirements: RFPRequirement[] }) {
  const [open, setOpen] = useState(false);
  if (requirements.length === 0) return null;

  return (
    <div className="border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ListChecks className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">RFP Requirements ({requirements.length})</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5">
          <p className="text-xs text-muted-foreground italic">
            Address these in each person&apos;s bio narrative.
          </p>
          <ul className="space-y-1">
            {requirements.map((r) => (
              <li key={r.id} className="flex gap-2 text-xs text-foreground/80">
                <span className="text-muted-foreground shrink-0">&#8226;</span>
                <span>{r.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
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
  rfpRequirements?: RFPRequirement[];
}

export function KeyPersonnel({
  proposalId,
  teamMembers,
  onTeamChange,
  content,
  onChange,
  sectionTypeId,
  libraryItemId,
  onLibrarySelect,
  rfpRequirements = [],
}: KeyPersonnelProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editItem, setEditItem] = useState<AssetItem | null>(null);
  const orgChartMode = content?.org_chart_mode || "upload";
  // Only treat as "custom" if it's a real uploaded URL, not the old default or static path
  const hasCustomOrgChart = !!(
    content?.org_chart_image &&
    !content.org_chart_image.startsWith("/images/")
  );

  const handleSaveToLibrary = useCallback(async (personnelId: string, bio: string) => {
    try {
      const res = await fetch(`/api/personnel/${personnelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      if (!res.ok) throw new Error();
      toast.success("Bio saved to library");
    } catch {
      toast.error("Failed to save bio to library");
    }
  }, []);

  const handleOrgChartUpload = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "proposal-files");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const { url } = await res.json();
    onChange?.({ ...content, org_chart_image: url });
    return url;
  }, [content, onChange]);

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

      {/* Organization Chart */}
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Organization Chart
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={orgChartMode === "upload" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onChange?.({ ...content, org_chart_mode: "upload" })}
          >
            <Upload className="h-3 w-3" />
            Upload Org Chart
          </Button>
          <Button
            variant={orgChartMode === "hierarchy" ? "default" : "outline"}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => onChange?.({ ...content, org_chart_mode: "hierarchy" })}
          >
            <GitBranch className="h-3 w-3" />
            Build from Team
          </Button>
        </div>

        {orgChartMode === "upload" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Using company org chart. Upload a replacement below if needed for this proposal.
            </p>
            <FileUpload
              accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
              onUpload={handleOrgChartUpload}
              currentFileUrl={hasCustomOrgChart ? content?.org_chart_image || null : null}
              currentFileName="Custom Org Chart"
              onRemove={() => onChange?.({ ...content, org_chart_image: undefined })}
              label="Upload replacement org chart"
            />
          </div>
        ) : (
          teamMembers.length >= 2 && (
            <div className="space-y-2">
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
          )
        )}
      </div>

      {teamMembers.length > 0 && (
        <>
          {orgChartMode === "upload" ? (
            <div className="flex justify-center py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hasCustomOrgChart ? content!.org_chart_image! : DEFAULT_ORG_CHART_URL}
                alt="Organization Chart"
                className="max-w-full max-h-[400px] object-contain rounded-lg border border-border"
              />
            </div>
          ) : orgChartMode === "hierarchy" ? (
            <OrgChart teamMembers={teamMembers} />
          ) : null}

          <div className="border-t border-border pt-6 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Personnel Bios
            </p>
            <RFPReferenceBlock requirements={rfpRequirements} />
            {teamMembers.map((member) => {
              const proposalBio = content?.member_bios?.[member.personnel_id];
              // undefined (key missing) → falls back to library bio
              // "" (explicitly cleared) → stays empty
              const isLibraryFallback = proposalBio === undefined && !!member.personnel.bio;
              const bioValue = proposalBio ?? member.personnel.bio ?? "";

              return (
                <PersonnelBioCard
                  key={member.id}
                  member={member}
                  bio={bioValue}
                  onBioChange={(html) => {
                    onChange?.({
                      ...content,
                      member_bios: {
                        ...(content?.member_bios || {}),
                        [member.personnel_id]: html,
                      },
                    });
                  }}
                  isLibraryFallback={isLibraryFallback}
                  onSaveToLibrary={() => {
                    const currentBio = content?.member_bios?.[member.personnel_id] ?? bioValue;
                    handleSaveToLibrary(member.personnel_id, currentBio);
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
