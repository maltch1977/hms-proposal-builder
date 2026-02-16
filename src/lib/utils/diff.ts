import DiffMatchPatch from "diff-match-patch";

export interface DiffSegment {
  type: "equal" | "insert" | "delete";
  text: string;
}

const dmp = new DiffMatchPatch();

/** Strip HTML tags to get plain text for comparison */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

/** Compute a text diff between two HTML strings */
export function computeTextDiff(oldHtml: string, newHtml: string): DiffSegment[] {
  const oldText = stripHtml(oldHtml);
  const newText = stripHtml(newHtml);

  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([op, text]) => ({
    type: op === 0 ? "equal" : op === 1 ? "insert" : "delete",
    text,
  }));
}

/** Generate a brief summary of the change */
export function generateChangeSummary(oldHtml: string, newHtml: string): string {
  const oldText = stripHtml(oldHtml);
  const newText = stripHtml(newHtml);

  if (!oldText && newText) return "Added content";
  if (oldText && !newText) return "Removed content";

  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  let inserts = 0;
  let deletes = 0;
  for (const [op] of diffs) {
    if (op === 1) inserts++;
    if (op === -1) deletes++;
  }

  if (inserts > 0 && deletes > 0) return "Edited content";
  if (inserts > 0) return "Added content";
  if (deletes > 0) return "Removed content";
  return "Updated content";
}

/** Check which fields in section content actually changed (ignoring whitespace-only HTML differences) */
export function hasContentChanged(
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>,
  fields: string[]
): string[] {
  const changed: string[] = [];
  for (const field of fields) {
    const oldVal = (oldContent[field] as string) || "";
    const newVal = (newContent[field] as string) || "";
    const oldText = stripHtml(oldVal).replace(/\s+/g, " ").trim();
    const newText = stripHtml(newVal).replace(/\s+/g, " ").trim();
    if (oldText !== newText) {
      changed.push(field);
    }
  }
  return changed;
}
