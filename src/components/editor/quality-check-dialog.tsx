"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lightbulb, ArrowRight, Check } from "lucide-react";
import type { QualityCheckIssue } from "@/lib/ai/types";

interface QualityCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: QualityCheckIssue[];
  onNavigateToSection: (sectionSlug: string) => void;
  onProceedExport: () => void;
}

export function QualityCheckDialog({
  open,
  onOpenChange,
  issues,
  onNavigateToSection,
  onProceedExport,
}: QualityCheckDialogProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeIssues = issues.filter((i) => !dismissed.has(i.id));
  const warnings = activeIssues.filter((i) => i.severity === "warning");
  const suggestions = activeIssues.filter((i) => i.severity === "suggestion");

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const handleFixAndGo = (sectionSlug: string) => {
    onOpenChange(false);
    onNavigateToSection(sectionSlug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Before Exporting</DialogTitle>
          <DialogDescription>
            {activeIssues.length === 0
              ? "All items have been addressed. Ready to export."
              : `Found ${activeIssues.length} item${activeIssues.length !== 1 ? "s" : ""} to review.`}
          </DialogDescription>
        </DialogHeader>

        {activeIssues.length > 0 && (
          <div className="space-y-3 py-2">
            {warnings.length > 0 && (
              <div className="space-y-2">
                {warnings.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {issue.section_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{issue.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {issue.suggestion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleFixAndGo(issue.section_slug)}
                        >
                          Go to section
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => handleDismiss(issue.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                {suggestions.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {issue.section_name}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground">{issue.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {issue.suggestion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleFixAndGo(issue.section_slug)}
                        >
                          Go to section
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => handleDismiss(issue.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-hms-navy hover:bg-hms-navy-light"
            onClick={onProceedExport}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {activeIssues.length === 0 ? "Export PDF" : "Export Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
