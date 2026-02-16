import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

export const grammarCheckPluginKey = new PluginKey("grammarCheck");

export interface GrammarMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage: string;
  replacements: Array<{ value: string }>;
  rule: {
    id: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface PluginState {
  decorations: DecorationSet;
  matches: GrammarMatch[];
  ignoredRuleIds: Set<string>;
  loading: boolean;
  enabled: boolean;
}

/**
 * Walk the ProseMirror document and extract plain text with a
 * parallel array of PM positions for each character.
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

function getCategoryClass(categoryId: string): string {
  switch (categoryId) {
    case "TYPOS":
      return "grammar-error--spelling";
    case "GRAMMAR":
    case "CONFUSED_WORDS":
      return "grammar-error--grammar";
    case "PUNCTUATION":
    case "STYLE":
    case "TYPOGRAPHY":
    case "REDUNDANCY":
    case "CASING":
      return "grammar-error--style";
    default:
      return "grammar-error--grammar";
  }
}

function buildDecorations(
  doc: PMNode,
  matches: GrammarMatch[],
  ignoredRuleIds: Set<string>
): DecorationSet {
  if (!matches || matches.length === 0) return DecorationSet.empty;

  const { positions } = extractDocText(doc);
  const decorations: Decoration[] = [];

  for (const match of matches) {
    if (ignoredRuleIds.has(match.rule.id)) continue;

    const startOffset = match.offset;
    const endOffset = match.offset + match.length;

    // Map character offsets to PM positions
    if (startOffset >= positions.length || endOffset > positions.length) continue;

    const pmStart = positions[startOffset];
    const pmEnd = positions[endOffset - 1];

    if (pmStart < 0 || pmEnd < 0) continue;

    const cssClass = getCategoryClass(match.rule.category.id);

    decorations.push(
      Decoration.inline(pmStart, pmEnd + 1, {
        class: cssClass,
        "data-grammar-match": "true",
        "data-grammar-offset": String(match.offset),
        "data-grammar-length": String(match.length),
        "data-grammar-message": match.message,
        "data-grammar-short-message": match.shortMessage || "",
        "data-grammar-replacements": JSON.stringify(
          match.replacements.slice(0, 5).map((r) => r.value)
        ),
        "data-grammar-rule-id": match.rule.id,
        "data-grammar-category": match.rule.category.id,
      })
    );
  }

  return DecorationSet.create(doc, decorations);
}

export const GrammarCheckExtension = Extension.create({
  name: "grammarCheck",

  addProseMirrorPlugins() {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

    return [
      new Plugin({
        key: grammarCheckPluginKey,

        state: {
          init(): PluginState {
            return {
              decorations: DecorationSet.empty,
              matches: [],
              ignoredRuleIds: new Set(),
              loading: false,
              enabled: true,
            };
          },

          apply(tr, prevState: PluginState): PluginState {
            const meta = tr.getMeta(grammarCheckPluginKey);

            if (meta) {
              const enabled = meta.enabled ?? prevState.enabled;

              // If being disabled, clear decorations
              if (!enabled) {
                return {
                  ...prevState,
                  ...meta,
                  enabled,
                  decorations: DecorationSet.empty,
                };
              }

              // Update from async grammar check, ignore action, or re-enable
              return {
                ...prevState,
                ...meta,
                enabled,
                decorations: buildDecorations(
                  tr.doc,
                  meta.matches ?? prevState.matches,
                  meta.ignoredRuleIds ?? prevState.ignoredRuleIds
                ),
              };
            }

            if (tr.docChanged) {
              // Remap existing decorations to follow text movement
              return {
                ...prevState,
                decorations: prevState.decorations.map(tr.mapping, tr.doc),
              };
            }

            return prevState;
          },
        },

        view(editorView: EditorView) {
          function scheduleCheck() {
            if (debounceTimer) clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
              runGrammarCheck(editorView);
            }, 2000);
          }

          function runGrammarCheck(view: EditorView) {
            const pluginState = grammarCheckPluginKey.getState(view.state) as PluginState | undefined;
            if (!pluginState?.enabled) return;

            const { text } = extractDocText(view.state.doc);
            if (text.trim().length < 5) return;

            // Abort any in-flight request
            if (abortController) abortController.abort();
            abortController = new AbortController();

            const currentAbort = abortController;

            // Set loading
            view.dispatch(
              view.state.tr.setMeta(grammarCheckPluginKey, { loading: true })
            );

            fetch("/api/grammar-check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
              signal: currentAbort.signal,
            })
              .then((res) => res.json())
              .then(({ matches }) => {
                if (currentAbort.signal.aborted) return;
                const currentState = grammarCheckPluginKey.getState(view.state) as PluginState | undefined;
                view.dispatch(
                  view.state.tr.setMeta(grammarCheckPluginKey, {
                    matches: matches || [],
                    loading: false,
                    ignoredRuleIds: currentState?.ignoredRuleIds ?? new Set(),
                  })
                );
              })
              .catch((err) => {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Grammar check failed:", err);
                view.dispatch(
                  view.state.tr.setMeta(grammarCheckPluginKey, { loading: false })
                );
              });
          }

          // Run initial check after a short delay
          debounceTimer = setTimeout(() => {
            runGrammarCheck(editorView);
          }, 3000);

          return {
            update(view, prevState) {
              const currentState = grammarCheckPluginKey.getState(view.state) as PluginState | undefined;
              const oldState = grammarCheckPluginKey.getState(prevState) as PluginState | undefined;

              // Re-enabled: schedule a fresh check
              if (currentState?.enabled && !oldState?.enabled) {
                scheduleCheck();
                return;
              }

              // Disabled: abort any pending work
              if (!currentState?.enabled) {
                if (debounceTimer) clearTimeout(debounceTimer);
                if (abortController) abortController.abort();
                return;
              }

              if (view.state.doc !== prevState.doc) {
                scheduleCheck();
              }
            },
            destroy() {
              if (debounceTimer) clearTimeout(debounceTimer);
              if (abortController) abortController.abort();
            },
          };
        },

        props: {
          decorations(state) {
            const pluginState = this.getState(state) as PluginState | undefined;
            return pluginState?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
