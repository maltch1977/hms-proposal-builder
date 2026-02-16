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
import { Check, X, ArrowRight } from "lucide-react";
import type { LanguageSuggestion } from "@/lib/ai/types";

interface StrengthenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: LanguageSuggestion[];
  onAcceptSuggestion: (suggestion: LanguageSuggestion) => void;
}

export function StrengthenDialog({
  open,
  onOpenChange,
  suggestions,
  onAcceptSuggestion,
}: StrengthenDialogProps) {
  const [handled, setHandled] = useState<Set<string>>(new Set());

  const activeSuggestions = suggestions.filter((s) => !handled.has(s.id));

  // Group by section
  const grouped = activeSuggestions.reduce<Record<string, LanguageSuggestion[]>>(
    (acc, s) => {
      const key = s.section_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {}
  );

  const handleAccept = (suggestion: LanguageSuggestion) => {
    onAcceptSuggestion(suggestion);
    setHandled((prev) => new Set([...prev, suggestion.id]));
  };

  const handleDismiss = (id: string) => {
    setHandled((prev) => new Set([...prev, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Strengthen Language</DialogTitle>
          <DialogDescription>
            {activeSuggestions.length === 0
              ? "All suggestions have been addressed."
              : `${activeSuggestions.length} suggestion${activeSuggestions.length !== 1 ? "s" : ""} for stronger, more competitive language.`}
          </DialogDescription>
        </DialogHeader>

        {activeSuggestions.length > 0 && (
          <div className="space-y-4 py-2">
            {Object.entries(grouped).map(([sectionName, items]) => (
              <div key={sectionName}>
                <Badge variant="outline" className="mb-2 text-xs">
                  {sectionName}
                </Badge>
                <div className="space-y-2">
                  {items.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-lg border border-border p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through text-muted-foreground">
                          {suggestion.original}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {suggestion.suggested}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.reason}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAccept(suggestion)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Accept
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => handleDismiss(suggestion.id)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Skip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
