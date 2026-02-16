"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SectionSidebarItem } from "@/components/editor/section-sidebar-item";
import type { SectionWithType } from "@/lib/hooks/use-proposal";

interface SectionSidebarProps {
  sections: SectionWithType[];
  activeSectionId: string | null;
  onSectionClick: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAddSection: () => void;
  sectionReviews?: Record<string, boolean>;
  onToggleReview?: (sectionId: string) => void;
  isAIPopulated?: boolean;
  sectionNameOverrides?: Record<string, string>;
  onRenameSection?: (sectionId: string, newName: string) => void;
}

export function SectionSidebar({
  sections,
  activeSectionId,
  onSectionClick,
  onDeleteSection,
  onReorder,
  onAddSection,
  sectionReviews = {},
  onToggleReview,
  isAIPopulated = false,
  sectionNameOverrides = {},
  onRenameSection,
}: SectionSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const newOrder = [...sections];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    onReorder(newOrder.map((s) => s.id));
  };

  return (
    <aside className="shrink-0 border-r border-border bg-gradient-to-b from-card to-card/95 flex flex-col">
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Sections
        </h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onAddSection}
          title="Add section"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sections.map((section) => (
                <SectionSidebarItem
                  key={section.id}
                  section={section}
                  isActive={activeSectionId === section.id}
                  onClick={() => onSectionClick(section.id)}
                  onDelete={() => onDeleteSection(section.id)}
                  isReviewed={sectionReviews[section.id] ?? false}
                  onToggleReview={onToggleReview ? () => onToggleReview(section.id) : undefined}
                  showReview={isAIPopulated}
                  displayName={sectionNameOverrides[section.id] || section.section_type.display_name}
                  onRename={onRenameSection ? (name) => onRenameSection(section.id, name) : undefined}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>
    </aside>
  );
}
