"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SectionWithType } from "@/lib/hooks/use-proposal";
import type { Tables } from "@/lib/types/database";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";
import { SECTION_SLUGS } from "@/lib/utils/constants";
import { CoverPage } from "@/components/sections/cover-page";
import { Introduction } from "@/components/sections/introduction";
import { TableOfContents } from "@/components/sections/table-of-contents";
import { FirmBackground } from "@/components/sections/firm-background";
import { KeyPersonnel } from "@/components/sections/key-personnel";
import { ProjectSchedule } from "@/components/sections/project-schedule";
import { SiteLogistics } from "@/components/sections/site-logistics";
import { QAQCCommissioning } from "@/components/sections/qaqc-commissioning";
import { Closeout } from "@/components/sections/closeout";
import { ReferenceCheck } from "@/components/sections/reference-check";
import { InterviewPanel } from "@/components/sections/interview-panel";
import { ProjectCost } from "@/components/sections/project-cost";
import { ExecutiveSummary } from "@/components/sections/executive-summary";
import type {
  CoverPageContent,
  IntroductionContent,
  FirmBackgroundContent,
  KeyPersonnelContent,
  ProjectScheduleContent,
  SiteLogisticsContent,
  QAQCContent,
  CloseoutContent,
  ExecutiveSummaryContent,
} from "@/lib/types/section";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface SectionRendererProps {
  section: SectionWithType;
  sections: SectionWithType[];
  onUpdateContent: (content: Record<string, unknown>, changeType?: "human" | "ai") => void;
  onUpdateSection: (updates: { content?: Record<string, unknown>; library_item_id?: string | null }) => void;
  proposalId: string;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function SectionRenderer({
  section,
  sections,
  onUpdateContent,
  onUpdateSection,
  proposalId,
  fieldAttributions = {},
  fieldHighlights = {},
}: SectionRendererProps) {
  const slug = section.section_type.slug;
  const content = (section.content || {}) as Record<string, unknown>;
  const sectionId = section.id;
  const sectionTypeId = section.section_type_id;
  const libraryItemId = section.library_item_id;

  // Extract field attributions for this section
  const sectionFieldAttributions = useMemo(() => {
    const result: Record<string, FieldAttribution> = {};
    const prefix = `${sectionId}:`;
    for (const key in fieldAttributions) {
      if (key.startsWith(prefix)) {
        result[key.slice(prefix.length)] = fieldAttributions[key];
      }
    }
    return result;
  }, [sectionId, fieldAttributions]);

  // Extract highlight segments for this section
  const sectionHighlights = useMemo(() => {
    const result: Record<string, AttributedSegment[]> = {};
    const prefix = `${sectionId}:`;
    for (const key in fieldHighlights) {
      if (key.startsWith(prefix)) {
        result[key.slice(prefix.length)] = fieldHighlights[key];
      }
    }
    return result;
  }, [sectionId, fieldHighlights]);

  // Team members state for Key Personnel section
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPersonnel[]>([]);
  const supabase = createClient();

  const fetchTeamMembers = useCallback(async () => {
    const { data } = await supabase
      .from("proposal_team_members")
      .select("*, personnel:personnel(*)")
      .eq("proposal_id", proposalId)
      .order("order_index");

    if (data) {
      setTeamMembers(
        data.map((m) => ({
          ...m,
          personnel: (m as unknown as { personnel: Tables<"personnel"> }).personnel,
        }))
      );
    }
  }, [proposalId, supabase]);

  // Fetch team members only for key_personnel section
  useEffect(() => {
    if (slug === SECTION_SLUGS.KEY_PERSONNEL) {
      fetchTeamMembers();
    }
  }, [slug, fetchTeamMembers]);

  // Library selection handler — updates both content and library_item_id
  const handleLibrarySelect = useCallback(
    (item: Tables<"library_items">) => {
      onUpdateSection({
        content: item.content as Record<string, unknown>,
        library_item_id: item.id,
      });
    },
    [onUpdateSection]
  );

  switch (slug) {
    case SECTION_SLUGS.COVER_PAGE:
      return (
        <CoverPage
          content={content as CoverPageContent}
          onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          proposalId={proposalId}
        />
      );

    case SECTION_SLUGS.INTRODUCTION:
      return (
        <Introduction
          content={content as IntroductionContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    case SECTION_SLUGS.TABLE_OF_CONTENTS:
      return <TableOfContents sections={sections} />;

    case SECTION_SLUGS.FIRM_BACKGROUND:
      return (
        <FirmBackground
          content={content as FirmBackgroundContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          proposalId={proposalId}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    case SECTION_SLUGS.KEY_PERSONNEL:
      return (
        <KeyPersonnel
          proposalId={proposalId}
          teamMembers={teamMembers}
          onTeamChange={fetchTeamMembers}
          content={content as KeyPersonnelContent}
          onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
        />
      );

    case SECTION_SLUGS.PROJECT_SCHEDULE:
      return (
        <ProjectSchedule
          content={content as ProjectScheduleContent}
          onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          proposalId={proposalId}
        />
      );

    case SECTION_SLUGS.SITE_LOGISTICS:
      return (
        <SiteLogistics
          content={content as SiteLogisticsContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    case SECTION_SLUGS.QAQC_COMMISSIONING:
      return (
        <QAQCCommissioning
          content={content as QAQCContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    case SECTION_SLUGS.CLOSEOUT:
      return (
        <Closeout
          content={content as CloseoutContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    case SECTION_SLUGS.REFERENCE_CHECK:
      return <ReferenceCheck proposalId={proposalId} />;

    case SECTION_SLUGS.INTERVIEW_PANEL:
      return <InterviewPanel proposalId={proposalId} />;

    case SECTION_SLUGS.PROJECT_COST:
      return <ProjectCost proposalId={proposalId} />;

    case SECTION_SLUGS.EXECUTIVE_SUMMARY:
      return (
        <ExecutiveSummary
          content={content as ExecutiveSummaryContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          proposalId={proposalId}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );

    default:
      return (
        <div className="text-sm text-muted-foreground italic py-4">
          {section.section_type.display_name} editor — unknown section type
        </div>
      );
  }
}
