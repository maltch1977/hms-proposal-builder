"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Check } from "lucide-react";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";
import type { InterviewPanelContent } from "@/lib/types/section";

interface InterviewPanelProps {
  proposalId: string;
  content: InterviewPanelContent;
  onChange: (content: InterviewPanelContent) => void;
}

export function InterviewPanel({ proposalId, content, onChange }: InterviewPanelProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPersonnel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/team-members`);
      const json = await res.json();
      if (json.members) {
        setTeamMembers(
          json.members.map((m: Record<string, unknown>) => ({
            ...m,
            personnel: m.personnel,
          })) as TeamMemberWithPersonnel[]
        );
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // Derive selected IDs: if content has explicit list use it, otherwise default to all team members
  const selectedIds: Set<string> = (() => {
    if (content.interview_member_ids && content.interview_member_ids.length > 0) {
      return new Set(content.interview_member_ids);
    }
    return new Set(teamMembers.map((m) => m.personnel_id));
  })();

  const descriptions = content.interview_descriptions || {};

  const toggleMember = (personnelId: string) => {
    const next = new Set(selectedIds);
    if (next.has(personnelId)) {
      next.delete(personnelId);
    } else {
      next.add(personnelId);
    }
    onChange({ ...content, interview_member_ids: Array.from(next) });
  };

  const updateDescription = (personnelId: string, value: string) => {
    onChange({
      ...content,
      interview_descriptions: { ...descriptions, [personnelId]: value },
    });
  };

  const selectAll = () => {
    onChange({
      ...content,
      interview_member_ids: teamMembers.map((m) => m.personnel_id),
    });
  };

  const clearAll = () => {
    onChange({ ...content, interview_member_ids: [] });
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Loading team members...
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Select which team members will attend the client interview. Add team
          members in the Key Personnel section first.
        </p>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No team members selected yet.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = teamMembers.every((m) => selectedIds.has(m.personnel_id));
  const noneSelected = teamMembers.every((m) => !selectedIds.has(m.personnel_id));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Select which team members will attend the client interview. This does
        not affect Key Personnel or Personnel Qualifications.
      </p>

      {/* Select All / Clear All */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={selectAll}
          disabled={allSelected}
          className="text-xs text-muted-foreground hover:text-hms-navy disabled:opacity-40 transition-colors"
        >
          Select All
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={noneSelected}
          className="text-xs text-muted-foreground hover:text-hms-navy disabled:opacity-40 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Personnel list */}
      <div className="divide-y divide-border">
        {teamMembers.map((member) => {
          const isSelected = selectedIds.has(member.personnel_id);
          const desc = descriptions[member.personnel_id] || "";
          return (
            <div key={member.id} className="py-2.5 px-1">
              <button
                type="button"
                onClick={() => toggleMember(member.personnel_id)}
                className="flex items-center gap-3 w-full text-left transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-hms-navy/10 flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-hms-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isSelected ? "text-hms-navy" : "text-muted-foreground"
                    }`}
                  >
                    {member.personnel.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {member.role_override || member.personnel.role_type}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-hms-navy flex-shrink-0" />
                )}
              </button>
              {isSelected && (
                <div className="mt-1.5 ml-10">
                  <textarea
                    value={desc}
                    onChange={(e) => updateDescription(member.personnel_id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Interview panel description..."
                    rows={2}
                    className="w-full text-xs bg-transparent border border-border rounded px-2 py-1.5 resize-y focus:border-muted-foreground focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
