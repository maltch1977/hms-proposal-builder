"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { PROJECT_TYPES, BUILDING_TYPES } from "@/lib/utils/constants";
import type { Tables, Json } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;

interface ProjectPhoto {
  url: string;
  filename: string;
}

function parsePhotos(raw: Json | undefined): ProjectPhoto[] {
  if (!raw || !Array.isArray(raw)) return [];
  return (raw as unknown[]).filter(
    (p): p is ProjectPhoto =>
      typeof p === "object" && p !== null && "url" in p && "filename" in p
  );
}

interface ProjectFormProps {
  item?: PastProject | null;
  onSave: (data: {
    project_name: string;
    project_type: string;
    building_type: string;
    client_name: string;
    square_footage: number | null;
    completion_date: string | null;
    narrative: string | null;
    photos?: ProjectPhoto[];
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ProjectForm({
  item,
  onSave,
  onCancel,
  saving,
}: ProjectFormProps) {
  const [projectName, setProjectName] = useState(item?.project_name || "");
  const [projectType, setProjectType] = useState(item?.project_type || "New Construction");
  const [buildingType, setBuildingType] = useState(item?.building_type || "Office");
  const [clientName, setClientName] = useState(item?.client_name || "");
  const [sqft, setSqft] = useState(item?.square_footage?.toString() || "");
  const [completionDate, setCompletionDate] = useState(item?.completion_date || "");
  const [narrative, setNarrative] = useState(item?.narrative || "");
  const [photos, setPhotos] = useState<ProjectPhoto[]>(parsePhotos(item?.photos));
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      project_name: projectName,
      project_type: projectType,
      building_type: buildingType,
      client_name: clientName,
      square_footage: sqft ? parseInt(sqft) : null,
      completion_date: completionDate || null,
      narrative: narrative || null,
      photos,
    });
  };

  const uploadPhoto = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "project-photos");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error || "Upload failed");
      return null;
    }

    return { url: json.url as string, filename: json.filename as string };
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      const results = await Promise.all(acceptedFiles.map(uploadPhoto));
      const successful = results.filter((r): r is ProjectPhoto => r !== null);
      if (successful.length > 0) {
        setPhotos((prev) => [...prev, ...successful]);
      }
      setUploading(false);
    },
    [uploadPhoto]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proj-name">Project Name</Label>
          <Input
            id="proj-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proj-client">Client Name</Label>
          <Input
            id="proj-client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Project Type</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Building Type</Label>
          <Select value={buildingType} onValueChange={setBuildingType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILDING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proj-sqft">Square Footage</Label>
          <Input
            id="proj-sqft"
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            placeholder="e.g., 150000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proj-date">Completion Date</Label>
          <Input
            id="proj-date"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proj-narrative">Project Narrative</Label>
        <Textarea
          id="proj-narrative"
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Describe the project scope and accomplishments..."
          rows={4}
        />
      </div>

      {/* Photos Section */}
      <div className="space-y-2">
        <Label>Project Photos</Label>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, i) => (
              <div key={i} className="relative group rounded-md overflow-hidden border border-border aspect-video bg-muted">
                <img
                  src={photo.url}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          {...getRootProps()}
          className={`flex items-center justify-center rounded-md border-2 border-dashed border-border px-4 py-4 text-sm text-muted-foreground cursor-pointer transition-colors hover:border-muted-foreground/40 ${
            isDragActive ? "border-primary bg-primary/5" : ""
          }`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span>{isDragActive ? "Drop photos here" : "Drop photos here or click to upload"}</span>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!projectName || !clientName || saving}>
          {saving ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
