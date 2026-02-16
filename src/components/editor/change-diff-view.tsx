"use client";

import { useMemo } from "react";
import { computeTextDiff } from "@/lib/utils/diff";

interface ChangeDiffViewProps {
  oldValue: string;
  newValue: string;
}

export function ChangeDiffView({ oldValue, newValue }: ChangeDiffViewProps) {
  const segments = useMemo(
    () => computeTextDiff(oldValue || "", newValue || ""),
    [oldValue, newValue]
  );

  return (
    <div className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
      {segments.map((seg, i) => {
        if (seg.type === "equal") {
          return <span key={i}>{seg.text}</span>;
        }
        if (seg.type === "insert") {
          return (
            <span
              key={i}
              className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              {seg.text}
            </span>
          );
        }
        // delete
        return (
          <span
            key={i}
            className="bg-red-100 text-red-800 line-through dark:bg-red-900/30 dark:text-red-300"
          >
            {seg.text}
          </span>
        );
      })}
    </div>
  );
}
