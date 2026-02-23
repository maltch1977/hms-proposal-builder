"use client";

import { FileUpload } from "@/components/editor/file-upload";
import { Button } from "@/components/ui/button";
import { FileText, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SectionFile {
  url: string;
  path: string;
  filename: string;
  type: string;
}

interface SectionFileUploadProps {
  files: SectionFile[];
  onChange: (files: SectionFile[]) => void;
}

export function SectionFileUpload({ files, onChange }: SectionFileUploadProps) {
  const [expanded, setExpanded] = useState(files.length > 0);

  const handleUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "proposal-files");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;

    const data = await res.json();
    const newFile: SectionFile = {
      url: data.url,
      path: data.path,
      filename: data.filename,
      type: file.type,
    };
    onChange([...files, newFile]);
    return data.url;
  };

  const handleRemove = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="border-t border-border pt-4 mt-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Supporting Documents{files.length > 0 ? ` (${files.length})` : ""}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.filename}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleRemove(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

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
            label="Upload supporting document"
          />
        </div>
      )}
    </div>
  );
}
