"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";

type Profile = Tables<"profiles">;

interface UserFormProps {
  item?: Profile | null;
  allProfiles: Profile[];
  onSave: (data: {
    full_name: string;
    email: string;
    role: "super_admin" | "hms_admin" | "proposal_user";
    manager_id: string | null;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function UserForm({
  item,
  allProfiles,
  onSave,
  onCancel,
  saving,
}: UserFormProps) {
  const [fullName, setFullName] = useState(item?.full_name || "");
  const [email, setEmail] = useState(item?.email || "");
  const [role, setRole] = useState<"super_admin" | "hms_admin" | "proposal_user">(
    item?.role || "proposal_user"
  );
  const [managerId, setManagerId] = useState(item?.manager_id || "");
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  const managers = allProfiles.filter(
    (p) => p.id !== item?.id && p.is_active
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      full_name: fullName,
      email,
      role,
      manager_id: managerId || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="u-name">Full Name</Label>
          <Input
            id="u-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="u-email">Email</Label>
          <Input
            id="u-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!item}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Manager</Label>
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger>
              <SelectValue placeholder="No manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="u-active" />
        <Label htmlFor="u-active" className="font-normal cursor-pointer">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!fullName || !email || saving}>
          {saving ? "Saving..." : "Update"}
        </Button>
      </div>
    </form>
  );
}
