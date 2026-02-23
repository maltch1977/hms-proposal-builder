"use client";

import { useMemo, forwardRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, CheckCircle2, Circle, Clock } from "lucide-react";
import { SECTION_DISPLAY_NAMES } from "@/lib/utils/constants";
import type { SectionSlug } from "@/lib/utils/constants";
import type { RFPRequirement, RequirementMapping } from "@/lib/ai/types";

export interface EnabledSectionInfo {
  slug: string;
  displayName: string;
  hasContent: boolean;
  sectionId: string;
}

interface RequirementsPanelProps {
  requirements: RFPRequirement[];
  onToggle: (id: string) => void;
  activeSectionSlug: string | null;
  onNavigateToSection: (sectionSlug: string) => void;
  requirementMappings?: RequirementMapping[];
  activeReqId?: string | null;
  onClickReq?: (reqId: string) => void;
  enabledSections?: EnabledSectionInfo[];
  deadline?: string | null;
  isCollaboratorOnly?: boolean;
}

export const RequirementsPanel = forwardRef<HTMLDivElement, RequirementsPanelProps>(
  function RequirementsPanel(
    {
      requirements,
      onToggle,
      activeSectionSlug,
      onNavigateToSection,
      requirementMappings = [],
      activeReqId,
      onClickReq,
      enabledSections = [],
      deadline,
      isCollaboratorOnly = false,
    },
    ref
  ) {
    // Deadline info
    const deadlineInfo = useMemo(() => {
      if (!deadline) return null;
      const deadlineDate = new Date(deadline);
      if (isNaN(deadlineDate.getTime())) return null;
      const now = new Date();
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return {
        days: diffDays,
        date: deadlineDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }, [deadline]);

    const mappingByReqId = useMemo(
      () =>
        requirementMappings.reduce<Record<string, RequirementMapping>>(
          (acc, m) => { acc[m.req_id] = m; return acc; },
          {}
        ),
      [requirementMappings]
    );

    // Every requirement gets a status: "done" or "action"
    // done = addressed mapping OR auto_filled
    // action = needs_input mapping OR no mapping at all
    const reqStatus = useCallback(
      (req: RFPRequirement): "done" | "action" => {
        const mapping = mappingByReqId[req.id];
        if (mapping?.req_type === "addressed") return "done";
        if (req.auto_filled) return "done";
        return "action";
      },
      [mappingByReqId]
    );

    // Progress
    const doneCount = requirements.filter((r) => reqStatus(r) === "done").length;

    // Group requirements by section slug
    const reqsBySection = useMemo(() => {
      const grouped: Record<string, RFPRequirement[]> = {};
      for (const req of requirements) {
        if (!grouped[req.section_slug]) grouped[req.section_slug] = [];
        grouped[req.section_slug].push(req);
      }
      return grouped;
    }, [requirements]);

    // Build ordered section list — only sections that HAVE requirements
    const orderedSections = useMemo(() => {
      const slugs = new Set<string>();
      const result: { slug: string; displayName: string }[] = [];

      // Add enabled sections first (in sidebar order), only if they have requirements
      for (const sec of enabledSections) {
        if (reqsBySection[sec.slug]?.length) {
          slugs.add(sec.slug);
          result.push({ slug: sec.slug, displayName: sec.displayName });
        }
      }

      // Add any remaining sections from requirements not in enabledSections
      for (const req of requirements) {
        if (!slugs.has(req.section_slug)) {
          slugs.add(req.section_slug);
          result.push({
            slug: req.section_slug,
            displayName: SECTION_DISPLAY_NAMES[req.section_slug as SectionSlug] || req.section_slug,
          });
        }
      }

      return result;
    }, [enabledSections, requirements, reqsBySection]);

    const handleCardClick = useCallback(
      (req: RFPRequirement) => {
        const mapping = mappingByReqId[req.id];
        if (mapping) {
          // Has a mark in the content — use connector system
          onClickReq?.(req.id);
        } else {
          // No mark — navigate to the section
          onNavigateToSection(req.section_slug);
        }
      },
      [mappingByReqId, onClickReq, onNavigateToSection]
    );

    const handleToggleDone = useCallback(
      (e: React.MouseEvent, reqId: string) => {
        e.stopPropagation();
        onToggle(reqId);
      },
      [onToggle]
    );

    const progressPercent = requirements.length > 0
      ? Math.round((doneCount / requirements.length) * 100)
      : 0;

    return (
      <aside ref={ref} className="w-[320px] shrink-0 min-h-0 border-l border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                RFP Requirements
              </h2>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {doneCount} of {requirements.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Deadline */}
        {deadlineInfo && (
          <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${
            deadlineInfo.days <= 7
              ? "bg-red-50/50 dark:bg-red-950/20"
              : deadlineInfo.days <= 14
                ? "bg-amber-50/50 dark:bg-amber-950/20"
                : "bg-muted/30"
          }`}>
            <Clock className={`h-3.5 w-3.5 shrink-0 ${
              deadlineInfo.days <= 7
                ? "text-red-500 dark:text-red-400"
                : deadlineInfo.days <= 14
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-muted-foreground"
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${
                deadlineInfo.days <= 0
                  ? "text-red-700 dark:text-red-400"
                  : deadlineInfo.days <= 7
                    ? "text-red-600 dark:text-red-400"
                    : deadlineInfo.days <= 14
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
              }`}>
                {deadlineInfo.days <= 0
                  ? "Past due"
                  : deadlineInfo.days === 1
                    ? "1 day left"
                    : `${deadlineInfo.days} days left`}
              </p>
              <p className="text-[10px] text-muted-foreground">Due {deadlineInfo.date}</p>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-3 space-y-4" style={{ maxWidth: "calc(320px - 2px)" }}>
            {orderedSections.map(({ slug, displayName }) => {
              const sectionReqs = reqsBySection[slug] || [];
              if (sectionReqs.length === 0) return null;

              const sectionName = displayName;
              const isActiveSection = slug === activeSectionSlug;

              return (
                <div key={slug} className="space-y-1.5">
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => onNavigateToSection(slug)}
                    className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-accent cursor-pointer ${
                      isActiveSection
                        ? "border-hms-navy/30 bg-hms-navy/10 text-hms-navy"
                        : "border-border bg-muted/50 text-foreground"
                    }`}
                  >
                    {sectionName}
                  </button>

                  {/* Requirement cards */}
                  {sectionReqs.map((req) => {
                    const mapping = mappingByReqId[req.id];
                    const status = reqStatus(req);
                    const isDone = status === "done";
                    const isActive = activeReqId === req.id;
                    const hasMapping = !!mapping;

                    // Action note: from AI mapping note, or section-specific instruction
                    const sectionActions: Record<string, string> = {
                      key_personnel: "Add team members with their roles, experience, and certifications in the Key Personnel section below",
                      project_cost: "Enter pricing and line items in the Project Cost section below",
                      project_schedule: "Add timeline, phases, and person-hours in the Project Schedule section below",
                      reference_check: "Add project references with contact info in the Reference Check section below",
                      interview_panel: "Prepare interview panel details in the Interview Panel section below",
                      cover_page: "Update cover page details below",
                      introduction: "Edit the Introduction section below to address this",
                      firm_background: "Edit the Firm Background section below to address this",
                      site_logistics: "Edit the Site Logistics section below to address this",
                      qaqc_commissioning: "Edit the QA/QC section below to address this",
                      closeout: "Edit the Closeout section below to address this",
                      executive_summary: "Edit the Executive Summary section below to address this",
                    };
                    const actionNote = mapping?.note || (
                      !hasMapping ? (sectionActions[slug] || `Click to navigate to the ${sectionName} section`) : ""
                    );

                    return (
                      <div
                        key={req.id}
                        data-req-card-id={req.id}
                        className={`flex items-start gap-2.5 rounded-md border-l-[3px] border border-border p-2.5 transition-all cursor-pointer ${
                          isDone
                            ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/10"
                            : "border-l-amber-400 bg-card hover:bg-amber-50/30 dark:hover:bg-amber-950/10"
                        } ${
                          isActive
                            ? "ring-1 ring-border shadow-sm"
                            : ""
                        }`}
                        onClick={() => handleCardClick(req)}
                      >
                        {/* Status icon — clickable for items without auto-detection */}
                        <button
                          type="button"
                          className="mt-0.5 shrink-0"
                          onClick={(e) => handleToggleDone(e, req.id)}
                          title={isDone ? "Mark as needs review" : "Mark as complete"}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-amber-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className={`text-xs leading-relaxed break-words ${
                            isDone ? "text-muted-foreground" : "text-foreground"
                          }`}>
                            {req.description}
                          </p>
                          {actionNote && !isDone && (
                            <p className="text-[11px] leading-snug mt-1 text-amber-700 dark:text-amber-400 font-medium">
                              <span className="inline-block mr-1">→</span>
                              {actionNote}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
    );
  }
);
