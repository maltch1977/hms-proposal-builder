"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, Lock, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SectionWithType } from "@/lib/hooks/use-proposal";

interface SectionSidebarItemProps {
  section: SectionWithType;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isReviewed?: boolean;
  onToggleReview?: () => void;
  showReview?: boolean;
  displayName?: string;
  onRename?: (newName: string) => void;
}

export function SectionSidebarItem({
  section,
  isActive,
  onClick,
  onDelete,
  isReviewed = false,
  onToggleReview,
  showReview = false,
  displayName,
  onRename,
}: SectionSidebarItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLocked = section.lock_level !== "none";
  const name = displayName || section.section_type.display_name;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRename) return;
    setEditValue(name);
    setIsEditing(true);
  };

  const handleRenameCommit = () => {
    setIsEditing(false);
    if (!onRename) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === section.section_type.display_name) {
      onRename("");
    } else {
      onRename(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameCommit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg px-2 py-2.5 transition-all duration-200 cursor-pointer",
        isActive
          ? "bg-hms-navy/8 shadow-sm ring-1 ring-hms-navy/15"
          : "hover:bg-accent/60",
        isDragging && "opacity-50 shadow-lg scale-[1.02]"
      )}
      onClick={onClick}
    >
      <button
        className="flex-shrink-0 cursor-grab text-muted-foreground/30 hover:text-muted-foreground active:cursor-grabbing transition-colors"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {showReview && onToggleReview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleReview();
          }}
          className="flex-shrink-0"
          title={isReviewed ? "Mark as unreviewed" : "Mark as reviewed"}
        >
          {isReviewed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
          )}
        </button>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameCommit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 text-sm bg-transparent border-b border-hms-navy/30 outline-none py-0 px-0"
        />
      ) : (
        <span
          className={cn(
            "whitespace-nowrap text-[13px] leading-snug flex-1 min-w-0 truncate",
            isActive ? "font-semibold text-foreground" : "text-muted-foreground"
          )}
          onDoubleClick={handleDoubleClick}
          title={name}
        >
          {name}
        </span>
      )}

      <div className="flex-shrink-0 ml-auto flex items-center gap-1.5">
        {isLocked && (
          <Lock className="h-3 w-3 text-muted-foreground/50" />
        )}
        {onDelete && !isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        )}
      </div>
    </div>
  );
}
