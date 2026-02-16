"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { ReferenceForm } from "@/components/admin/reference-form";
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
import { formatPhoneNumber } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type Reference = Tables<"references">;

export function ReferenceManager() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reference | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchReferences = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("references")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("contact_name");

    setReferences(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  const handleSave = async (data: {
    contact_name: string;
    title: string;
    company: string;
    phone: string;
    email: string | null;
    category: string;
  }) => {
    if (!profile) return;
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("references")
        .update(data)
        .eq("id", editing.id);

      if (error) {
        toast.error("Failed to update reference");
      } else {
        toast.success("Reference updated");
        setEditing(null);
        fetchReferences();
      }
    } else {
      const { error } = await supabase.from("references").insert({
        ...data,
        organization_id: profile.organization_id,
      });

      if (error) {
        toast.error("Failed to create reference");
      } else {
        toast.success("Reference created");
        setCreating(false);
        fetchReferences();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("references").delete().eq("id", id);
    if (!error) {
      toast.success("Reference deleted");
      fetchReferences();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">References</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage reference contacts for proposals.
        </p>
      </div>

      <DataTable
        data={references}
        columns={[
          {
            key: "contact_name",
            header: "Contact",
            render: (r) => <span className="font-medium">{r.contact_name}</span>,
          },
          { key: "title", header: "Title" },
          { key: "company", header: "Company" },
          {
            key: "category",
            header: "Category",
            render: (r) => (
              <Badge variant="outline" className="text-xs">
                {r.category}
              </Badge>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            render: (r) => (
              <span className="text-muted-foreground">
                {formatPhoneNumber(r.phone)}
              </span>
            ),
          },
        ]}
        searchField="contact_name"
        searchPlaceholder="Search references..."
        onAdd={() => setCreating(true)}
        addLabel="Add Reference"
        loading={loading}
        actions={(r) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(r);
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
                handleDelete(r.id);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Reference</DialogTitle>
          </DialogHeader>
          <ReferenceForm
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
