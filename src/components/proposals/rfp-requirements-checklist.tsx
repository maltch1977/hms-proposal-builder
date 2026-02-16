"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SECTION_DISPLAY_NAMES } from "@/lib/utils/constants";
import type { SectionSlug } from "@/lib/utils/constants";
import type { RFPRequirement } from "@/lib/ai/types";

interface RFPRequirementsChecklistProps {
  requirements: RFPRequirement[];
  onToggle: (id: string) => void;
}

export function RFPRequirementsChecklist({
  requirements,
  onToggle,
}: RFPRequirementsChecklistProps) {
  // Group requirements by section
  const grouped = requirements.reduce<Record<string, RFPRequirement[]>>(
    (acc, req) => {
      const key = req.section_slug;
      if (!acc[key]) acc[key] = [];
      acc[key].push(req);
      return acc;
    },
    {}
  );

  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No specific requirements extracted from this document.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        Extracted Requirements ({requirements.length})
      </p>
      {Object.entries(grouped).map(([slug, reqs]) => {
        const sectionName =
          SECTION_DISPLAY_NAMES[slug as SectionSlug] || slug;
        return (
          <div key={slug} className="space-y-1.5">
            <Badge variant="outline" className="text-xs">
              {sectionName}
            </Badge>
            {reqs.map((req) => (
              <div
                key={req.id}
                className="flex items-start gap-2 rounded-md border border-border bg-card p-2"
              >
                <Checkbox
                  checked={req.auto_filled}
                  onCheckedChange={() => onToggle(req.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {req.description}
                  </p>
                  {req.is_mandatory && (
                    <Badge
                      variant="destructive"
                      className="mt-1 text-[10px] h-4"
                    >
                      Required
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
