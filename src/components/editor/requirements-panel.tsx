"use client";

import { useMemo, forwardRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCheck, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
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
    },
    ref
  ) {
    // Compute days until deadline
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
    const mappedReqIds = useMemo(
      () => new Set(requirementMappings.map((m) => m.req_id)),
      [requirementMappings]
    );

    const mappingByReqId = useMemo(
      () =>
        requirementMappings.reduce<Record<string, RequirementMapping>>(
          (acc, m) => {
            acc[m.req_id] = m;
            return acc;
          },
          {}
        ),
      [requirementMappings]
    );

    // Group all requirements by section slug
    const reqsBySection = useMemo(() => {
      const grouped: Record<string, { addressed: RFPRequirement[]; needed: RFPRequirement[] }> = {};
      for (const req of requirements) {
        const slug = req.section_slug;
        if (!grouped[slug]) grouped[slug] = { addressed: [], needed: [] };
        if (mappedReqIds.has(req.id)) {
          grouped[slug].addressed.push(req);
        } else {
          grouped[slug].needed.push(req);
        }
      }
      return grouped;
    }, [requirements, mappedReqIds]);

    const addressedCount = requirements.filter((r) => r.auto_filled).length;

    const handleCardClick = useCallback(
      (reqId: string) => {
        onClickReq?.(reqId);
      },
      [onClickReq]
    );

    const hasConnectors = requirementMappings.length > 0;

    // Build ordered list of sections to display:
    // Start with enabled sections in order, then add any sections from requirements that aren't in enabledSections
    const orderedSections = useMemo(() => {
      const slugs = new Set<string>();
      const result: { slug: string; displayName: string; hasContent: boolean }[] = [];

      // Add all enabled sections first (in sidebar order)
      for (const sec of enabledSections) {
        slugs.add(sec.slug);
        result.push({ slug: sec.slug, displayName: sec.displayName, hasContent: sec.hasContent });
      }

      // Add any sections from requirements that aren't already included
      for (const req of requirements) {
        if (!slugs.has(req.section_slug)) {
          slugs.add(req.section_slug);
          result.push({
            slug: req.section_slug,
            displayName: SECTION_DISPLAY_NAMES[req.section_slug as SectionSlug] || req.section_slug,
            hasContent: false,
          });
        }
      }

      return result;
    }, [enabledSections, requirements]);

    const SectionBadge = ({ slug }: { slug: string }) => {
      const sectionName = SECTION_DISPLAY_NAMES[slug as SectionSlug] || slug;
      const isActive = slug === activeSectionSlug;
      return (
        <button
          type="button"
          onClick={() => onNavigateToSection(slug)}
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold transition-colors hover:bg-accent cursor-pointer ${
            isActive
              ? "border-hms-navy/30 bg-hms-navy/10 text-hms-navy"
              : "border-border bg-muted/50 text-foreground"
          }`}
        >
          {sectionName}
        </button>
      );
    };

    return (
      <aside ref={ref} className="w-[320px] shrink-0 min-h-0 border-l border-border bg-card flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              RFP Requirements
            </h2>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {addressedCount}/{requirements.length}
          </Badge>
        </div>
        {deadlineInfo && (
          <div className={`px-4 py-2 border-b border-border flex items-center gap-2 ${
            deadlineInfo.days <= 0
              ? "bg-red-50 dark:bg-red-950/30"
              : deadlineInfo.days <= 7
                ? "bg-red-50/50 dark:bg-red-950/20"
                : deadlineInfo.days <= 14
                  ? "bg-amber-50/50 dark:bg-amber-950/20"
                  : "bg-muted/30"
          }`}>
            <Clock className={`h-3.5 w-3.5 shrink-0 ${
              deadlineInfo.days <= 0
                ? "text-red-600 dark:text-red-400"
                : deadlineInfo.days <= 7
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
        {hasConnectors && (
          <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Addressed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted-foreground">Needs Input</span>
            </div>
          </div>
        )}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-3 space-y-4" style={{ maxWidth: "calc(320px - 2px)" }}>
            {orderedSections.map(({ slug, hasContent }) => {
              const sectionReqs = reqsBySection[slug];
              const addressedReqs = sectionReqs?.addressed || [];
              const neededReqs = sectionReqs?.needed || [];
              const hasAnyReqs = addressedReqs.length > 0 || neededReqs.length > 0;

              return (
                <div key={slug} className="space-y-1.5">
                  <SectionBadge slug={slug} />

                  {/* Addressed requirements (in proposal with marks) */}
                  {addressedReqs.map((req) => {
                    const mapping = mappingByReqId[req.id];
                    const borderColor =
                      mapping?.req_type === "needs_input"
                        ? "border-l-amber-400"
                        : "border-l-green-400";
                    const isActive = activeReqId === req.id;

                    return (
                      <div
                        key={req.id}
                        data-req-card-id={req.id}
                        className={`flex items-start gap-2 rounded-md border border-l-[3px] p-2 transition-all cursor-pointer ${borderColor} ${
                          isActive
                            ? "bg-accent/60 shadow-sm ring-1 ring-border"
                            : "bg-card hover:bg-accent/30"
                        }`}
                        onClick={() => handleCardClick(req.id)}
                      >
                        <Checkbox
                          checked={req.auto_filled}
                          onCheckedChange={() => onToggle(req.id)}
                          className="mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`flex-1 min-w-0 overflow-hidden ${req.auto_filled ? "line-through" : ""}`}>
                          <p
                            className={`text-xs leading-relaxed break-words ${
                              req.auto_filled
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {req.description}
                          </p>
                          {mapping?.note && (
                            <p className={`text-[11px] leading-snug mt-1 ${
                              req.auto_filled
                                ? "text-muted-foreground"
                                : mapping.req_type === "needs_input"
                                  ? "text-amber-700 dark:text-amber-400 font-medium"
                                  : "text-muted-foreground/80 italic"
                            }`}>
                              {!req.auto_filled && mapping.req_type === "needs_input" && (
                                <span className="inline-block mr-1">→</span>
                              )}
                              {mapping.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Still needed requirements (not yet addressed) */}
                  {neededReqs.map((req) => (
                    <div
                      key={req.id}
                      data-req-card-id={req.id}
                      className={`flex items-start gap-2 rounded-md border p-2 transition-colors ${
                        req.auto_filled
                          ? "border-border/50 bg-muted/30"
                          : "border-border bg-card"
                      }`}
                    >
                      <Checkbox
                        checked={req.auto_filled}
                        onCheckedChange={() => onToggle(req.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-relaxed ${
                            req.auto_filled
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {req.description}
                        </p>
                        {req.is_mandatory && !req.auto_filled && (
                          <Badge
                            variant="destructive"
                            className="mt-1 text-[10px] h-4"
                          >
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Sections with no RFP requirements — show status */}
                  {!hasAnyReqs && (
                    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 p-2">
                      {hasContent ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <p className="text-[11px] text-muted-foreground">Content ready</p>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <p className="text-[11px] text-amber-600">Needs content</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>
    );
  }
);
