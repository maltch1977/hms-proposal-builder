"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/admin/project-form";
import { PersonnelForm } from "@/components/admin/personnel-form";
import { ReferenceForm } from "@/components/admin/reference-form";
import type { AssetItem, AssetTypeKey, PastProject, Personnel, Reference } from "@/lib/types/asset-library";

interface AssetLibraryFormProps {
  assetType: AssetTypeKey;
  item: AssetItem | null;
  onSave: (data: Record<string, unknown>) => Promise<AssetItem | null>;
  onCancel: () => void;
}

export function AssetLibraryForm({
  assetType,
  item,
  onSave,
  onCancel,
}: AssetLibraryFormProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    await onSave(data);
    setSaving(false);
  };

  switch (assetType) {
    case "past_projects":
      return (
        <ProjectForm
          item={(item as PastProject) ?? null}
          onSave={(data) => handleSave(data as unknown as Record<string, unknown>)}
          onCancel={onCancel}
          saving={saving}
        />
      );
    case "personnel":
      return (
        <PersonnelForm
          item={(item as Personnel) ?? null}
          onSave={(data) => handleSave(data as unknown as Record<string, unknown>)}
          onCancel={onCancel}
          saving={saving}
        />
      );
    case "references":
      return (
        <ReferenceForm
          item={(item as Reference) ?? null}
          onSave={(data) => handleSave(data as unknown as Record<string, unknown>)}
          onCancel={onCancel}
          saving={saving}
        />
      );
  }
}
