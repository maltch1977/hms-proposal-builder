"use client";

import { ReferenceSelector } from "@/components/sections/reference-selector";

interface ReferenceCheckProps {
  proposalId: string;
}

export function ReferenceCheck({ proposalId }: ReferenceCheckProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Select references from your organization&apos;s reference roster. These
        contacts will be listed in the proposal for the client to verify.
      </p>
      <ReferenceSelector proposalId={proposalId} />
    </div>
  );
}
