"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/proposals/status-badge";
import { AutoSaveIndicator } from "@/components/editor/auto-save-indicator";
import { ArrowLeft, Eye, Download, Loader2, ClipboardCheck, ChevronDown, CircleCheck, CircleAlert, Circle, History } from "lucide-react";
import type { Tables } from "@/lib/types/database";
import type { ProposalStatus } from "@/lib/utils/constants";
import type { RFPRequirement, RequirementMapping } from "@/lib/ai/types";
import { HIGHLIGHTER_COLORS } from "@/lib/utils/compute-author-highlights";

type Proposal = Tables<"proposals">;

interface Collaborator {
  id: string;
  profile_id: string;
  role: string;
  color: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface EditorTopbarProps {
  proposal: Proposal;
  saveStatus: "idle" | "saving" | "saved" | "error";
  onTogglePreview: () => void;
  showPreview: boolean;
  onExport: () => void;
  checkingQuality?: boolean;
  hasRequirements?: boolean;
  requirements?: RFPRequirement[];
  requirementMappings?: RequirementMapping[];
  onToggleChanges?: () => void;
  showChanges?: boolean;
  collaborators?: Collaborator[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EditorTopbar({
  proposal,
  saveStatus,
  onTogglePreview,
  showPreview,
  onExport,
  checkingQuality = false,
  hasRequirements = false,
  requirements = [],
  requirementMappings = [],
  onToggleChanges,
  showChanges = false,
  collaborators = [],
}: EditorTopbarProps) {
  const mappingByReqId = requirementMappings.reduce<Record<string, RequirementMapping>>(
    (acc, m) => { acc[m.req_id] = m; return acc; }, {}
  );
  const addressedCount = requirements.filter((r) => mappingByReqId[r.id]?.req_type === "addressed").length;
  const needsInputCount = requirements.filter((r) => mappingByReqId[r.id]?.req_type === "needs_input").length;
  const unmappedCount = requirements.length - addressedCount - needsInputCount;
  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-xl px-5">
      <div className="flex items-center gap-3">
        <Link href="/proposals">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] tracking-[-0.01em] font-semibold text-foreground truncate max-w-[300px]">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status as ProposalStatus} />
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[300px]">
            {proposal.client_name}
          </p>
        </div>
        <AutoSaveIndicator status={saveStatus} />
      </div>
      <div className="flex items-center gap-2">
        {collaborators.length > 0 && (
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {collaborators.slice(0, 5).map((c, i) => {
                const bgColor = HIGHLIGHTER_COLORS[i % HIGHLIGHTER_COLORS.length];
                return (
                  <Tooltip key={c.profile_id}>
                    <TooltipTrigger asChild>
                      <Avatar size="sm">
                        {c.avatar_url && (
                          <AvatarImage src={c.avatar_url} alt={c.name} />
                        )}
                        <AvatarFallback
                          className="text-[9px] font-bold text-white"
                          style={{ backgroundColor: bgColor }}
                        >
                          {getInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {c.name} ({c.role})
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
        {hasRequirements && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-8"
              >
                <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                Requirements
                <ChevronDown className="ml-1.5 h-3 w-3" />
              </Button>
            </PopoverTrigger>
              <PopoverContent align="end" className="w-[340px] p-0 overflow-hidden">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    RFP Requirements
                  </span>
                  <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CircleCheck className="h-3 w-3 text-green-500" />{addressedCount}</span>
                    <span className="flex items-center gap-1"><CircleAlert className="h-3 w-3 text-amber-400" />{needsInputCount}</span>
                    <span className="flex items-center gap-1"><Circle className="h-3 w-3" />{unmappedCount}</span>
                  </div>
                </div>
                <ScrollArea className="h-[min(400px,60vh)]">
                  <div className="p-1.5 space-y-px">
                    {requirements.map((req) => {
                      const mapping = mappingByReqId[req.id];
                      const status = mapping?.req_type || "unmapped";
                      return (
                        <div
                          key={req.id}
                          className={`flex items-start gap-2 rounded px-2 py-1.5 ${
                            status === "addressed"
                              ? "bg-green-50 dark:bg-green-950/20"
                              : status === "needs_input"
                                ? "bg-amber-50 dark:bg-amber-950/20"
                                : ""
                          }`}
                        >
                          {status === "addressed" ? (
                            <CircleCheck className="h-3 w-3 mt-[3px] shrink-0 text-green-500" />
                          ) : status === "needs_input" ? (
                            <CircleAlert className="h-3 w-3 mt-[3px] shrink-0 text-amber-400" />
                          ) : (
                            <Circle className="h-3 w-3 mt-[3px] shrink-0 text-muted-foreground/30" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] leading-snug text-foreground">{req.description}</p>
                            {mapping?.note && (
                              <p className="text-[10px] leading-tight text-muted-foreground mt-0.5 italic">
                                {mapping.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PopoverContent>
          </Popover>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChanges ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleChanges}
                className="h-8 w-8"
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Change log
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant={showPreview ? "secondary" : "outline"}
          size="sm"
          onClick={onTogglePreview}
          className="h-8"
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          className="h-8 bg-gradient-to-r from-hms-navy to-hms-blue hover:from-hms-navy-light hover:to-hms-blue/90 shadow-sm"
          disabled={checkingQuality}
        >
          {checkingQuality ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Export PDF
        </Button>
      </div>
    </header>
  );
}
