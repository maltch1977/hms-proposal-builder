"use client";

import type { SectionWithType } from "@/lib/hooks/use-proposal";

interface TableOfContentsProps {
  sections: SectionWithType[];
}

export function TableOfContents({ sections }: TableOfContentsProps) {
  const enabledSections = sections
    .filter((s) => s.is_enabled && s.section_type.slug !== "table_of_contents")
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Auto-generated from active sections. Page numbers will appear in the final PDF.
      </p>
      <div className="rounded-lg border border-border bg-muted/20 p-5">
        <h4 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
          Table of Contents
        </h4>
        <div className="space-y-2">
          {enabledSections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">
                {section.section_type.display_name}
              </span>
              <span className="flex-1 mx-3 border-b border-dotted border-border" />
              <span className="text-muted-foreground text-xs">--</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
