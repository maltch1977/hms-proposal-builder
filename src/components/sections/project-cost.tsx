"use client";

import { FileUpload } from "@/components/editor/file-upload";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import type { ProjectCostContent } from "@/lib/types/section";

interface ProjectCostProps {
  content: ProjectCostContent;
  onChange: (content: ProjectCostContent) => void;
  proposalId: string;
}

export function ProjectCost({ content, onChange, proposalId }: ProjectCostProps) {
  const files = content.files || [];

  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "proposal-files");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;

    const data = await res.json();
    const newFile = {
      url: data.url,
      path: data.path,
      filename: data.filename,
      type: file.type,
    };
    onChange({
      ...content,
      files: [...files, newFile],
    });
    return data.url;
  };

  const handleRemoveFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange({ ...content, files: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload your pricing document (PDF, Excel, Word, or image). This will be included in the final proposal package.
      </p>

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {f.type === "application/pdf" ? "PDF" : f.type.split("/").pop()?.toUpperCase() || "File"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => handleRemoveFile(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <FileUpload
        accept={{
          "application/pdf": [".pdf"],
          "image/*": [".png", ".jpg", ".jpeg", ".webp"],
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
          "application/vnd.ms-excel": [".xls"],
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          "application/msword": [".doc"],
        }}
        maxSize={25 * 1024 * 1024}
        onUpload={handleUpload}
        label="Upload pricing document (PDF, Excel, Word, or image)"
      />
    </div>
  );
}
