"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/editor/file-upload";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type CoverPhoto = Tables<"cover_photos">;

export function CoverPhotoManager() {
  const [photos, setPhotos] = useState<CoverPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchPhotos = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("cover_photos")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    setPhotos(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpload = async (file: File): Promise<string | null> => {
    if (!profile) return null;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "cover-photos");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      toast.error("Upload failed");
      return null;
    }

    const data = await res.json();

    const { error } = await supabase.from("cover_photos").insert({
      organization_id: profile.organization_id,
      url: data.url,
      filename: data.filename,
      uploaded_by: profile.id,
    });

    if (error) {
      toast.error("Failed to save photo record");
    } else {
      toast.success("Cover photo uploaded");
      fetchPhotos();
    }

    return data.url;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cover_photos").delete().eq("id", id);
    if (!error) {
      toast.success("Photo deleted");
      fetchPhotos();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Cover Photos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload project photos available for proposal cover pages.
        </p>
      </div>

      <FileUpload
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
        onUpload={handleUpload}
        label="Upload cover photo"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading photos...</p>
      ) : photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No cover photos uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-lg border border-border overflow-hidden aspect-[4/3] bg-muted"
            >
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                <span className="text-xs text-white truncate flex-1">
                  {photo.filename}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => handleDelete(photo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {photo.building_type && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {photo.building_type}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded
      </p>
    </div>
  );
}
