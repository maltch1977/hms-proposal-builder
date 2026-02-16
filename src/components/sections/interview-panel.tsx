"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "lucide-react";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

interface InterviewPanelProps {
  proposalId: string;
}

export function InterviewPanel({ proposalId }: InterviewPanelProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from("proposal_team_members")
        .select("*, personnel:personnel(*)")
        .eq("proposal_id", proposalId)
        .order("order_index");

      if (data) {
        setTeamMembers(
          data.map((m) => ({
            ...m,
            personnel: (m as unknown as { personnel: TeamMemberWithPersonnel["personnel"] }).personnel,
          }))
        );
      }
      setLoading(false);
    };

    fetchTeam();
  }, [proposalId, supabase]);

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
          Auto-generated from Key Personnel. Add team members in the Key
          Personnel section first.
        </p>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No team members selected yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Auto-generated from Key Personnel. This section lists team members who
        will participate in the client interview.
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                Name
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                Title
              </th>
              <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border last:border-0"
              >
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-hms-navy/10 flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-hms-navy" />
                    </div>
                    <span className="font-medium">
                      {member.personnel.full_name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {member.personnel.title}
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">
                  {member.role_override || member.personnel.role_type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
