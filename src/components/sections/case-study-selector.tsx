"use client";

import { useState, useEffect, useCallback } from "react";
import { CaseStudyCard } from "@/components/sections/case-study-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Building2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/lib/types/database";

type PastProject = Tables<"past_projects">;

interface CaseStudySelectorProps {
  proposalId: string;
}

export function CaseStudySelector({ proposalId }: CaseStudySelectorProps) {
  const [allProjects, setAllProjects] = useState<PastProject[]>([]);
  const [selectedStudies, setSelectedStudies] = useState<
    { id: string; past_project_id: string; project: PastProject }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, studiesRes] = await Promise.all([
        fetch("/api/past-projects").then((r) => r.json()),
        fetch(`/api/proposals/${proposalId}/case-studies`).then((r) => r.json()),
      ]);

      setAllProjects(projectsRes.projects || []);

      // studiesRes may come from GET which we haven't built yet — handle both shapes
      if (studiesRes.studies) {
        setSelectedStudies(studiesRes.studies);
      }
    } catch {
      // Ignore fetch errors on initial load
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedIds = new Set(selectedStudies.map((s) => s.past_project_id));
  const availableProjects = allProjects.filter((p) => !selectedIds.has(p.id));

  const handleAdd = async (project: PastProject) => {
    if (selectedStudies.length >= 5) {
      toast.error("Maximum 5 case studies allowed");
      return;
    }

    const res = await fetch(`/api/proposals/${proposalId}/case-studies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        past_project_id: project.id,
        order_index: selectedStudies.length + 1,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Failed to add case study");
      return;
    }

    setSelectedStudies((prev) => [
      ...prev,
      { id: json.study.id, past_project_id: project.id, project },
    ]);
    setOpen(false);
  };

  const handleRemove = async (studyId: string) => {
    const res = await fetch(`/api/proposals/${proposalId}/case-studies`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ study_id: studyId }),
    });

    if (res.ok) {
      setSelectedStudies((prev) => prev.filter((s) => s.id !== studyId));
    }
  };

  const handleCreateAndAdd = async (data: {
    project_name: string;
    client_name: string;
    project_type: string;
    building_type: string;
    narrative?: string;
    square_footage?: number;
  }) => {
    if (selectedStudies.length >= 5) {
      toast.error("Maximum 5 case studies allowed");
      return;
    }

    // 1. Create the past project via API
    const createRes = await fetch("/api/past-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.project) {
      toast.error(createJson.error || "Failed to create case study");
      return;
    }

    const project: PastProject = createJson.project;

    // 2. Link as case study via API
    const linkRes = await fetch(`/api/proposals/${proposalId}/case-studies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        past_project_id: project.id,
        order_index: selectedStudies.length + 1,
      }),
    });

    const linkJson = await linkRes.json();
    if (!linkRes.ok || !linkJson.study) {
      toast.error("Created project but failed to link as case study");
      return;
    }

    toast.success(`"${data.project_name}" added — it's now visible below`);
    setSelectedStudies((prev) => [
      ...prev,
      { id: linkJson.study.id, past_project_id: project.id, project },
    ]);
    setAllProjects((prev) => [...prev, project]);
    setShowCreate(false);
    setOpen(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading case studies...</p>;
  }

  return (
    <div className="space-y-3">
      {selectedStudies.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          No case studies added yet. Click &quot;Add Case Study&quot; to create one — it will appear here.
        </p>
      )}

      {selectedStudies.map((study) => (
        <CaseStudyCard
          key={study.id}
          project={study.project}
          onRemove={() => handleRemove(study.id)}
        />
      ))}

      {selectedStudies.length < 5 && (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCreate(false); }}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Plus className="h-3.5 w-3.5" />
              Add Case Study
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0" align="start">
            {showCreate ? (
              <InlineCreateCaseStudy
                onSubmit={handleCreateAndAdd}
                onCancel={() => setShowCreate(false)}
              />
            ) : (
              <Command>
                <CommandInput placeholder="Search existing case studies..." />
                <CommandList>
                  <CommandEmpty>No case studies found.</CommandEmpty>
                  <CommandGroup>
                    {availableProjects.map((project) => (
                      <CommandItem
                        key={project.id}
                        value={project.project_name}
                        onSelect={() => handleAdd(project)}
                        className="flex items-start gap-2 py-2"
                      >
                        <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {project.project_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {project.client_name} &middot;{" "}
                            {project.building_type}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <div className="border-t border-border p-1">
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <FolderPlus className="h-4 w-4 text-muted-foreground" />
                      <span>Create New Case Study</span>
                    </button>
                  </div>
                </CommandList>
              </Command>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/** Inline form for creating a new case study */
function InlineCreateCaseStudy({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    project_name: string;
    client_name: string;
    project_type: string;
    building_type: string;
    narrative?: string;
    square_footage?: number;
  }) => void;
  onCancel: () => void;
}) {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectType, setProjectType] = useState("HVAC Controls");
  const [buildingType, setBuildingType] = useState("");
  const [narrative, setNarrative] = useState("");
  const [sqft, setSqft] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientName.trim() || !buildingType.trim()) return;
    setSaving(true);
    await onSubmit({
      project_name: projectName.trim(),
      client_name: clientName.trim(),
      project_type: projectType.trim(),
      building_type: buildingType.trim(),
      narrative: narrative.trim() || undefined,
      square_footage: sqft ? parseInt(sqft) : undefined,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <p className="text-sm font-medium">Create New Case Study</p>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Project Name *</Label>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. Hillsboro Police Station BMS Upgrade"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs">Client Name *</Label>
          <Input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. City of Hillsboro"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Building Type *</Label>
            <Input
              value={buildingType}
              onChange={(e) => setBuildingType(e.target.value)}
              placeholder="e.g. Public Safety"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Project Type</Label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. HVAC Controls"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Square Footage</Label>
          <Input
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            placeholder="e.g. 45000"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Project Description</Label>
          <Textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Describe the project scope, systems, challenges, and outcomes..."
            rows={3}
            className="text-sm resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!projectName.trim() || !clientName.trim() || !buildingType.trim() || saving}
          className="h-7 text-xs"
        >
          {saving ? "Saving..." : "Save Case Study"}
        </Button>
      </div>
    </form>
  );
}
