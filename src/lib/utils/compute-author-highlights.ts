import DiffMatchPatch from "diff-match-patch";
import type { ProposalChange } from "@/lib/hooks/use-proposal-changes";

const dmp = new DiffMatchPatch();

/** Bold highlighter colors for human collaborators */
export const HIGHLIGHTER_COLORS = [
  "#FFEB3B", // bright yellow
  "#FF9100", // bright orange
  "#FF4081", // hot pink
  "#AA00FF", // bright purple
  "#00E676", // bright green
  "#00B0FF", // bright blue
  "#FF6E40", // bright coral
  "#E040FB", // bright magenta
];

/** Strip HTML to plain text — matches the logic used for change tracking diffs */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|div|pre)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

interface AuthorInfo {
  name: string;
  color: string;
  type: "human" | "ai";
}

export interface AttributedSegment {
  text: string;
  authorName: string | null;
  authorColor: string | null;
  changeType: "human" | "ai" | null;
}

interface Collaborator {
  id: string;
  profile_id: string;
  color: string;
  name: string;
}

/**
 * Process a field's change history to build per-character author attribution.
 * Changes must be sorted oldest-first.
 *
 * The first change establishes the baseline (no highlights).
 * Only changes after the first are highlighted with author colors.
 * This prevents AI-populated content from being entirely highlighted.
 */
function computeFieldHighlights(
  fieldChanges: ProposalChange[],
  colorMap: Map<string, string>
): AttributedSegment[] {
  // Need at least 2 changes: first = baseline, second+ = tracked edits
  if (fieldChanges.length < 2) return [];

  // First change's new_value is the baseline — no highlights
  const baselineText = stripHtml(fieldChanges[0].new_value || "");
  let chars: (AuthorInfo | null)[] = new Array(baselineText.length).fill(null);

  // Process from the second change onward
  for (const change of fieldChanges.slice(1)) {
    const oldText = stripHtml(change.old_value || "");
    const newText = stripHtml(change.new_value || "");

    let author: AuthorInfo | null = null;
    if (change.change_type === "ai") {
      author = { name: "System", color: "#9333ea", type: "ai" };
    } else if (change.author) {
      const color = colorMap.get(change.author.id) || "#FFEB3B";
      author = { name: change.author.name, color, type: "human" };
    }

    const diffs = dmp.diff_main(oldText, newText);
    dmp.diff_cleanupSemantic(diffs);

    const newChars: (AuthorInfo | null)[] = [];
    let oldIdx = 0;

    for (const [op, text] of diffs) {
      if (op === 0) {
        // Equal: preserve existing attributions
        for (let i = 0; i < text.length; i++) {
          newChars.push(oldIdx < chars.length ? chars[oldIdx] : null);
          oldIdx++;
        }
      } else if (op === -1) {
        // Delete: skip these characters
        oldIdx += text.length;
      } else if (op === 1) {
        // Insert: attribute to current author
        for (let i = 0; i < text.length; i++) {
          newChars.push(author);
        }
      }
    }

    chars = newChars;
  }

  // Collapse consecutive characters with same attribution into segments
  const lastText = stripHtml(
    fieldChanges[fieldChanges.length - 1].new_value || ""
  );
  const segments: AttributedSegment[] = [];
  let i = 0;
  while (i < chars.length && i < lastText.length) {
    const attr = chars[i];
    let j = i + 1;
    while (
      j < chars.length &&
      j < lastText.length &&
      chars[j]?.name === attr?.name &&
      chars[j]?.color === attr?.color &&
      chars[j]?.type === attr?.type
    ) {
      j++;
    }
    segments.push({
      text: lastText.slice(i, j),
      authorName: attr?.name || null,
      authorColor: attr?.color || null,
      changeType: attr?.type || null,
    });
    i = j;
  }

  return segments;
}

/**
 * Compute author highlight segments for all fields across all sections.
 * Returns a map keyed by "sectionId:fieldName".
 */
export function computeAllFieldHighlights(
  changes: ProposalChange[],
  collaborators: Collaborator[]
): Record<string, AttributedSegment[]> {
  // Assign highlighter colors to collaborators by index
  const colorMap = new Map<string, string>();
  for (let i = 0; i < collaborators.length; i++) {
    colorMap.set(
      collaborators[i].profile_id,
      HIGHLIGHTER_COLORS[i % HIGHLIGHTER_COLORS.length]
    );
  }

  // Group changes by sectionId:field, filter out system changes
  const grouped: Record<string, ProposalChange[]> = {};
  for (const change of changes) {
    if (change.change_type === "system") continue;
    const key = `${change.section_id}:${change.field}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(change);
  }

  // Sort each group oldest first
  for (const key in grouped) {
    grouped[key].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  const result: Record<string, AttributedSegment[]> = {};
  for (const key in grouped) {
    const segments = computeFieldHighlights(grouped[key], colorMap);
    // Only include if there are actual highlighted segments
    if (segments.some((s) => s.authorName !== null)) {
      result[key] = segments;
    }
  }

  return result;
}
