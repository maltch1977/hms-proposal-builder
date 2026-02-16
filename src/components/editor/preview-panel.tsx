"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Loader2, XIcon } from "lucide-react";

interface PreviewPanelProps {
  proposalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewPanel({ proposalId, open, onOpenChange }: PreviewPanelProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    } catch {
      // Preview generation failed silently
    }
    setLoading(false);
  }, [proposalId]);

  useEffect(() => {
    if (open && !pdfUrl && !loading) {
      loadPreview();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[90vw] w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3.5 border-b border-border/70 flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-semibold">
            PDF Preview
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30 rounded-b-lg">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#zoom=page-width`}
              className="w-full h-full"
              title="PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center text-center">
                {loading ? (
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  {loading ? "Generating preview..." : "Click refresh to generate preview"}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
