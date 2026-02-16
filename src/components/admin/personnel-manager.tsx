"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { PersonnelForm } from "@/components/admin/personnel-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type Personnel = Tables<"personnel">;

export function PersonnelManager() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchPersonnel = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("personnel")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("full_name");

    setPersonnel(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const handleSave = async (data: Omit<Personnel, "id" | "organization_id" | "photo_url" | "created_at" | "updated_at">) => {
    if (!profile) return;
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("personnel")
        .update(data)
        .eq("id", editing.id);

      if (error) {
        toast.error("Failed to update personnel");
      } else {
        toast.success("Personnel updated");
        setEditing(null);
        fetchPersonnel();
      }
    } else {
      const { error } = await supabase.from("personnel").insert({
        ...data,
        organization_id: profile.organization_id,
      });

      if (error) {
        toast.error("Failed to create personnel");
      } else {
        toast.success("Personnel created");
        setCreating(false);
        fetchPersonnel();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("personnel").delete().eq("id", id);
    if (!error) {
      toast.success("Personnel deleted");
      fetchPersonnel();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Personnel Roster
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage team members available for proposal assignments.
        </p>
      </div>

      <DataTable
        data={personnel}
        columns={[
          {
            key: "full_name",
            header: "Name",
            render: (p) => <span className="font-medium">{p.full_name}</span>,
          },
          { key: "title", header: "Title" },
          {
            key: "role_type",
            header: "Role",
            render: (p) => (
              <Badge variant="outline" className="text-xs">
                {p.role_type}
              </Badge>
            ),
          },
          {
            key: "years_in_industry",
            header: "Yrs Industry",
            render: (p) => (
              <span className="text-muted-foreground">
                {p.years_in_industry ?? "—"}
              </span>
            ),
            className: "text-center",
          },
          {
            key: "is_active",
            header: "Status",
            render: (p) => (
              <Badge variant={p.is_active ? "default" : "secondary"} className="text-xs">
                {p.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
        searchField="full_name"
        searchPlaceholder="Search personnel..."
        onAdd={() => setCreating(true)}
        addLabel="Add Personnel"
        loading={loading}
        actions={(p) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(p);
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
                handleDelete(p.id);
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
              {editing ? "Edit" : "Add"} Personnel
            </DialogTitle>
          </DialogHeader>
          <PersonnelForm
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
