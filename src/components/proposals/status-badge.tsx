"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  type ProposalStatus,
} from "@/lib/utils/constants";

interface StatusBadgeProps {
  status: ProposalStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[11px] font-medium border-0",
        STATUS_COLORS[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
