"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TYPES, BUILDING_TYPES } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;

interface ProjectFormProps {
  item?: PastProject | null;
  onSave: (data: {
    project_name: string;
    project_type: string;
    building_type: string;
    client_name: string;
    square_footage: number | null;
    completion_date: string | null;
    narrative: string | null;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ProjectForm({
  item,
  onSave,
  onCancel,
  saving,
}: ProjectFormProps) {
  const [projectName, setProjectName] = useState(item?.project_name || "");
  const [projectType, setProjectType] = useState(item?.project_type || "New Construction");
  const [buildingType, setBuildingType] = useState(item?.building_type || "Office");
  const [clientName, setClientName] = useState(item?.client_name || "");
  const [sqft, setSqft] = useState(item?.square_footage?.toString() || "");
  const [completionDate, setCompletionDate] = useState(item?.completion_date || "");
  const [narrative, setNarrative] = useState(item?.narrative || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      project_name: projectName,
      project_type: projectType,
      building_type: buildingType,
      client_name: clientName,
      square_footage: sqft ? parseInt(sqft) : null,
      completion_date: completionDate || null,
      narrative: narrative || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proj-name">Project Name</Label>
          <Input
            id="proj-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proj-client">Client Name</Label>
          <Input
            id="proj-client"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Project Type</Label>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Building Type</Label>
          <Select value={buildingType} onValueChange={setBuildingType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILDING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="proj-sqft">Square Footage</Label>
          <Input
            id="proj-sqft"
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            placeholder="e.g., 150000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="proj-date">Completion Date</Label>
          <Input
            id="proj-date"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proj-narrative">Project Narrative</Label>
        <Textarea
          id="proj-narrative"
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Describe the project scope and accomplishments..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!projectName || !clientName || saving}>
          {saving ? "Saving..." : item ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
