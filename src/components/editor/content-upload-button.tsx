"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface ContentUploadButtonProps {
  onAccept: (html: string, changeType?: "human" | "ai") => void;
}

export function ContentUploadButton({ onAccept }: ContentUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [extractedHtml, setExtractedHtml] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      // Upload file first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "proposal-files");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        toast.error("Failed to upload file");
        setLoading(false);
        return;
      }

      const uploadData = await uploadRes.json();

      // Extract content
      const extractRes = await fetch("/api/ai/extract-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "proposal-files", path: uploadData.path }),
      });

      if (!extractRes.ok) {
        toast.error("Failed to extract content");
        setLoading(false);
        return;
      }

      const { html } = await extractRes.json();
      setExtractedHtml(html);
      setShowPreview(true);
    } catch {
      toast.error("Content extraction failed");
    }

    setLoading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAccept = () => {
    if (extractedHtml) {
      onAccept(extractedHtml, "ai");
    }
    setShowPreview(false);
    setExtractedHtml(null);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Upload Content
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Extract content from a PDF or Word document</p>
        </TooltipContent>
      </Tooltip>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extracted Content</DialogTitle>
            <DialogDescription>
              Review the extracted content before applying it to the editor.
            </DialogDescription>
          </DialogHeader>

          <div
            className="prose prose-sm max-w-none rounded-lg border border-border bg-card p-3"
            dangerouslySetInnerHTML={{ __html: extractedHtml || "" }}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cancel
            </Button>
            <Button
              className="bg-hms-navy hover:bg-hms-navy-light"
              onClick={handleAccept}
            >
              Apply to Editor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
