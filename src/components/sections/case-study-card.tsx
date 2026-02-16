"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Building2, Calendar, Ruler } from "lucide-react";
import { formatDate, formatSquareFootage } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;

interface CaseStudyCardProps {
  project: PastProject;
  onRemove: () => void;
}

function getFirstPhoto(photos: unknown): string | null {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  const first = photos[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "url" in first) return (first as { url: string }).url;
  return null;
}

export function CaseStudyCard({ project, onRemove }: CaseStudyCardProps) {
  const photoUrl = getFirstPhoto(project.photos);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      {photoUrl ? (
        <div className="w-24 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
          <Image
            src={photoUrl}
            alt={project.project_name}
            width={96}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-16 w-24 items-center justify-center rounded-md bg-hms-navy/5 flex-shrink-0">
          <Building2 className="h-6 w-6 text-hms-navy/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-medium text-foreground">
          {project.project_name}
        </h5>
        <p className="text-xs text-muted-foreground mt-0.5">
          {project.client_name}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {project.building_type}
          </span>
          {project.square_footage && (
            <span className="inline-flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {formatSquareFootage(project.square_footage)}
            </span>
          )}
          {project.completion_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(project.completion_date)}
            </span>
          )}
        </div>
        {project.narrative && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {project.narrative}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
