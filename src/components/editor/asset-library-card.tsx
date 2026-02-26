"use client";

import { cn } from "@/lib/utils";
import { GripVertical, Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AssetItem, AssetTypeConfig } from "@/lib/types/asset-library";

interface AssetCardProps {
  item: AssetItem;
  config: AssetTypeConfig;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function AssetCard({
  item,
  config,
  onEdit,
  onDelete,
  onAdd,
  onRemove,
}: AssetCardProps) {
  return (
    <div className="group flex items-center gap-2 rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent/50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{config.getTitle(item)}</p>
        <p className="text-xs text-muted-foreground truncate">{config.getSubtitle(item)}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {onAdd && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={onAdd} title="Add">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        {onRemove && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={onRemove} title="Remove">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface SortableAssetCardProps {
  id: string;
  item: AssetItem;
  config: AssetTypeConfig;
  onEdit?: () => void;
  onDelete?: () => void;
  onRemove?: () => void;
}

export function SortableAssetCard({
  id,
  item,
  config,
  onEdit,
  onDelete,
  onRemove,
}: SortableAssetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-md border border-border px-3 py-2 transition-colors hover:bg-accent/50",
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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{config.getTitle(item)}</p>
        <p className="text-xs text-muted-foreground truncate">{config.getSubtitle(item)}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={onDelete} title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
        {onRemove && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={onRemove} title="Remove">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
