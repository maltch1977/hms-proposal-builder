"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LockIndicator } from "@/components/editor/lock-indicator";
import type { SectionWithType } from "@/lib/hooks/use-proposal";
import type { UserRole } from "@/lib/utils/constants";

interface SectionWrapperProps {
  section: SectionWithType;
  userRole: UserRole;
  isActive: boolean;
  children: React.ReactNode;
  displayName?: string;
}

export const SectionWrapper = forwardRef<HTMLDivElement, SectionWrapperProps>(
  function SectionWrapper({ section, userRole, isActive, children, displayName }, ref) {
    const isLocked =
      section.lock_level === "super_admin" ||
      (section.lock_level === "admin" && userRole === "proposal_user");

    return (
      <div
        ref={ref}
        id={`section-${section.id}`}
        className={cn(
          "rounded-xl border bg-card transition-all duration-200",
          isActive
            ? "border-hms-navy/20 shadow-[0_2px_8px_oklch(0.2_0.03_265/0.08)] ring-1 ring-hms-navy/5"
            : "border-border/80 hover:border-border hover:shadow-[0_1px_4px_oklch(0.2_0.02_265/0.05)]"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
          <h3 className="text-[14px] tracking-[-0.01em] font-semibold text-foreground">
            {displayName || section.section_type.display_name}
          </h3>
          {isLocked && <LockIndicator lockLevel={section.lock_level} />}
        </div>
        <div className={cn("p-5", isLocked && "pointer-events-none opacity-60")}>
          {children}
        </div>
        {/* Phase 2: commenting hook point */}
      </div>
    );
  }
);
