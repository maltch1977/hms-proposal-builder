"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SectionTypeOption {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  default_order: number;
}

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSlugs: string[];
  onAdd: (sectionTypeId: string) => void;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  existingSlugs,
  onAdd,
}: AddSectionDialogProps) {
  const [sectionTypes, setSectionTypes] = useState<SectionTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!open || !profile) return;

    const fetchTypes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("section_types")
        .select("id, slug, display_name, description, default_order")
        .eq("organization_id", profile.organization_id)
        .order("default_order", { ascending: true });

      setSectionTypes(data || []);
      setLoading(false);
    };

    fetchTypes();
  }, [open, profile, supabase]);

  const availableTypes = sectionTypes.filter(
    (t) => !existingSlugs.includes(t.slug)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : availableTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              All available sections have been added.
            </p>
          ) : (
            availableTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  onAdd(type.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{type.display_name}</p>
                  {type.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {type.description}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
