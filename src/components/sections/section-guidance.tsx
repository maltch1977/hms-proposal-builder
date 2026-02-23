"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { RFPRequirement, RequirementMapping } from "@/lib/ai/types";

interface SectionGuidanceProps {
  requirements: RFPRequirement[];
  requirementMappings: RequirementMapping[];
  responses: Record<string, string>;
  onResponseChange: (reqId: string, value: string) => void;
}

export function SectionGuidance({
  requirements,
  requirementMappings,
  responses,
  onResponseChange,
}: SectionGuidanceProps) {
  const mappingByReqId = Object.fromEntries(
    requirementMappings.map((m) => [m.req_id, m])
  );

  // A requirement is an "orphan" in a structured section if:
  // - It has no mapping at all, OR
  // - Its mapping is needs_input (no mark in a structured section)
  const isOrphan = (req: RFPRequirement) => {
    const mapping = mappingByReqId[req.id];
    if (!mapping) return true;
    if (mapping.req_type === "needs_input") return true;
    return false;
  };

  const orphanReqs = requirements.filter(isOrphan);
  const nonOrphanReqs = requirements.filter((r) => !isOrphan(r));

  if (requirements.length === 0) return null;

  return (
    <div className="space-y-1">
      {/* Invisible anchors for non-orphan requirements (connector targets) */}
      {nonOrphanReqs.map((req) => (
        <div key={req.id} data-req-target={req.id} className="h-0 overflow-hidden" />
      ))}

      {/* Orphan requirements — textareas for requirements with no UI home */}
      {orphanReqs.length > 0 && (
        <div className="space-y-3 mb-4">
          {orphanReqs.map((req) => (
            <OrphanField
              key={req.id}
              requirement={req}
              value={responses[req.id] || ""}
              onChange={onResponseChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Individual orphan requirement field with debounced save */
function OrphanField({
  requirement,
  value: initialValue,
  onChange,
}: {
  requirement: RFPRequirement;
  value: string;
  onChange: (reqId: string, value: string) => void;
}) {
  const [localValue, setLocalValue] = useState(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isDone = requirement.auto_filled;

  // Sync from parent when saved value changes (e.g., after refetch)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(requirement.id, val);
      }, 600);
    },
    [onChange, requirement.id]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div
      data-req-target={requirement.id}
      className={`rounded-md border p-3 transition-colors ${
        isDone
          ? "border-green-500/30 bg-green-50/30 dark:bg-green-950/10"
          : "border-amber-400/30 bg-amber-50/30 dark:bg-amber-950/10"
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-green-500" />
        ) : (
          <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-400" />
        )}
        <p className="text-xs leading-relaxed text-foreground">
          {requirement.description}
        </p>
      </div>
      <textarea
        value={localValue}
        onChange={handleChange}
        placeholder="Type your response..."
        rows={2}
        className="w-full rounded border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-border focus:ring-0 focus:outline-none resize-y"
      />
    </div>
  );
}
