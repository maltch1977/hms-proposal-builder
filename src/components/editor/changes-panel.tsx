"use client";

import { useState, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChangeDiffView } from "@/components/editor/change-diff-view";
import { X, ChevronDown, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import type { ProposalChange } from "@/lib/hooks/use-proposal-changes";

interface ChangesPanelProps {
  changes: ProposalChange[];
  loading: boolean;
  onClose: () => void;
  activeSectionSlug?: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  body: "Body",
  narrative: "Narrative",
  quality_assurance: "Quality Assurance",
  quality_control: "Quality Control",
  commissioning: "Commissioning",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(changes: ProposalChange[]): Record<string, ProposalChange[]> {
  const groups: Record<string, ProposalChange[]> = {};
  for (const change of changes) {
    const date = new Date(change.created_at);
    const key = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(change);
  }
  return groups;
}

function ChangeEntry({ change }: { change: ProposalChange }) {
  const [expanded, setExpanded] = useState(false);
  const isAI = change.change_type === "ai";

  return (
    <div className="group px-3 py-2.5 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="flex items-start gap-2.5">
        {isAI ? (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
            <Sparkles className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          </div>
        ) : (
          <Avatar size="sm" className="mt-0.5">
            {change.author?.avatar_url && (
              <AvatarImage src={change.author.avatar_url} alt={change.author.name} />
            )}
            <AvatarFallback
              className="text-[9px]"
              style={change.author?.color ? {
                borderColor: change.author.color,
                borderWidth: 2,
              } : undefined}
            >
              {change.author ? getInitials(change.author.name) : "?"}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground truncate">
              {isAI ? "System" : change.author?.name || "Unknown"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeTime(change.created_at)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="font-medium">{change.section_name}</span>
            {" > "}
            {FIELD_LABELS[change.field] || change.field}
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            {change.summary || "Updated content"}
          </p>
        </div>
      </div>
      {change.old_value != null && change.new_value != null && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-1.5 ml-8.5 text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {expanded ? "Hide diff" : "Show diff"}
        </button>
      )}
      {expanded && (
        <div className="mt-2 ml-8.5 p-2 rounded-md bg-muted/40 border border-border/50 max-h-[200px] overflow-y-auto">
          <ChangeDiffView
            oldValue={String(change.old_value || "")}
            newValue={String(change.new_value || "")}
          />
        </div>
      )}
    </div>
  );
}

export function ChangesPanel({
  changes,
  loading,
  onClose,
  activeSectionSlug,
}: ChangesPanelProps) {
  const [filter, setFilter] = useState<"all" | "active">("all");

  const filteredChanges = useMemo(() => {
    if (filter === "active" && activeSectionSlug) {
      return changes.filter((c) => c.section_slug === activeSectionSlug);
    }
    return changes;
  }, [changes, filter, activeSectionSlug]);

  const grouped = useMemo(() => groupByDate(filteredChanges), [filteredChanges]);
  const dateKeys = Object.keys(grouped);

  return (
    <div className="w-[280px] border-l border-border/60 bg-card/50 flex flex-col h-full shrink-0">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Changes
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {activeSectionSlug && (
        <div className="flex gap-1 px-3 py-2 border-b border-border/40">
          <button
            onClick={() => setFilter("all")}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              filter === "all"
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All sections
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              filter === "active"
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active section
          </button>
        </div>
      )}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : filteredChanges.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-muted-foreground">No changes yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Edits will appear here as you work
            </p>
          </div>
        ) : (
          <div className="py-1">
            {dateKeys.map((dateKey) => (
              <div key={dateKey}>
                <div className="px-3 py-1.5 sticky top-0 bg-card/80 backdrop-blur-sm z-10">
                  <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
                    {dateKey}
                  </span>
                </div>
                {grouped[dateKey].map((change) => (
                  <ChangeEntry key={change.id} change={change} />
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
