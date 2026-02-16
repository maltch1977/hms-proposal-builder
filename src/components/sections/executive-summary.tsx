"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AuthoredField } from "@/components/editor/authored-field";
import { PolishButton } from "@/components/editor/polish-button";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ExecutiveSummaryContent } from "@/lib/types/section";
import type { FieldAttribution } from "@/lib/utils/derive-field-attributions";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

interface ExecutiveSummaryProps {
  content: ExecutiveSummaryContent;
  onChange: (content: ExecutiveSummaryContent, changeType?: "human" | "ai") => void;
  proposalId: string;
  fieldAttributions?: Record<string, FieldAttribution>;
  fieldHighlights?: Record<string, AttributedSegment[]>;
}

export function ExecutiveSummary({
  content,
  onChange,
  proposalId,
  fieldAttributions,
  fieldHighlights,
}: ExecutiveSummaryProps) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (content.body && content.body !== "<p></p>") {
      const confirmed = window.confirm(
        "This will replace the current content. Continue?"
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    try {
      // Fetch the full proposal data for context
      const proposalRes = await fetch(`/api/proposals/${proposalId}/export-data`);
      if (!proposalRes.ok) {
        toast.error("Failed to load proposal data");
        setGenerating(false);
        return;
      }
      const proposalData = await proposalRes.json();

      const res = await fetch("/api/ai/executive-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalData }),
      });

      if (!res.ok) {
        toast.error("Failed to generate summary");
        setGenerating(false);
        return;
      }

      const data = await res.json();
      onChange({ ...content, body: data.html }, "ai");
      toast.success("Summary generated");
    } catch {
      toast.error("Generation failed");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          A concise overview of the entire proposal. Generate from your completed
          sections or write manually.
        </p>
        <div className="flex items-center gap-2">
          <PolishButton
            html={content.body || ""}
            onAccept={(polished, ct) => onChange({ ...content, body: polished }, ct)}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {content.body ? "Regenerate" : "Generate Summary"}
          </Button>
        </div>
      </div>
      <AuthoredField attribution={fieldAttributions?.body}>
        <RichTextEditor
          content={content.body || ""}
          onChange={(html) => onChange({ ...content, body: html })}
          placeholder="Executive summary will appear here..."
          authorHighlights={fieldHighlights?.body}
        />
      </AuthoredField>
    </div>
  );
}
