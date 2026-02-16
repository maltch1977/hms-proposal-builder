"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { ProjectForm } from "@/components/admin/project-form";
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
import { formatDate, formatSquareFootage } from "@/lib/utils/format";
import type { Tables } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;

export function ProjectManager() {
  const [projects, setProjects] = useState<PastProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PastProject | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("past_projects")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("project_name");

    setProjects(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSave = async (data: {
    project_name: string;
    project_type: string;
    building_type: string;
    client_name: string;
    square_footage: number | null;
    completion_date: string | null;
    narrative: string | null;
  }) => {
    if (!profile) return;
    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from("past_projects")
        .update(data)
        .eq("id", editing.id);

      if (error) {
        toast.error("Failed to update project");
      } else {
        toast.success("Project updated");
        setEditing(null);
        fetchProjects();
      }
    } else {
      const { error } = await supabase.from("past_projects").insert({
        ...data,
        organization_id: profile.organization_id,
        created_by: profile.id,
      });

      if (error) {
        toast.error("Failed to create project");
      } else {
        toast.success("Project created");
        setCreating(false);
        fetchProjects();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("past_projects").delete().eq("id", id);
    if (!error) {
      toast.success("Project deleted");
      fetchProjects();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Past Projects</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage past project records used as case studies in proposals.
        </p>
      </div>

      <DataTable
        data={projects}
        columns={[
          {
            key: "project_name",
            header: "Project",
            render: (p) => <span className="font-medium">{p.project_name}</span>,
          },
          { key: "client_name", header: "Client" },
          {
            key: "building_type",
            header: "Type",
            render: (p) => (
              <Badge variant="outline" className="text-xs">
                {p.building_type}
              </Badge>
            ),
          },
          {
            key: "square_footage",
            header: "Sq Ft",
            render: (p) => (
              <span className="text-muted-foreground">
                {p.square_footage ? formatSquareFootage(p.square_footage) : "—"}
              </span>
            ),
          },
          {
            key: "completion_date",
            header: "Completed",
            render: (p) => (
              <span className="text-muted-foreground">
                {p.completion_date ? formatDate(p.completion_date) : "—"}
              </span>
            ),
          },
        ]}
        searchField="project_name"
        searchPlaceholder="Search projects..."
        onAdd={() => setCreating(true)}
        addLabel="Add Project"
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
            <DialogTitle>{editing ? "Edit" : "Add"} Project</DialogTitle>
          </DialogHeader>
          <ProjectForm
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
