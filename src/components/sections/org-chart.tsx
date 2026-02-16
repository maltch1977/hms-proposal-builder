"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ROLE_TYPE_HIERARCHY } from "@/lib/utils/constants";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

interface OrgChartProps {
  teamMembers: TeamMemberWithPersonnel[];
  clientName?: string;
}

interface OrgLevel {
  label: string;
  members: TeamMemberWithPersonnel[];
}

export function OrgChart({ teamMembers, clientName = "HMS Client" }: OrgChartProps) {
  const levels = useMemo(() => {
    const sorted = [...teamMembers].sort((a, b) => {
      const aRank = ROLE_TYPE_HIERARCHY[a.personnel.role_type] || 99;
      const bRank = ROLE_TYPE_HIERARCHY[b.personnel.role_type] || 99;
      return aRank - bRank;
    });

    const groupedMap = new Map<string, TeamMemberWithPersonnel[]>();
    for (const member of sorted) {
      const role = member.personnel.role_type;
      if (!groupedMap.has(role)) groupedMap.set(role, []);
      groupedMap.get(role)!.push(member);
    }

    return Array.from(groupedMap.entries()).map(([label, members]) => ({
      label,
      members,
    }));
  }, [teamMembers]);

  if (teamMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Select team members above to generate the org chart.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Client node */}
      <div className="rounded-lg border-2 border-hms-navy bg-hms-navy px-6 py-2.5 text-white text-sm font-medium">
        {clientName}
      </div>
      <div className="w-px h-6 bg-border" />

      {/* Levels */}
      {levels.map((level, levelIdx) => (
        <div key={level.label} className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {level.members.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border border-border bg-card px-4 py-2.5 text-center min-w-[140px]"
              >
                <p className="text-sm font-medium text-foreground">
                  {member.personnel.full_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.role_override || member.personnel.title}
                </p>
              </div>
            ))}
          </div>
          {levelIdx < levels.length - 1 && (
            <div className="w-px h-6 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}
