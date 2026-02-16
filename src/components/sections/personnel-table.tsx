"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeamMemberWithPersonnel } from "@/components/sections/key-personnel";

interface PersonnelTableProps {
  teamMembers: TeamMemberWithPersonnel[];
}

export function PersonnelTable({ teamMembers }: PersonnelTableProps) {
  if (teamMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Select team members above to generate the personnel table.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-hms-navy/5">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Role</TableHead>
            <TableHead className="font-semibold text-center">
              Years in Industry
            </TableHead>
            <TableHead className="font-semibold text-center">
              Years at HMS
            </TableHead>
            <TableHead className="font-semibold">Responsibilities</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">
                {member.personnel.full_name}
              </TableCell>
              <TableCell>
                {member.role_override || member.personnel.title}
              </TableCell>
              <TableCell className="text-center">
                {member.personnel.years_in_industry ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                {member.personnel.years_at_company ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                {member.personnel.task_description
                  ? member.personnel.task_description.replace(/<[^>]+>/g, "").slice(0, 100)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
