"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface AutoSaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity duration-300",
        status === "saving" && "text-muted-foreground",
        status === "saved" && "text-emerald-600",
        status === "error" && "text-destructive"
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
}
