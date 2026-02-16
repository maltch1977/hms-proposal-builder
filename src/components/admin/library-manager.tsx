"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { LibraryItemForm } from "@/components/admin/library-item-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables, Json } from "@/lib/types/database";

type LibraryItem = Tables<"library_items">;
type SectionType = Tables<"section_types">;

export function LibraryManager() {
  const [sectionTypes, setSectionTypes] = useState<SectionType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  // Fetch section types
  useEffect(() => {
    if (!profile) return;
    supabase
      .from("section_types")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("default_order")
      .then(({ data }) => {
        const types = data || [];
        setSectionTypes(types);
        if (types.length > 0 && !selectedTypeId) {
          setSelectedTypeId(types[0].id);
        }
      });
  }, [profile, supabase, selectedTypeId]);

  // Fetch library items for selected type
  const fetchItems = useCallback(async () => {
    if (!selectedTypeId || !profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("library_items")
      .select("*")
      .eq("section_type_id", selectedTypeId)
      .eq("organization_id", profile.organization_id)
      .order("name");

    setItems(data || []);
    setLoading(false);
  }, [selectedTypeId, profile, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSave = async (data: {
    name: string;
    description: string;
    content: Json;
    is_default: boolean;
  }) => {
    if (!profile) return;
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("library_items")
        .update(data)
        .eq("id", editing.id);

      if (error) {
        toast.error("Failed to update library item");
      } else {
        toast.success("Library item updated");
        setEditing(null);
        fetchItems();
      }
    } else {
      const { error } = await supabase.from("library_items").insert({
        ...data,
        organization_id: profile.organization_id,
        section_type_id: selectedTypeId,
        created_by: profile.id,
      });

      if (error) {
        toast.error("Failed to create library item");
      } else {
        toast.success("Library item created");
        setCreating(false);
        fetchItems();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("library_items")
      .delete()
      .eq("id", id);

    if (!error) {
      toast.success("Library item deleted");
      fetchItems();
    }
  };

  const selectedType = sectionTypes.find((t) => t.id === selectedTypeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Content Libraries
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage reusable content templates for each section type.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground">
          Section Type:
        </label>
        <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select section type" />
          </SelectTrigger>
          <SelectContent>
            {sectionTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={items}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (item) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.name}</span>
                {item.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
              </div>
            ),
          },
          {
            key: "description",
            header: "Description",
            render: (item) => (
              <span className="text-muted-foreground">
                {item.description || "—"}
              </span>
            ),
          },
        ]}
        searchField="name"
        searchPlaceholder="Search library items..."
        onAdd={() => setCreating(true)}
        addLabel="Add Library Item"
        loading={loading}
        actions={(item) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(item);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      />

      <Dialog
        open={creating || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Create"} Library Item
              {selectedType && ` — ${selectedType.display_name}`}
            </DialogTitle>
          </DialogHeader>
          <LibraryItemForm
            item={editing}
            onSave={handleSave}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
