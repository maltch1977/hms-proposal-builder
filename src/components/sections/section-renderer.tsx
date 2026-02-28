"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  ProjectCostContent,
  InterviewPanelContent,
} from "@/lib/types/section";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";
import type { RFPRequirement, RequirementMapping } from "@/lib/ai/types";
import { SectionGuidance } from "@/components/sections/section-guidance";
import { SectionFileUpload } from "@/components/sections/section-file-upload";

const STRUCTURED_SECTION_SLUGS: Set<string> = new Set([
  SECTION_SLUGS.PROJECT_COST,
  SECTION_SLUGS.PROJECT_SCHEDULE,
  SECTION_SLUGS.REFERENCE_CHECK,
  SECTION_SLUGS.INTERVIEW_PANEL,
]);

interface SectionRendererProps {
  section: SectionWithType;
  sections: SectionWithType[];
  onUpdateContent: (content: Record<string, unknown>, changeType?: "human" | "ai") => void;
  onUpdateSection: (updates: { content?: Record<string, unknown>; library_item_id?: string | null }) => void;
  proposalId: string;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
  rfpRequirements?: RFPRequirement[];
  requirementMappings?: RequirementMapping[];
  onRequirementDone?: (reqId: string, done: boolean) => void;
}

export function SectionRenderer({
  section,
  sections,
  onUpdateContent,
  onUpdateSection,
  proposalId,
  fieldAttributions = {},
  fieldHighlights = {},
  rfpRequirements = [],
  requirementMappings = [],
  onRequirementDone,
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

  // Requirements filtered for this section
  const sectionRequirements = useMemo(
    () => rfpRequirements.filter((r) => r.section_slug === slug),
    [rfpRequirements, slug]
  );
  const sectionMappings = useMemo(
    () => requirementMappings.filter((m) => m.section_slug === slug),
    [requirementMappings, slug]
  );
  const isStructured = STRUCTURED_SECTION_SLUGS.has(slug);
  const requirementResponses = (content.requirement_responses || {}) as Record<string, string>;

  const handleRequirementResponse = useCallback(
    (reqId: string, value: string) => {
      const updated = { ...content, requirement_responses: { ...requirementResponses, [reqId]: value } };
      onUpdateContent(updated);
      // Auto-mark requirement done when non-empty, undone when cleared
      const isDone = value.trim().length > 0;
      onRequirementDone?.(reqId, isDone);
    },
    [content, requirementResponses, onUpdateContent, onRequirementDone]
  );

  // Team members state for Key Personnel section
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPersonnel[]>([]);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/team-members`);
      const json = await res.json();
      if (json.members) {
        setTeamMembers(
          json.members.map((m: Record<string, unknown>) => ({
            ...m,
            personnel: m.personnel,
          })) as TeamMemberWithPersonnel[]
        );
      }
    } catch {
      // Ignore
    }
  }, [proposalId]);

  // Fetch team members only for key_personnel section
  useEffect(() => {
    if (slug === SECTION_SLUGS.KEY_PERSONNEL) {
      fetchTeamMembers();
    }
  }, [slug, fetchTeamMembers]);

  // Library EMR ratings for Site Logistics section
  const [libraryEmrEntries, setLibraryEmrEntries] = useState<Array<{ year: string; rating: string }>>([]);

  useEffect(() => {
    if (slug !== SECTION_SLUGS.SITE_LOGISTICS) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/emr-ratings");
        const json = await res.json();
        if (!cancelled && json.emrRatings) {
          setLibraryEmrEntries(json.emrRatings);
        }
      } catch {
        // Ignore
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

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

  // Guidance block for structured sections — renders orphan textareas + anchor targets
  const guidanceBlock = isStructured && sectionRequirements.length > 0 ? (
    <SectionGuidance
      requirements={sectionRequirements}
      requirementMappings={sectionMappings}
      responses={requirementResponses}
      onResponseChange={handleRequirementResponse}
    />
  ) : null;

  // Universal file upload for every section (except cover page and TOC)
  const sectionFiles = ((content.files || []) as Array<{ url: string; path: string; filename: string; type: string }>);
  const showFileUpload = slug !== SECTION_SLUGS.COVER_PAGE && slug !== SECTION_SLUGS.TABLE_OF_CONTENTS;
  const fileUploadBlock = showFileUpload ? (
    <SectionFileUpload
      files={sectionFiles}
      onChange={(files) => onUpdateContent({ ...content, files })}
    />
  ) : null;

  // Project Cost already has its own file upload — skip the universal one
  const skipUniversalUpload = slug === SECTION_SLUGS.PROJECT_COST;

  let sectionContent: React.ReactNode;
  switch (slug) {
    case SECTION_SLUGS.COVER_PAGE:
      sectionContent = (
        <CoverPage
          content={content as CoverPageContent}
          onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          proposalId={proposalId}
        />
      );
      break;

    case SECTION_SLUGS.INTRODUCTION:
      sectionContent = (
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
      break;

    case SECTION_SLUGS.TABLE_OF_CONTENTS:
      sectionContent = <TableOfContents sections={sections} />;
      break;

    case SECTION_SLUGS.FIRM_BACKGROUND:
      sectionContent = (
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
      break;

    case SECTION_SLUGS.KEY_PERSONNEL:
      sectionContent = (
        <KeyPersonnel
          proposalId={proposalId}
          teamMembers={teamMembers}
          onTeamChange={fetchTeamMembers}
          content={content as KeyPersonnelContent}
          onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          rfpRequirements={sectionRequirements}
        />
      );
      break;

    case SECTION_SLUGS.PROJECT_SCHEDULE:
      sectionContent = (
        <>
          {guidanceBlock}
          <ProjectSchedule
            content={content as ProjectScheduleContent}
            onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
            proposalId={proposalId}
          />
        </>
      );
      break;

    case SECTION_SLUGS.SITE_LOGISTICS:
      sectionContent = (
        <SiteLogistics
          content={content as SiteLogisticsContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          sectionTypeId={sectionTypeId}
          libraryItemId={libraryItemId}
          onLibrarySelect={handleLibrarySelect}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
          libraryEmrEntries={libraryEmrEntries}
        />
      );
      break;

    case SECTION_SLUGS.QAQC_COMMISSIONING:
      sectionContent = (
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
      break;

    case SECTION_SLUGS.CLOSEOUT:
      sectionContent = (
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
      break;

    case SECTION_SLUGS.REFERENCE_CHECK:
      sectionContent = (
        <>
          {guidanceBlock}
          <ReferenceCheck proposalId={proposalId} />
        </>
      );
      break;

    case SECTION_SLUGS.INTERVIEW_PANEL:
      sectionContent = (
        <>
          {guidanceBlock}
          <InterviewPanel
            proposalId={proposalId}
            content={content as InterviewPanelContent}
            onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
          />
        </>
      );
      break;

    case SECTION_SLUGS.PROJECT_COST:
      sectionContent = (
        <>
          {guidanceBlock}
          <ProjectCost
            content={content as ProjectCostContent}
            onChange={(c) => onUpdateContent(c as unknown as Record<string, unknown>)}
            proposalId={proposalId}
          />
        </>
      );
      break;

    case SECTION_SLUGS.EXECUTIVE_SUMMARY:
      sectionContent = (
        <ExecutiveSummary
          content={content as ExecutiveSummaryContent}
          onChange={(c, ct) => onUpdateContent(c as unknown as Record<string, unknown>, ct)}
          proposalId={proposalId}
          fieldAttributions={sectionFieldAttributions}
          fieldHighlights={sectionHighlights}
        />
      );
      break;

    default:
      sectionContent = (
        <div className="text-sm text-muted-foreground italic py-4">
          {section.section_type.display_name} editor — unknown section type
        </div>
      );
      break;
  }

  // Append universal file upload to every section (except cover page, TOC, and project cost which has its own)
  if (fileUploadBlock && !skipUniversalUpload) {
    return (
      <>
        {sectionContent}
        {fileUploadBlock}
      </>
    );
  }

  return sectionContent;
}
