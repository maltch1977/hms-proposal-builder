"use client";

import Image from "next/image";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { PolishButton } from "@/components/editor/polish-button";
import { Button } from "@/components/ui/button";
import { User, BookMarked } from "lucide-react";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

interface PersonnelBioCardProps {
  member: TeamMemberWithPersonnel;
  bio: string;
  onBioChange: (html: string) => void;
  description?: string;
  onDescriptionChange?: (value: string) => void;
  isLibraryFallback?: boolean;
  onSaveToLibrary?: () => void;
  onRoleChange?: (role: string) => void;
}

export function PersonnelBioCard({ member, bio, onBioChange, description, onDescriptionChange, isLibraryFallback, onSaveToLibrary, onRoleChange }: PersonnelBioCardProps) {
  const p = member.personnel;
  const displayRole = member.role_override || p.title;

  const currentYear = new Date().getFullYear();
  const stats = [
    p.year_started_in_trade != null && `Yrs in Trade: ${currentYear - p.year_started_in_trade}`,
    p.years_at_company != null && `Yrs Company: ${p.years_at_company}`,
    p.years_with_distech != null && `Yrs Controls: ${p.years_with_distech}`,
  ].filter(Boolean);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      {/* Header: photo + name/role + polish button */}
      <div className="flex items-start gap-3">
        {p.photo_url ? (
          <Image
            src={p.photo_url}
            alt={p.full_name}
            width={48}
            height={48}
            className="rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {p.full_name}
          </h4>
          {onRoleChange ? (
            <input
              type="text"
              defaultValue={member.role_override || ""}
              placeholder={p.role_type}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val !== (member.role_override || "")) {
                  onRoleChange(val);
                }
              }}
              className="text-xs text-muted-foreground w-full bg-transparent border-0 border-b border-transparent hover:border-border focus:border-muted-foreground p-0 focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
            />
          ) : (
            <p className="text-xs text-muted-foreground truncate">{displayRole}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onSaveToLibrary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={onSaveToLibrary}
            >
              <BookMarked className="h-3 w-3" />
              Save to Library
            </Button>
          )}
          <PolishButton
            html={bio}
            onAccept={(polished) => onBioChange(polished)}
          />
        </div>
      </div>

      {isLibraryFallback && (
        <p className="text-xs text-muted-foreground italic">
          Pre-filled from library
        </p>
      )}

      {/* Stats row */}
      {stats.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {stats.join(" · ")}
        </p>
      )}

      {/* Optional short description — shows under person's name in Key Personnel PDF */}
      {onDescriptionChange && (
        <textarea
          defaultValue={description || ""}
          placeholder="Optional description (shows under name in PDF)"
          onBlur={(e) => onDescriptionChange(e.target.value.trim())}
          rows={2}
          className="w-full text-xs text-foreground bg-transparent border border-border rounded-md px-2 py-1.5 resize-none focus:ring-1 focus:ring-ring focus:outline-none placeholder:text-muted-foreground/50"
        />
      )}

      {/* Certs + Specialties */}
      {(p.certifications.length > 0 || p.specialties.length > 0) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {p.certifications.length > 0 && (
            <span>Certs: {p.certifications.join(", ")}</span>
          )}
          {p.specialties.length > 0 && (
            <span>Specialties: {p.specialties.join(", ")}</span>
          )}
        </div>
      )}

      {/* Bio editor */}
      <RichTextEditor
        content={bio}
        onChange={onBioChange}
        placeholder={`Write a bio for ${p.full_name} addressing the RFP requirements...`}
      />
    </div>
  );
}
