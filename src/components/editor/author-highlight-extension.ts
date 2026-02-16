import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";

export const authorHighlightPluginKey = new PluginKey("authorHighlight");

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b))
    return `rgba(255, 235, 59, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Walk the ProseMirror document and extract plain text with a
 * parallel array of PM positions for each character.
 * Block boundaries become "\n" with position -1.
 */
function extractDocText(doc: PMNode): { text: string; positions: number[] } {
  const chars: string[] = [];
  const positions: number[] = [];
  let lastTextEnd = -1;

  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      // Add newline between separate text runs (block boundary)
      if (lastTextEnd >= 0 && pos > lastTextEnd) {
        chars.push("\n");
        positions.push(-1);
      }
      for (let i = 0; i < node.text.length; i++) {
        chars.push(node.text[i]);
        positions.push(pos + i);
      }
      lastTextEnd = pos + node.text.length;
    }
  });

  return { text: chars.join(""), positions };
}

/**
 * Get decoration attributes based on change type:
 * - AI changes: underline in the AI color
 * - Human changes: background highlight in the person's color
 */
function decorationAttrs(segment: AttributedSegment): Record<string, string> {
  const color = segment.authorColor!;
  const name = segment.authorName || "";
  if (segment.changeType === "ai") {
    return {
      style: `text-decoration: underline; text-decoration-color: ${color}; text-underline-offset: 3px;`,
      class: "author-highlight author-highlight--ai",
      title: "Auto-generated",
    };
  }
  return {
    style: `background-color: ${hexToRgba(color, 0.35)}; border-radius: 2px;`,
    class: "author-highlight author-highlight--human",
    title: name,
  };
}

/**
 * Build ProseMirror decorations by aligning attributed segments
 * with the document's text content.
 */
function buildDecorations(
  doc: PMNode,
  segments: AttributedSegment[]
): DecorationSet {
  if (!segments || segments.length === 0) return DecorationSet.empty;

  const { positions } = extractDocText(doc);
  const decorations: Decoration[] = [];
  let textOffset = 0;

  for (const segment of segments) {
    const segLen = segment.text.length;

    if (segment.authorColor && segment.authorName) {
      const attrs = decorationAttrs(segment);

      // Collect valid PM positions for this segment, splitting at block boundaries
      let rangeStart: number | null = null;
      let rangeEnd: number | null = null;

      for (
        let i = 0;
        i < segLen && textOffset + i < positions.length;
        i++
      ) {
        const pmPos = positions[textOffset + i];

        if (pmPos >= 0) {
          if (rangeStart === null) {
            rangeStart = pmPos;
            rangeEnd = pmPos + 1;
          } else if (pmPos === rangeEnd) {
            rangeEnd = pmPos + 1;
          } else {
            decorations.push(
              Decoration.inline(rangeStart, rangeEnd!, attrs)
            );
            rangeStart = pmPos;
            rangeEnd = pmPos + 1;
          }
        } else {
          if (rangeStart !== null && rangeEnd !== null) {
            decorations.push(
              Decoration.inline(rangeStart, rangeEnd, attrs)
            );
            rangeStart = null;
            rangeEnd = null;
          }
        }
      }

      if (rangeStart !== null && rangeEnd !== null) {
        decorations.push(
          Decoration.inline(rangeStart, rangeEnd, attrs)
        );
      }
    }

    textOffset += segLen;
  }

  return DecorationSet.create(doc, decorations);
}

export const AuthorHighlightExtension = Extension.create({
  name: "authorHighlight",

  addStorage() {
    return {
      segments: [] as AttributedSegment[],
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;

    return [
      new Plugin({
        key: authorHighlightPluginKey,
        state: {
          init(_, state) {
            return buildDecorations(state.doc, storage.segments);
          },
          apply(tr, oldSet) {
            if (tr.getMeta(authorHighlightPluginKey) || tr.docChanged) {
              return buildDecorations(tr.doc, storage.segments);
            }
            return oldSet.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
