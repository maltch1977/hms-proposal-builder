"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { deriveFieldAttributions } from "@/lib/utils/derive-field-attributions";
import { computeAllFieldHighlights } from "@/lib/utils/compute-author-highlights";
import { useProposal } from "@/lib/hooks/use-proposal";
import { useAuth } from "@/lib/providers/auth-provider";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { SectionSidebar } from "@/components/editor/section-sidebar";
import { SectionEditor } from "@/components/editor/section-editor";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { RequirementsPanel } from "@/components/editor/requirements-panel";
import type { EnabledSectionInfo } from "@/components/editor/requirements-panel";
import { RequirementConnectors } from "@/components/editor/requirement-connectors";
import { ChangesPanel } from "@/components/editor/changes-panel";
import { useProposalChanges } from "@/lib/hooks/use-proposal-changes";
import { Skeleton } from "@/components/ui/skeleton";
import { QualityCheckDialog } from "@/components/editor/quality-check-dialog";
import { StrengthenDialog } from "@/components/editor/strengthen-dialog";
import { DeleteSectionDialog } from "@/components/editor/delete-section-dialog";
import { AddSectionDialog } from "@/components/editor/add-section-dialog";
import { toast } from "sonner";
import type { UserRole } from "@/lib/utils/constants";
import type { QualityCheckIssue, LanguageSuggestion, RFPRequirement, RequirementMapping } from "@/lib/ai/types";

interface EditorLayoutProps {
  proposalId: string;
  isCollaboratorOnly?: boolean;
}

export function EditorLayout({ proposalId, isCollaboratorOnly: isCollaboratorOnlyProp }: EditorLayoutProps) {
  const {
    proposal,
    sections,
    loading,
    saving,
    updateProposal,
    updateSection,
    reorderSections,
    addSection,
    deleteSection,
  } = useProposal(proposalId);
  const { profile, signOut } = useAuth();
  const isCollaboratorOnly = isCollaboratorOnlyProp ?? profile?.role === "proposal_user";
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRequirements, setShowRequirements] = useState<boolean | null>(null);
  const [qualityIssues, setQualityIssues] = useState<QualityCheckIssue[]>([]);
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [showStrengthen, setShowStrengthen] = useState(false);
  const [strengthenSuggestions, setStrengthenSuggestions] = useState<LanguageSuggestion[]>([]);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [strengtheningLanguage, setStrengtheningLanguage] = useState(false);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Array<{
    id: string;
    profile_id: string;
    role: string;
    color: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }>>([]);

  const { changes, loading: changesLoading, refetch: refetchChanges } = useProposalChanges(proposalId);

  const fieldAttributions = useMemo(
    () => deriveFieldAttributions(changes, collaborators),
    [changes, collaborators]
  );

  const fieldHighlights = useMemo(
    () => computeAllFieldHighlights(changes, collaborators),
    [changes, collaborators]
  );

  // Fetch collaborators
  useEffect(() => {
    async function fetchCollaborators() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/collaborators`);
        if (res.ok) {
          setCollaborators(await res.json());
        }
      } catch {
        // silently fail
      }
    }
    fetchCollaborators();
  }, [proposalId]);

  // Refs for connector system
  const layoutContainerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const panelContainerRef = useRef<HTMLDivElement>(null);

  // Normalize ID: strip "req_" prefix if present, convert to string
  const normalizeReqId = (id: unknown): string => String(id).replace(/^req_/, "");

  // Find a mark element by normalized reqId — tries both raw and prefixed forms
  const findMarkByReqId = useCallback((container: HTMLElement, reqId: string): HTMLElement | null => {
    return (
      container.querySelector<HTMLElement>(`mark[data-req-id="${reqId}"]`) ||
      container.querySelector<HTMLElement>(`mark[data-req-id="req_${reqId}"]`)
    );
  }, []);

  // Find all marks by normalized reqId
  const findAllMarksByReqId = useCallback((container: HTMLElement, reqId: string): HTMLElement[] => {
    const marks = [
      ...container.querySelectorAll<HTMLElement>(`mark[data-req-id="${reqId}"]`),
      ...container.querySelectorAll<HTMLElement>(`mark[data-req-id="req_${reqId}"]`),
    ];
    return marks;
  }, []);

  const requirementMappings = useMemo<RequirementMapping[]>(() => {
    const meta = proposal?.metadata as Record<string, unknown> | null;
    if (!meta?.requirement_mappings) return [];
    return (meta.requirement_mappings as RequirementMapping[]).map((m) => ({
      ...m,
      req_id: normalizeReqId(m.req_id),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.metadata]);

  // Build set of addressed requirement IDs from mappings
  const addressedReqIds = useMemo(
    () => new Set(
      requirementMappings
        .filter((m) => m.req_type === "addressed")
        .map((m) => m.req_id)
    ),
    [requirementMappings]
  );

  const rfpRequirements = useMemo<RFPRequirement[]>(() => {
    const meta = proposal?.metadata as Record<string, unknown> | null;
    if (!meta?.rfp_requirements) return [];
    return (meta.rfp_requirements as RFPRequirement[]).map((r) => {
      const id = normalizeReqId(r.id);
      return {
        ...r,
        id,
        // Auto-check addressed requirements so green cards show crossed out on load
        auto_filled: r.auto_filled || addressedReqIds.has(id),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal?.metadata, addressedReqIds]);

  const hasRequirements = rfpRequirements.length > 0;

  const isAIPopulated = useMemo(() => {
    const meta = proposal?.metadata as Record<string, unknown> | null;
    return !!meta?.ai_populated;
  }, [proposal?.metadata]);

  const sectionReviews = useMemo<Record<string, boolean>>(() => {
    const meta = proposal?.metadata as Record<string, unknown> | null;
    return (meta?.section_reviews as Record<string, boolean>) || {};
  }, [proposal?.metadata]);

  const sectionNameOverrides = useMemo<Record<string, string>>(() => {
    const meta = proposal?.metadata as Record<string, unknown> | null;
    return (meta?.section_name_overrides as Record<string, string>) || {};
  }, [proposal?.metadata]);

  const reviewProgress = useMemo(() => {
    const enabledSections = sections.filter((s) => s.is_enabled);
    const reviewed = enabledSections.filter((s) => sectionReviews[s.id]).length;
    return { reviewed, total: enabledSections.length };
  }, [sections, sectionReviews]);

  const handleToggleReview = useCallback(
    async (sectionId: string) => {
      const newReviews = { ...sectionReviews, [sectionId]: !sectionReviews[sectionId] };
      const newMetadata = {
        ...((proposal?.metadata as Record<string, unknown>) || {}),
        section_reviews: newReviews,
      } as unknown as import("@/lib/types/database").Json;
      await updateProposal({ metadata: newMetadata });
    },
    [sectionReviews, proposal?.metadata, updateProposal]
  );

  const handleRenameSection = useCallback(
    async (sectionId: string, newName: string) => {
      const overrides = { ...sectionNameOverrides };
      if (newName.trim()) {
        overrides[sectionId] = newName.trim();
      } else {
        delete overrides[sectionId];
      }
      const newMetadata = {
        ...((proposal?.metadata as Record<string, unknown>) || {}),
        section_name_overrides: overrides,
      } as unknown as import("@/lib/types/database").Json;
      await updateProposal({ metadata: newMetadata });
    },
    [sectionNameOverrides, proposal?.metadata, updateProposal]
  );

  // Auto-show requirements panel when proposal has RFP requirements (first render only)
  const effectiveShowRequirements = showRequirements === null ? hasRequirements : showRequirements;

  const activeSectionSlug = useMemo(() => {
    if (!activeSectionId) return null;
    const section = sections.find((s) => s.id === activeSectionId);
    return section?.section_type.slug ?? null;
  }, [activeSectionId, sections]);

  // Build enabled sections info for the requirements panel
  const enabledSections = useMemo<EnabledSectionInfo[]>(() => {
    const contentFields: Record<string, string[]> = {
      cover_page: ["project_name", "client_name"],
      introduction: ["body"],
      table_of_contents: [],
      firm_background: ["narrative"],
      key_personnel: [],
      project_schedule: [],
      site_logistics: ["body"],
      qaqc_commissioning: ["quality_assurance", "quality_control", "commissioning"],
      closeout: ["body"],
      reference_check: [],
      interview_panel: [],
      project_cost: [],
      executive_summary: ["body"],
    };

    return sections
      .filter((s) => s.is_enabled)
      .map((s) => {
        const slug = s.section_type.slug;
        const fields = contentFields[slug] || [];
        const content = (s.content || {}) as Record<string, unknown>;
        const hasContent = fields.length === 0
          ? true // sections without text fields (table_of_contents, key_personnel, etc.) are always "ready"
          : fields.some((f) => {
              const val = content[f];
              return typeof val === "string" && val.replace(/<[^>]*>/g, "").trim().length > 0;
            });

        return {
          slug,
          displayName: s.section_type.display_name,
          hasContent,
          sectionId: s.id,
        };
      });
  }, [sections]);

  const handleToggleRequirement = useCallback(
    async (requirementId: string) => {
      const updated = rfpRequirements.map((r) =>
        r.id === requirementId ? { ...r, auto_filled: !r.auto_filled } : r
      );
      const newMetadata = {
        ...((proposal?.metadata as Record<string, unknown>) || {}),
        rfp_requirements: updated,
      } as unknown as import("@/lib/types/database").Json;
      await updateProposal({ metadata: newMetadata });
    },
    [rfpRequirements, proposal?.metadata, updateProposal]
  );

  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleUpdateContent = useCallback(
    async (sectionId: string, content: Record<string, unknown>, changeType?: "human" | "ai") => {
      await updateSection(sectionId, { content: content as Record<string, unknown> & import("@/lib/types/database").Json }, changeType);
      refetchChanges();
    },
    [updateSection, refetchChanges]
  );

  const handleUpdateSection = useCallback(
    async (sectionId: string, updates: { content?: Record<string, unknown>; library_item_id?: string | null }) => {
      const supabaseUpdates: { content?: import("@/lib/types/database").Json; library_item_id?: string | null } = {};
      if (updates.content !== undefined) {
        supabaseUpdates.content = updates.content as Record<string, unknown> & import("@/lib/types/database").Json;
      }
      if (updates.library_item_id !== undefined) {
        supabaseUpdates.library_item_id = updates.library_item_id;
      }
      await updateSection(sectionId, supabaseUpdates);
    },
    [updateSection]
  );

  const doExport = useCallback(async () => {
    toast.info("Generating PDF...");
    try {
      const res = await fetch(`/api/proposals/${proposalId}/export`);
      if (!res.ok) {
        toast.error("Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${proposal?.title || "proposal"}_Proposal.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported successfully");
    } catch {
      toast.error("Export failed");
    }
  }, [proposalId, proposal?.title]);

  const handleExport = useCallback(async () => {
    setCheckingQuality(true);
    try {
      const dataRes = await fetch(`/api/proposals/${proposalId}/export-data`);
      if (!dataRes.ok) {
        doExport();
        return;
      }
      const proposalData = await dataRes.json();

      // Run grammar sweep on narrative sections in parallel with quality check
      const narrativeSlugs = ["introduction", "firm_background", "site_logistics", "qaqc_commissioning", "closeout", "executive_summary"];
      const narrativeSections = sections
        .filter((s) => s.is_enabled && narrativeSlugs.includes(s.section_type.slug))
        .map((s) => {
          const content = (s.content || {}) as Record<string, unknown>;
          const htmlParts: string[] = [];
          for (const key of ["body", "narrative", "quality_assurance", "quality_control", "commissioning"]) {
            if (content[key] && typeof content[key] === "string") htmlParts.push(content[key] as string);
          }
          return {
            slug: s.section_type.slug,
            name: s.section_type.display_name,
            html: htmlParts.join("\n\n"),
          };
        })
        .filter((s) => s.html.replace(/<[^>]*>/g, "").trim().length > 5);

      // Strip HTML helper
      const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

      // Run both checks in parallel
      const [qualityRes, ...grammarResults] = await Promise.all([
        fetch("/api/ai/quality-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalData }),
        }).catch(() => null),
        ...narrativeSections.map((s) =>
          fetch("/api/grammar-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: stripHtml(s.html) }),
          })
            .then((r) => r.json())
            .then((data) => ({ slug: s.slug, name: s.name, matches: data.matches || [] }))
            .catch(() => ({ slug: s.slug, name: s.name, matches: [] }))
        ),
      ]);

      // Collect grammar issues
      let grammarIssueCounter = 0;
      const grammarIssues: QualityCheckIssue[] = grammarResults.flatMap((result) =>
        (result.matches as Array<{ message: string; rule: { category: { id: string } } }>).map((match) => ({
          id: `grammar-${grammarIssueCounter++}`,
          type: "formatting" as const,
          severity: "warning" as const,
          section_slug: result.slug,
          section_name: result.name,
          message: `${match.rule.category.id === "TYPOS" ? "Spelling" : "Grammar"}: ${match.message}`,
          suggestion: "Fix this in the editor using the inline grammar checker.",
        }))
      );

      // Get quality check issues
      let qualityIssuesArr: QualityCheckIssue[] = [];
      if (qualityRes && qualityRes.ok) {
        const data = await qualityRes.json();
        qualityIssuesArr = data.issues || [];
      }

      const allIssues = [...grammarIssues, ...qualityIssuesArr];
      if (allIssues.length > 0) {
        setQualityIssues(allIssues);
        setShowQualityCheck(true);
      } else {
        doExport();
      }
    } catch {
      doExport();
    }
    setCheckingQuality(false);
  }, [proposalId, doExport, sections]);

  const handleStrengthen = useCallback(async () => {
    setStrengtheningLanguage(true);
    try {
      const narrativeSections = sections
        .filter((s) => s.is_enabled)
        .filter((s) => {
          const slug = s.section_type.slug;
          return ["introduction", "firm_background", "site_logistics", "qaqc_commissioning", "closeout", "executive_summary"].includes(slug);
        })
        .map((s) => {
          const content = (s.content || {}) as Record<string, unknown>;
          const htmlParts: string[] = [];
          if (content.body) htmlParts.push(content.body as string);
          if (content.narrative) htmlParts.push(content.narrative as string);
          if (content.quality_assurance) htmlParts.push(content.quality_assurance as string);
          if (content.quality_control) htmlParts.push(content.quality_control as string);
          if (content.commissioning) htmlParts.push(content.commissioning as string);
          return {
            slug: s.section_type.slug,
            name: s.section_type.display_name,
            html: htmlParts.join("\n\n"),
          };
        })
        .filter((s) => s.html.length > 10);

      if (narrativeSections.length === 0) {
        toast.info("No narrative content to analyze");
        setStrengtheningLanguage(false);
        return;
      }

      const res = await fetch("/api/ai/strengthen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: narrativeSections }),
      });

      if (!res.ok) {
        toast.error("Language analysis failed");
        setStrengtheningLanguage(false);
        return;
      }

      const { suggestions } = await res.json();
      if (suggestions && suggestions.length > 0) {
        setStrengthenSuggestions(suggestions);
        setShowStrengthen(true);
      } else {
        toast.info("No suggestions — your language is already strong");
      }
    } catch {
      toast.error("Analysis failed");
    }
    setStrengtheningLanguage(false);
  }, [sections]);

  const handleAcceptStrengthenSuggestion = useCallback(
    (suggestion: LanguageSuggestion) => {
      // Find the section and replace the text
      const section = sections.find(
        (s) => s.section_type.slug === suggestion.section_slug
      );
      if (!section) return;

      const content = { ...((section.content || {}) as Record<string, unknown>) };
      // Replace in all HTML fields
      for (const key of ["body", "narrative", "quality_assurance", "quality_control", "commissioning"]) {
        if (content[key] && typeof content[key] === "string") {
          content[key] = (content[key] as string).replace(
            suggestion.original,
            suggestion.suggested
          );
        }
      }
      handleUpdateContent(section.id, content, "ai");
    },
    [sections, handleUpdateContent]
  );

  const handleNavigateToSection = useCallback(
    (sectionSlug: string) => {
      const section = sections.find(
        (s) => s.section_type.slug === sectionSlug
      );
      if (section) {
        setActiveSectionId(section.id);
        const el = document.getElementById(`section-${section.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [sections]
  );

  // Click a requirement card → scroll editor to the matching mark + show connector
  const handleClickReq = useCallback((reqId: string) => {
    // Toggle off if clicking the same card
    if (activeReqId === reqId) {
      setActiveReqId(null);
      return;
    }
    setActiveReqId(reqId);
    const editor = editorContainerRef.current;
    if (!editor) return;
    const mark = findMarkByReqId(editor, reqId);
    if (mark) {
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [findMarkByReqId, activeReqId]);

  // Click on requirement marks in editor → connect to panel card
  // Uses document-level capture to avoid TipTap/ProseMirror swallowing events
  useEffect(() => {
    const normalizeMarkId = (raw: string | null) => raw ? raw.replace(/^req_/, "") : null;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest?.("mark[data-req-id]");

      if (mark) {
        const rawReqId = mark.getAttribute("data-req-id");
        const reqId = normalizeMarkId(rawReqId);
        if (reqId) {
          setActiveReqId((prev) => prev === reqId ? null : reqId);
          requestAnimationFrame(() => {
            const panel = panelContainerRef.current;
            if (panel) {
              const card = panel.querySelector<HTMLElement>(`[data-req-card-id="${reqId}"]`);
              card?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        }
      } else {
        // Clear if clicking inside the editor content area but not on a mark
        const editor = editorContainerRef.current;
        if (editor && editor.contains(target) && target.closest?.(".ProseMirror")) {
          setActiveReqId(null);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // Highlight marks for the active (clicked) requirement
  useEffect(() => {
    const editor = editorContainerRef.current;
    if (!editor) return;

    // Remove all existing highlights
    const allMarks = editor.querySelectorAll<HTMLElement>("mark.requirement-mark--highlighted");
    allMarks.forEach((m) => m.classList.remove("requirement-mark--highlighted"));

    // Add highlight to active — try both ID formats
    if (activeReqId) {
      const marks = findAllMarksByReqId(editor, activeReqId);
      marks.forEach((m) => m.classList.add("requirement-mark--highlighted"));
    }
  }, [activeReqId, findAllMarksByReqId]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-14 border-b border-border bg-card">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex flex-1">
          <div className="w-[240px] border-r border-border p-4 space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="flex-1 p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Proposal not found.</p>
      </div>
    );
  }

  const saveStatus = saving ? "saving" : "idle";
  const showConnectors = isAIPopulated && hasRequirements && requirementMappings.length > 0;

  return (
    <div className="flex h-full flex-col">
      <EditorTopbar
        proposal={proposal}
        saveStatus={saveStatus}
        onTogglePreview={() => setShowPreview(!showPreview)}
        showPreview={showPreview}
        onExport={isCollaboratorOnly ? doExport : handleExport}
        checkingQuality={isCollaboratorOnly ? false : checkingQuality}
        hasRequirements={hasRequirements}
        requirements={rfpRequirements}
        requirementMappings={requirementMappings}
        onToggleChanges={() => setShowChanges(!showChanges)}
        showChanges={showChanges}
        collaborators={collaborators}
        isCollaboratorOnly={isCollaboratorOnly}
        onSignOut={signOut}
      />
      <div ref={layoutContainerRef} className="relative flex flex-1 overflow-hidden">
        <SectionSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionClick={handleSectionClick}
          onDeleteSection={(id) => setDeletingSectionId(id)}
          onReorder={reorderSections}
          onAddSection={() => setShowAddSection(true)}
          sectionReviews={sectionReviews}
          onToggleReview={handleToggleReview}
          isAIPopulated={isAIPopulated}
          sectionNameOverrides={sectionNameOverrides}
          onRenameSection={handleRenameSection}
        />
        <SectionEditor
          ref={editorContainerRef}
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionVisible={setActiveSectionId}
          onUpdateContent={handleUpdateContent}
          onUpdateSection={handleUpdateSection}
          userRole={(profile?.role || "proposal_user") as UserRole}
          proposalId={proposalId}
          sectionNameOverrides={sectionNameOverrides}
          fieldAttributions={fieldAttributions}
          fieldHighlights={fieldHighlights}
        />
        {showChanges && (
          <ChangesPanel
            changes={changes}
            loading={changesLoading}
            onClose={() => setShowChanges(false)}
            activeSectionSlug={activeSectionSlug}
          />
        )}
        {hasRequirements && (
          <RequirementsPanel
            ref={panelContainerRef}
            requirements={rfpRequirements}
            onToggle={handleToggleRequirement}
            activeSectionSlug={activeSectionSlug}
            onNavigateToSection={handleNavigateToSection}
            requirementMappings={requirementMappings}
            activeReqId={activeReqId}
            onClickReq={handleClickReq}
            enabledSections={enabledSections}
            deadline={proposal.deadline}
          />
        )}
        <PreviewPanel proposalId={proposalId} open={showPreview} onOpenChange={setShowPreview} />
        {showConnectors && (
          <RequirementConnectors
            containerRef={layoutContainerRef}
            editorRef={editorContainerRef}
            panelRef={panelContainerRef}
            activeReqId={activeReqId}
          />
        )}
      </div>

      <QualityCheckDialog
        open={showQualityCheck}
        onOpenChange={setShowQualityCheck}
        issues={qualityIssues}
        onNavigateToSection={handleNavigateToSection}
        onProceedExport={() => {
          setShowQualityCheck(false);
          doExport();
        }}
      />

      <StrengthenDialog
        open={showStrengthen}
        onOpenChange={setShowStrengthen}
        suggestions={strengthenSuggestions}
        onAcceptSuggestion={handleAcceptStrengthenSuggestion}
      />

      <AddSectionDialog
        open={showAddSection}
        onOpenChange={setShowAddSection}
        existingSlugs={sections.map((s) => s.section_type.slug)}
        onAdd={async (sectionTypeId) => {
          const ok = await addSection(sectionTypeId);
          if (ok) toast.success("Section added");
          else toast.error("Failed to add section");
        }}
      />

      <DeleteSectionDialog
        open={!!deletingSectionId}
        onOpenChange={(open) => { if (!open) setDeletingSectionId(null); }}
        sectionName={
          sections.find((s) => s.id === deletingSectionId)?.section_type.display_name || "this section"
        }
        onConfirm={async () => {
          if (!deletingSectionId) return;
          const ok = await deleteSection(deletingSectionId);
          if (ok) {
            toast.success("Section deleted");
            if (activeSectionId === deletingSectionId) setActiveSectionId(null);
          } else {
            toast.error("Failed to delete section");
          }
          setDeletingSectionId(null);
        }}
      />
    </div>
  );
}
