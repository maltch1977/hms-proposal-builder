"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/editor/file-upload";
import type { CoverPageContent } from "@/lib/types/section";
import type { Tables } from "@/lib/types/database";

type CoverPhoto = Tables<"cover_photos">;

interface CoverPageProps {
  content: CoverPageContent;
  onChange: (content: CoverPageContent) => void;
  proposalId: string;
}

export function CoverPage({ content, onChange, proposalId }: CoverPageProps) {
  const [suggestedPhotos, setSuggestedPhotos] = useState<CoverPhoto[]>([]);
  const [allPhotos, setAllPhotos] = useState<CoverPhoto[]>([]);
  const supabase = createClient();

  const fetchSuggestedPhotos = useCallback(async () => {
    // Fetch proposal metadata
    const { data: proposal } = await supabase
      .from("proposals")
      .select("metadata, organization_id")
      .eq("id", proposalId)
      .single();

    if (!proposal) return;

    const metadata = (proposal.metadata || {}) as Record<string, unknown>;
    const projectType = metadata.project_type as string | undefined;
    const buildingType = metadata.building_type as string | undefined;

    // Fetch all cover photos
    const { data: photos } = await supabase
      .from("cover_photos")
      .select("*")
      .eq("organization_id", proposal.organization_id)
      .order("created_at", { ascending: false });

    if (!photos) return;

    setAllPhotos(photos);

    // Filter suggested photos based on matching metadata
    if (projectType || buildingType) {
      const suggested = photos.filter((p) => {
        const matchesProject = projectType && p.project_type === projectType;
        const matchesBuilding = buildingType && p.building_type === buildingType;
        return matchesProject || matchesBuilding;
      });
      setSuggestedPhotos(suggested);
    }
  }, [proposalId, supabase]);

  useEffect(() => {
    if (content.cover_template === "photo") {
      fetchSuggestedPhotos();
    }
  }, [content.cover_template, fetchSuggestedPhotos]);

  const update = (field: keyof CoverPageContent, value: string) => {
    onChange({ ...content, [field]: value });
  };

  const handlePhotoUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "cover-photos");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) return null;

    const data = await res.json();
    onChange({ ...content, cover_photo_url: data.url });
    return data.url;
  };

  const handleSelectPhoto = (url: string) => {
    onChange({ ...content, cover_photo_url: url });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Cover Template</Label>
        <RadioGroup
          value={content.cover_template || "no_photo"}
          onValueChange={(v) => update("cover_template", v)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no_photo" id="no_photo" />
            <Label htmlFor="no_photo" className="font-normal cursor-pointer">
              Clean Typography
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="photo" id="photo" />
            <Label htmlFor="photo" className="font-normal cursor-pointer">
              With Project Photo
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cover-client">Client Name</Label>
          <Input
            id="cover-client"
            placeholder="Client name"
            value={content.client_name || ""}
            onChange={(e) => update("client_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cover-label">Document Label</Label>
          <Input
            id="cover-label"
            placeholder="RESPONSE TO RFP"
            value={content.project_label || "RESPONSE TO RFP"}
            onChange={(e) => update("project_label", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover-address">Client Address</Label>
        <Input
          id="cover-address"
          placeholder="Client address"
          value={content.client_address || ""}
          onChange={(e) => update("client_address", e.target.value)}
        />
      </div>

      {(content.cover_template === "photo") && (
        <div className="space-y-3">
          <Label>Cover Photo</Label>

          {suggestedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Suggested</p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedPhotos.slice(0, 6).map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelectPhoto(photo.url)}
                    className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-colors ${
                      content.cover_photo_url === photo.url
                        ? "border-hms-navy"
                        : "border-border hover:border-hms-navy/50"
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {allPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {suggestedPhotos.length > 0 ? "All Photos" : "Photo Library"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {allPhotos
                  .filter((p) => !suggestedPhotos.some((sp) => sp.id === p.id))
                  .slice(0, 9)
                  .map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => handleSelectPhoto(photo.url)}
                      className={`relative aspect-video rounded-lg border-2 overflow-hidden transition-colors ${
                        content.cover_photo_url === photo.url
                          ? "border-hms-navy"
                          : "border-border hover:border-hms-navy/50"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.filename}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
              </div>
            </div>
          )}

          <FileUpload
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            onUpload={handlePhotoUpload}
            currentFileUrl={content.cover_photo_url}
            currentFileName="Cover photo"
            onRemove={() => onChange({ ...content, cover_photo_url: undefined })}
            label="Upload cover photo"
          />
        </div>
      )}
    </div>
  );
}
