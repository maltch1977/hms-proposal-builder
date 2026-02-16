import type { ProposalChange } from "@/lib/hooks/use-proposal-changes";
import { HIGHLIGHTER_COLORS } from "./compute-author-highlights";

export interface FieldAttribution {
  authorName: string;
  authorColor: string;
  changeType: "human" | "ai";
  timestamp: string;
}

interface Collaborator {
  id: string;
  profile_id: string;
  color: string;
  name: string;
}

export function deriveFieldAttributions(
  changes: ProposalChange[],
  collaborators: Collaborator[]
): Record<string, FieldAttribution> {
  const result: Record<string, FieldAttribution> = {};

  // Assign highlighter colors to collaborators by index
  const colorMap = new Map<string, string>();
  for (let i = 0; i < collaborators.length; i++) {
    colorMap.set(
      collaborators[i].profile_id,
      HIGHLIGHTER_COLORS[i % HIGHLIGHTER_COLORS.length]
    );
  }

  // Filter to human + AI changes only (skip system)
  const relevant = changes.filter(
    (c) => c.change_type === "human" || c.change_type === "ai"
  );

  // Changes come sorted desc by created_at from the API.
  // For each unique (section_id, field) pair, the first occurrence is the most recent.
  for (const change of relevant) {
    const key = `${change.section_id}:${change.field}`;
    if (result[key]) continue; // already have the most recent

    if (change.change_type === "ai") {
      result[key] = {
        authorName: "System",
        authorColor: "#9333ea", // purple-600
        changeType: "ai",
        timestamp: change.created_at,
      };
    } else if (change.author) {
      result[key] = {
        authorName: change.author.name,
        authorColor: colorMap.get(change.author.id) || "#FFEB3B",
        changeType: "human",
        timestamp: change.created_at,
      };
    }
  }

  return result;
}
