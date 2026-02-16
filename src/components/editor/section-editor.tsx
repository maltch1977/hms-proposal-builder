"use client";

import { forwardRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionWrapper } from "@/components/editor/section-wrapper";
import { SectionRenderer } from "@/components/sections/section-renderer";
import type { SectionWithType } from "@/lib/hooks/use-proposal";
import type { UserRole } from "@/lib/utils/constants";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface SectionEditorProps {
  sections: SectionWithType[];
  activeSectionId: string | null;
  onSectionVisible: (sectionId: string) => void;
  onUpdateContent: (sectionId: string, content: Record<string, unknown>, changeType?: "human" | "ai") => void;
  onUpdateSection: (sectionId: string, updates: { content?: Record<string, unknown>; library_item_id?: string | null }) => void;
  userRole: UserRole;
  proposalId: string;
  sectionNameOverrides?: Record<string, string>;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export const SectionEditor = forwardRef<HTMLDivElement, SectionEditorProps>(
  function SectionEditor(
    {
      sections,
      activeSectionId,
      onSectionVisible,
      onUpdateContent,
      onUpdateSection,
      userRole,
      proposalId,
      sectionNameOverrides = {},
      fieldAttributions = {},
      fieldHighlights = {},
    },
    ref
  ) {
    const enabledSections = sections.filter((s) => s.is_enabled);

    return (
      <div ref={ref} className="flex-1 min-w-0 overflow-hidden bg-muted/30">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
            {enabledSections.map((section) => (
              <SectionWrapper
                key={section.id}
                section={section}
                userRole={userRole}
                isActive={activeSectionId === section.id}
                displayName={sectionNameOverrides[section.id]}
              >
                <SectionRenderer
                  section={section}
                  sections={sections}
                  onUpdateContent={(content, changeType) =>
                    onUpdateContent(section.id, content, changeType)
                  }
                  onUpdateSection={(updates) =>
                    onUpdateSection(section.id, updates)
                  }
                  proposalId={proposalId}
                  fieldAttributions={fieldAttributions}
                  fieldHighlights={fieldHighlights}
                />
              </SectionWrapper>
            ))}

            {enabledSections.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  No sections are enabled. Toggle sections on in the sidebar to start building your proposal.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);
