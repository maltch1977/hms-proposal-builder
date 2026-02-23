"use client";

import { useMemo } from "react";
import { ROLE_TYPE_HIERARCHY } from "@/lib/utils/constants";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

interface OrgChartProps {
  teamMembers: TeamMemberWithPersonnel[];
  clientName?: string;
}

interface TreeNode {
  member: TeamMemberWithPersonnel;
  children: TreeNode[];
}

export function OrgChart({ teamMembers, clientName = "HMS Client" }: OrgChartProps) {
  // Build tree from hierarchy_position.parent_id
  // Falls back to role_type grouping if no hierarchy is set
  const { tree, usesHierarchy } = useMemo(() => {
    // Check if any member has hierarchy_position.parent_id set
    const hasHierarchy = teamMembers.some((m) => {
      const hp = m.hierarchy_position as { parent_id?: string } | null;
      return hp?.parent_id;
    });

    if (!hasHierarchy) {
      // Fallback: group by role_type (legacy behavior)
      return { tree: null, usesHierarchy: false };
    }

    // Build parent-child map
    const memberMap = new Map(teamMembers.map((m) => [m.id, m]));
    const childrenMap = new Map<string | null, TeamMemberWithPersonnel[]>();

    for (const member of teamMembers) {
      const hp = member.hierarchy_position as { parent_id?: string } | null;
      const parentId = hp?.parent_id || null;
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId)!.push(member);
    }

    // Build tree recursively
    function buildNodes(parentId: string | null): TreeNode[] {
      const children = childrenMap.get(parentId) || [];
      // Sort by role_type rank, then by name
      children.sort((a, b) => {
        const aRank = ROLE_TYPE_HIERARCHY[a.personnel.role_type] || 99;
        const bRank = ROLE_TYPE_HIERARCHY[b.personnel.role_type] || 99;
        return aRank - bRank || a.personnel.full_name.localeCompare(b.personnel.full_name);
      });
      return children.map((member) => ({
        member,
        children: buildNodes(member.id),
      }));
    }

    return { tree: buildNodes(null), usesHierarchy: true };
  }, [teamMembers]);

  if (teamMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Select team members above to generate the org chart.
      </p>
    );
  }

  // Legacy: role_type grouping
  if (!usesHierarchy || !tree) {
    return <RoleGroupedChart teamMembers={teamMembers} clientName={clientName} />;
  }

  // Tree-based rendering
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Client node */}
      <div className="rounded-lg border-2 border-hms-navy bg-hms-navy px-6 py-2.5 text-white text-sm font-medium">
        {clientName}
      </div>
      <div className="w-px h-6 bg-border" />

      {/* Tree */}
      <TreeLevel nodes={tree} />
    </div>
  );
}

/** Renders a level of the tree — siblings side by side, children below */
function TreeLevel({ nodes }: { nodes: TreeNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-start justify-center gap-6">
        {nodes.map((node) => (
          <div key={node.member.id} className="flex flex-col items-center gap-4">
            <MemberCard member={node.member} />
            {node.children.length > 0 && (
              <>
                <div className="w-px h-4 bg-border" />
                <TreeLevel nodes={node.children} />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: TeamMemberWithPersonnel }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-center min-w-[140px]">
      <p className="text-sm font-medium text-foreground">
        {member.personnel.full_name}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {member.role_override || member.personnel.title}
      </p>
    </div>
  );
}

/** Fallback: group by role_type when no hierarchy is set */
function RoleGroupedChart({
  teamMembers,
  clientName,
}: {
  teamMembers: TeamMemberWithPersonnel[];
  clientName: string;
}) {
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

    return Array.from(groupedMap.entries()).map(([, members]) => members);
  }, [teamMembers]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="rounded-lg border-2 border-hms-navy bg-hms-navy px-6 py-2.5 text-white text-sm font-medium">
        {clientName}
      </div>
      <div className="w-px h-6 bg-border" />

      {levels.map((members, levelIdx) => (
        <div key={levelIdx} className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
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
