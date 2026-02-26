"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { GripVertical, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssetTypeConfig, AssetItem, PastProject } from "@/lib/types/asset-library";

interface LinkedEntry {
  junctionId: string;
  item: AssetItem;
}

interface SelectedAssetsSummaryProps {
  config: AssetTypeConfig;
  proposalId: string;
  refreshKey: number;
  onItemClick?: (item: AssetItem) => void;
}

function getFirstPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first) return (first as { url: string }).url;
  return null;
}

function SortableSummaryCard({
  entry,
  config,
  onRemove,
  onClick,
}: {
  entry: LinkedEntry;
  config: AssetTypeConfig;
  onRemove: () => void;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.junctionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCaseStudy = config.key === "past_projects";
  const photoUrl = isCaseStudy ? getFirstPhoto((entry.item as PastProject).photos) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab shrink-0 text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isCaseStudy && (
        photoUrl ? (
          <div className="w-16 h-11 rounded-md overflow-hidden shrink-0 bg-muted">
            <Image
              src={photoUrl}
              alt={config.getTitle(entry.item)}
              width={64}
              height={44}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-11 w-16 items-center justify-center rounded-md bg-muted shrink-0">
            <Building2 className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )
      )}

      <div
        className={cn("flex-1 min-w-0", onClick && "cursor-pointer")}
        onClick={onClick}
      >
        <p className="text-sm font-medium truncate">{config.getTitle(entry.item)}</p>
        <p className="text-xs text-muted-foreground truncate">{config.getSubtitle(entry.item)}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function SelectedAssetsSummary({
  config,
  proposalId,
  refreshKey,
  onItemClick,
}: SelectedAssetsSummaryProps) {
  const [entries, setEntries] = useState<LinkedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLinked = useCallback(async () => {
    try {
      const res = await fetch(config.endpoints.linked(proposalId));
      const json = await res.json();
      const linked: Record<string, unknown>[] = json[config.responseKeys.linked] || [];
      setEntries(
        linked.map((rec) => ({
          junctionId: rec.id as string,
          item: rec[config.nestedKey] as AssetItem,
        }))
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [config, proposalId]);

  useEffect(() => {
    fetchLinked();
  }, [fetchLinked, refreshKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.junctionId === active.id);
    const newIndex = entries.findIndex((e) => e.junctionId === over.id);
    const newOrder = [...entries];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);
    setEntries(newOrder);

    await fetch(config.endpoints.reorder(proposalId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: newOrder.map((e, i) => ({ id: e.junctionId, order_index: i + 1 })),
      }),
    });
  };

  const handleRemove = async (junctionId: string) => {
    setEntries((prev) => prev.filter((e) => e.junctionId !== junctionId));
    await fetch(config.endpoints.unlink(proposalId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [config.unlinkBodyKey]: junctionId }),
    });
  };

  if (loading) return null;
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No {config.labelPlural.toLowerCase()} selected yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5 mt-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={entries.map((e) => e.junctionId)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <SortableSummaryCard
              key={entry.junctionId}
              entry={entry}
              config={config}
              onRemove={() => handleRemove(entry.junctionId)}
              onClick={onItemClick ? () => onItemClick(entry.item) : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
