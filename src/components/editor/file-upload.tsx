"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  onUpload: (file: File) => Promise<string | null>;
  currentFileUrl?: string | null;
  currentFileName?: string | null;
  onRemove?: () => void;
  disabled?: boolean;
  label?: string;
}

export function FileUpload({
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    "application/pdf": [".pdf"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  onUpload,
  currentFileUrl,
  currentFileName,
  onRemove,
  disabled = false,
  label = "Upload file",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        await onUpload(acceptedFiles[0]);
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Upload failed — please try again");
      }
      setUploading(false);
    },
    [onUpload]
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (!rejection) return;
    const code = rejection.errors[0]?.code;
    if (code === "file-too-large") {
      toast.error(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
    } else if (code === "file-invalid-type") {
      toast.error("Unsupported file type. Please upload a PDF or image file.");
    } else {
      toast.error(rejection.errors[0]?.message || "File rejected");
    }
  }, [maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  if (currentFileUrl) {
    const isImage = currentFileUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i);
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {isImage ? (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentFileName || "Uploaded file"}
          </p>
          <p className="text-xs text-muted-foreground">Click to replace</p>
        </div>
        {onRemove && !disabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 px-6 py-8 transition-colors cursor-pointer",
        isDragActive && "border-hms-navy bg-hms-navy/5",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            {isDragActive ? "Drop file here" : label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Drag and drop or click to browse
          </p>
        </>
      )}
    </div>
  );
}
