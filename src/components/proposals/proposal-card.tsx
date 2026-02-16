"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/format";
import { StatusBadge } from "@/components/proposals/status-badge";
import type { Tables } from "@/lib/types/database";
import type { ProposalStatus } from "@/lib/utils/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, Archive, ExternalLink } from "lucide-react";

type Proposal = Tables<"proposals">;

interface ProposalCardProps {
  proposal: Proposal;
  onDuplicate?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function ProposalCard({
  proposal,
  onDuplicate,
  onArchive,
}: ProposalCardProps) {
  return (
    <Link
      href={`/proposals/${proposal.id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all duration-150 hover:border-border/80 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-hms-navy transition-colors">
            {proposal.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground truncate">
            {proposal.client_name}
          </p>
        </div>
        <div className="ml-3 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <StatusBadge status={proposal.status as ProposalStatus} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/proposals/${proposal.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(proposal.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onArchive?.(proposal.id)}
                className="text-muted-foreground"
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{formatRelativeTime(proposal.updated_at)}</span>
        {proposal.client_address && (
          <>
            <span className="text-border">|</span>
            <span className="truncate">{proposal.client_address}</span>
          </>
        )}
      </div>
    </Link>
  );
}
