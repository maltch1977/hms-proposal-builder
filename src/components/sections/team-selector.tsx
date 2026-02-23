"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, User, UserPlus, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ROLE_TYPES } from "@/lib/utils/constants";
import type { Tables } from "@/lib/types/database";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

type Personnel = Tables<"personnel">;

interface TeamSelectorProps {
  proposalId: string;
  selectedMembers: TeamMemberWithPersonnel[];
  onTeamChange: () => void;
}

export function TeamSelector({
  proposalId,
  selectedMembers,
  onTeamChange,
}: TeamSelectorProps) {
  const [allPersonnel, setAllPersonnel] = useState<Personnel[]>([]);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPersonnel = useCallback(async () => {
    const res = await fetch("/api/personnel");
    const json = await res.json();
    setAllPersonnel(json.personnel || []);
  }, []);

  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);

  const selectedIds = new Set(selectedMembers.map((m) => m.personnel_id));
  const available = allPersonnel.filter((p) => !selectedIds.has(p.id));

  const handleAdd = async (person: Personnel) => {
    const res = await fetch(`/api/proposals/${proposalId}/team-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnel_id: person.id,
        order_index: selectedMembers.length + 1,
      }),
    });

    if (!res.ok) {
      toast.error("Failed to add team member");
      return;
    }

    onTeamChange();
    setOpen(false);
  };

  const handleRemove = async (memberId: string) => {
    const res = await fetch(`/api/proposals/${proposalId}/team-members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });

    if (res.ok) onTeamChange();
  };

  const handleCreateAndAdd = async (data: {
    full_name: string;
    title: string;
    role_type: string;
    years_in_industry?: number;
    years_at_company?: number;
    years_with_distech?: number;
    task_description?: string;
  }) => {
    // 1. Create person via API
    const createRes = await fetch("/api/personnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const createJson = await createRes.json();
    if (!createRes.ok || !createJson.person) {
      toast.error(createJson.error || "Failed to create person");
      return;
    }

    // 2. Add to proposal team via API
    const addRes = await fetch(`/api/proposals/${proposalId}/team-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personnel_id: createJson.person.id,
        order_index: selectedMembers.length + 1,
      }),
    });

    if (!addRes.ok) {
      toast.error("Created person but failed to add to team");
      return;
    }

    toast.success(`Added ${data.full_name} to team`);
    fetchPersonnel();
    onTeamChange();
    setShowCreate(false);
    setOpen(false);
  };

  const handleSetReportsTo = async (memberId: string, parentId: string | null) => {
    const res = await fetch(`/api/proposals/${proposalId}/team-members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        member_id: memberId,
        hierarchy_position: parentId ? { parent_id: parentId } : {},
      }),
    });

    if (!res.ok) {
      toast.error("Failed to update hierarchy");
      return;
    }
    onTeamChange();
  };

  return (
    <div className="space-y-4">
      {/* Selected members as badges */}
      <div className="flex flex-wrap gap-2">
        {selectedMembers.map((member) => (
          <Badge
            key={member.id}
            variant="secondary"
            className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm"
          >
            <User className="h-3 w-3" />
            {member.personnel.full_name}
            <span className="text-muted-foreground text-xs ml-1">
              {member.role_override || member.personnel.title}
            </span>
            <button
              onClick={() => handleRemove(member.id)}
              className="ml-1 rounded-full hover:bg-background/50 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* Add member popover */}
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowCreate(false); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Team Member
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0" align="start">
          {showCreate ? (
            <InlineCreateForm
              onSubmit={handleCreateAndAdd}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <Command>
              <CommandInput placeholder="Search personnel..." />
              <CommandList>
                <CommandEmpty>No personnel found.</CommandEmpty>
                <CommandGroup>
                  {available.map((person) => (
                    <CommandItem
                      key={person.id}
                      value={person.full_name}
                      onSelect={() => handleAdd(person)}
                    >
                      <div>
                        <p className="text-sm">{person.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {person.title} &middot; {person.role_type}
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
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <span>Create New Person</span>
                  </button>
                </div>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {/* Hierarchy editor — shown when 2+ members */}
      {selectedMembers.length >= 2 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Reporting Structure
          </p>
          <div className="space-y-1">
            {selectedMembers.map((member) => {
              const hp = member.hierarchy_position as { parent_id?: string } | null;
              const currentParentId = hp?.parent_id || "";
              const otherMembers = selectedMembers.filter((m) => m.id !== member.id);

              return (
                <div key={member.id} className="flex items-center gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="flex-1 min-w-0 truncate font-medium">
                    {member.personnel.full_name}
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Select
                    value={currentParentId}
                    onValueChange={(val) =>
                      handleSetReportsTo(member.id, val === "__none__" ? null : val)
                    }
                  >
                    <SelectTrigger className="h-7 w-[160px] text-xs">
                      <SelectValue placeholder="Reports to..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">No one (top level)</span>
                      </SelectItem>
                      {otherMembers.map((other) => (
                        <SelectItem key={other.id} value={other.id}>
                          {other.personnel.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Inline form for creating a new person */
function InlineCreateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    full_name: string;
    title: string;
    role_type: string;
    years_in_industry?: number;
    years_at_company?: number;
    years_with_distech?: number;
    task_description?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [roleType, setRoleType] = useState("Project Manager");
  const [yearsIndustry, setYearsIndustry] = useState("");
  const [yearsCompany, setYearsCompany] = useState("");
  const [yearsDistech, setYearsDistech] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;
    setSaving(true);
    await onSubmit({
      full_name: name.trim(),
      title: title.trim(),
      role_type: roleType,
      years_in_industry: yearsIndustry ? parseInt(yearsIndustry) : undefined,
      years_at_company: yearsCompany ? parseInt(yearsCompany) : undefined,
      years_with_distech: yearsDistech ? parseInt(yearsDistech) : undefined,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 space-y-3">
      <p className="text-sm font-medium">Create New Person</p>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Full Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chad Plummer"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-xs">Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Project Manager"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Role Type</Label>
          <Select value={roleType} onValueChange={setRoleType}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>{rt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Yrs Industry</Label>
            <Input
              type="number"
              value={yearsIndustry}
              onChange={(e) => setYearsIndustry(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Yrs Company</Label>
            <Input
              type="number"
              value={yearsCompany}
              onChange={(e) => setYearsCompany(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Yrs Distech</Label>
            <Input
              type="number"
              value={yearsDistech}
              onChange={(e) => setYearsDistech(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!name.trim() || !title.trim() || saving} className="h-7 text-xs">
          {saving ? "Creating..." : "Create & Add"}
        </Button>
      </div>
    </form>
  );
}
