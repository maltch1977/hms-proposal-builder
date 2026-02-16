"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { DataTable } from "@/components/admin/data-table";
import { UserForm } from "@/components/admin/user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";
import type { UserRole } from "@/lib/utils/constants";

type Profile = Tables<"profiles">;

export function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("full_name");

    setUsers(data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSave = async (data: {
    full_name: string;
    email: string;
    role: "super_admin" | "hms_admin" | "proposal_user";
    manager_id: string | null;
    is_active: boolean;
  }) => {
    if (!editing) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
        role: data.role,
        manager_id: data.manager_id,
        is_active: data.is_active,
      })
      .eq("id", editing.id);

    if (error) {
      toast.error("Failed to update user");
    } else {
      toast.success("User updated");
      setEditing(null);
      fetchUsers();
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user accounts, roles, and org hierarchy.
        </p>
      </div>

      <DataTable
        data={users}
        columns={[
          {
            key: "full_name",
            header: "Name",
            render: (u) => <span className="font-medium">{u.full_name}</span>,
          },
          {
            key: "email",
            header: "Email",
            render: (u) => (
              <span className="text-muted-foreground">{u.email}</span>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (u) => (
              <Badge
                variant={u.role === "super_admin" ? "default" : "secondary"}
                className="text-xs"
              >
                {ROLE_LABELS[u.role as UserRole]}
              </Badge>
            ),
          },
          {
            key: "is_active",
            header: "Status",
            render: (u) => (
              <Badge
                variant={u.is_active ? "default" : "outline"}
                className="text-xs"
              >
                {u.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]}
        searchField="full_name"
        searchPlaceholder="Search users..."
        loading={loading}
        actions={(u) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(u);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      />

      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm
            item={editing}
            allProfiles={users}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
