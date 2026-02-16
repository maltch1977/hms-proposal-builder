"use client";

import { useState } from "react";
import { FileUpload } from "@/components/editor/file-upload";
import { ExecutionStrategy } from "@/components/sections/execution-strategy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ProjectScheduleContent } from "@/lib/types/section";

interface ProjectScheduleProps {
  content: ProjectScheduleContent;
  onChange: (content: ProjectScheduleContent) => void;
  proposalId: string;
}

export function ProjectSchedule({
  content,
  onChange,
  proposalId,
}: ProjectScheduleProps) {
  const [generating, setGenerating] = useState(false);
  const outputMode = content.output_mode || "raw";
  const hasFiles = (content.files || []).length > 0;

  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "proposal-files");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;

    const data = await res.json();
    const newFile = { url: data.url, path: data.path, filename: data.filename, type: file.type };
    onChange({
      ...content,
      files: [...(content.files || []), newFile],
      output_mode: content.output_mode || "raw",
    });
    return data.url;
  };

  const handleRemoveFile = (index: number) => {
    const files = [...(content.files || [])];
    files.splice(index, 1);
    onChange({ ...content, files });
  };

  const handleGenerateStrategy = async () => {
    if (!hasFiles) return;

    if (content.execution_strategy?.approach_narrative) {
      const confirmed = window.confirm(
        "Regenerate Execution Strategy? This will overwrite current edits."
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    try {
      const firstFile = (content.files || [])[0];
      const res = await fetch("/api/ai/analyze-gantt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "proposal-files", path: firstFile.path }),
      });

      if (!res.ok) {
        toast.error("Failed to analyze Gantt chart");
        setGenerating(false);
        return;
      }

      const { strategy } = await res.json();
      onChange({
        ...content,
        execution_strategy: strategy,
        output_mode: content.output_mode === "raw" ? "both" : content.output_mode,
      });
      toast.success("Execution strategy generated");
    } catch {
      toast.error("Analysis failed");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Upload Gantt chart exports from Microsoft Project. Files will be embedded
        directly in the proposal.
      </p>

      {(content.files || []).map((file, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.filename}</p>
          </div>
          <button
            onClick={() => handleRemoveFile(idx)}
            className="text-muted-foreground hover:text-destructive text-xs"
          >
            Remove
          </button>
        </div>
      ))}

      <FileUpload
        accept={{
          "image/*": [".png", ".jpg", ".jpeg"],
          "application/pdf": [".pdf"],
        }}
        onUpload={handleUpload}
        label="Upload Gantt chart"
      />

      {hasFiles && (
        <div className="border-t border-border pt-4 space-y-4">
          <div className="space-y-2">
            <Label>Output Mode</Label>
            <RadioGroup
              value={outputMode}
              onValueChange={(v) =>
                onChange({
                  ...content,
                  output_mode: v as "raw" | "ai_only" | "both",
                })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="raw" id="raw" />
                <Label htmlFor="raw" className="font-normal cursor-pointer text-sm">
                  Gantt Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai_only" id="ai_only" />
                <Label htmlFor="ai_only" className="font-normal cursor-pointer text-sm">
                  Strategy Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal cursor-pointer text-sm">
                  Both
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(outputMode === "ai_only" || outputMode === "both") && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleGenerateStrategy}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {content.execution_strategy
                  ? "Regenerate Execution Strategy"
                  : "Generate Execution Strategy"}
              </Button>

              <ExecutionStrategy content={content} onChange={onChange} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
