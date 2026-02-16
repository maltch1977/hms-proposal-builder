"use client";

import { Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";

interface AuthoredFieldProps {
  attribution?: FieldAttribution;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AuthoredField({ attribution, children, actions }: AuthoredFieldProps) {
  const hasHeader = attribution || actions;

  if (!hasHeader) {
    return <>{children}</>;
  }

  const isAI = attribution?.changeType === "ai";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {attribution ? (
          <div className="flex items-center gap-1.5">
            {isAI ? (
              <Sparkles
                className="h-3 w-3 shrink-0"
                style={{ color: attribution.authorColor }}
              />
            ) : (
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: attribution.authorColor }}
              />
            )}
            <span className="text-[11px] text-muted-foreground">
              {isAI ? "Auto-generated" : `Edited by ${attribution.authorName}`}
              <span className="mx-1">&middot;</span>
              {formatRelativeTime(attribution.timestamp)}
            </span>
          </div>
        ) : (
          <div />
        )}
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </div>
  );
}
