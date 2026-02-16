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
import { Wand2, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PolishButtonProps {
  html: string;
  onAccept: (polishedHtml: string, changeType?: "human" | "ai") => void;
}

export function PolishButton({ html, onAccept }: PolishButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [polished, setPolished] = useState<string | null>(null);

  const handlePolish = async () => {
    if (!html || html === "<p></p>") return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      setPolished(data.polished);
      setShowPreview(true);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const handleAccept = () => {
    if (polished) {
      onAccept(polished, "ai");
    }
    setShowPreview(false);
    setPolished(null);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={handlePolish}
            disabled={loading || !html || html === "<p></p>"}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            Polish
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Refine writing for clarity and tone</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Changes</DialogTitle>
            <DialogDescription>
              Writing suggestions for improved clarity and tone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Current
              </p>
              <div
                className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/20 p-3 text-sm opacity-60"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Suggested
              </p>
              <div
                className="prose prose-sm max-w-none rounded-lg border border-hms-navy/30 bg-hms-navy/5 p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: polished || "" }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Keep Original
            </Button>
            <Button
              className="bg-hms-navy hover:bg-hms-navy-light"
              onClick={handleAccept}
            >
              Accept Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
