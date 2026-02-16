"use client";

import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LockIndicatorProps {
  lockLevel: string;
}

export function LockIndicator({ lockLevel }: LockIndicatorProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant="secondary"
          className="gap-1 text-[11px] text-muted-foreground border-0 bg-amber-50 text-amber-700"
        >
          <Lock className="h-3 w-3" />
          Locked
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p className="text-xs">
          This content is locked. Contact your administrator to request changes.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
