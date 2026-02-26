"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_TYPES } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";

type Personnel = Tables<"personnel">;

interface PersonnelFormProps {
  item?: Personnel | null;
  onSave: (data: {
    full_name: string;
    title: string;
    role_type: string;
    years_in_industry: number | null;
    years_at_company: number | null;
    years_with_distech: number | null;
    task_description: string | null;
    bio: string | null;
    specialties: string[];
    certifications: string[];
    is_active: boolean;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function PersonnelForm({
  item,
  onSave,
  onCancel,
  saving,
}: PersonnelFormProps) {
  const [fullName, setFullName] = useState(item?.full_name || "");
  const [title, setTitle] = useState(item?.title || "");
  const [roleType, setRoleType] = useState(item?.role_type || "Other");
  const [yearsIndustry, setYearsIndustry] = useState(
    item?.years_in_industry?.toString() || ""
  );
  const [yearsCompany, setYearsCompany] = useState(
    item?.years_at_company?.toString() || ""
  );
  const [yearsDistech, setYearsDistech] = useState(
    item?.years_with_distech?.toString() || ""
  );
  const [taskDescription, setTaskDescription] = useState(
    item?.task_description || ""
  );
  const [bio, setBio] = useState(item?.bio || "");
  const [specialties, setSpecialties] = useState(
    item?.specialties?.join(", ") || ""
  );
  const [certifications, setCertifications] = useState(
    item?.certifications?.join(", ") || ""
  );
  const [isActive, setIsActive] = useState(item?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      full_name: fullName,
      title,
      role_type: roleType,
      years_in_industry: yearsIndustry ? parseInt(yearsIndustry) : null,
      years_at_company: yearsCompany ? parseInt(yearsCompany) : null,
      years_with_distech: yearsDistech ? parseInt(yearsDistech) : null,
      task_description: taskDescription || null,
      bio: bio || null,
      specialties: specialties
        ? specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      certifications: certifications
        ? certifications.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Full Name</Label>
          <Input
            id="p-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-title">Title</Label>
          <Input
            id="p-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Project Manager"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Role Type</Label>
        <Select value={roleType} onValueChange={setRoleType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_TYPES.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="p-yi">Years in Industry</Label>
          <Input
            id="p-yi"
            type="number"
            value={yearsIndustry}
            onChange={(e) => setYearsIndustry(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-yc">Years at Company</Label>
          <Input
            id="p-yc"
            type="number"
            value={yearsCompany}
            onChange={(e) => setYearsCompany(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-yd">Years with Distech</Label>
          <Input
            id="p-yd"
            type="number"
            value={yearsDistech}
            onChange={(e) => setYearsDistech(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-task">Task Description</Label>
        <Textarea
          id="p-task"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Responsibilities for proposals..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Bio</Label>
        <RichTextEditor
          content={bio}
          onChange={setBio}
          placeholder="Default bio used as starting point in proposals..."
        />
        <p className="text-xs text-muted-foreground">
          Default bio used as starting point in proposals.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-spec">Specialties (comma-separated)</Label>
        <Input
          id="p-spec"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder="HVAC Controls, Building Automation, ..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-cert">Certifications (comma-separated)</Label>
        <Input
          id="p-cert"
          value={certifications}
          onChange={(e) => setCertifications(e.target.value)}
          placeholder="Distech Certified, OSHA 30, ..."
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} id="p-active" />
        <Label htmlFor="p-active" className="font-normal cursor-pointer">
          Active
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!fullName || !title || saving}>
          {saving ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
