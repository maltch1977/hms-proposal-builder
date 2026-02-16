"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { grammarCheckPluginKey } from "./grammar-check-extension";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface GrammarPopoverProps {
  editor: Editor;
}

interface PopoverData {
  message: string;
  replacements: string[];
  ruleId: string;
  category: string;
  from: number;
  to: number;
  rect: { left: number; top: number; bottom: number };
}

export function GrammarPopover({ editor }: GrammarPopoverProps) {
  const [popover, setPopover] = useState<PopoverData | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setPopover(null);
      }
    },
    []
  );

  useEffect(() => {
    if (popover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [popover, handleClickOutside]);

  // Listen for clicks on grammar-decorated spans
  useEffect(() => {
    const editorDom = editor.view.dom;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const grammarSpan = target.closest("[data-grammar-match]") as HTMLElement | null;

      if (!grammarSpan) {
        setPopover(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const message = grammarSpan.getAttribute("data-grammar-message") || "";
      const replacementsStr =
        grammarSpan.getAttribute("data-grammar-replacements") || "[]";
      const ruleId = grammarSpan.getAttribute("data-grammar-rule-id") || "";
      const category = grammarSpan.getAttribute("data-grammar-category") || "";

      let replacements: string[] = [];
      try {
        replacements = JSON.parse(replacementsStr);
      } catch {
        // ignore parse errors
      }

      // Find the PM position range for this decoration
      const offset = parseInt(grammarSpan.getAttribute("data-grammar-offset") || "0", 10);
      const length = parseInt(grammarSpan.getAttribute("data-grammar-length") || "0", 10);

      // Use the DOM element position for the popover
      const spanRect = grammarSpan.getBoundingClientRect();

      // We need to find the actual ProseMirror positions by looking at the decorations
      const pos = editor.view.posAtDOM(grammarSpan, 0);
      const endPos = pos + (grammarSpan.textContent?.length || length);

      setPopover({
        message,
        replacements,
        ruleId,
        category,
        from: pos,
        to: endPos,
        rect: {
          left: spanRect.left,
          top: spanRect.top,
          bottom: spanRect.bottom,
        },
      });
    };

    editorDom.addEventListener("click", handleClick);
    return () => editorDom.removeEventListener("click", handleClick);
  }, [editor]);

  const handleReplace = useCallback(
    (replacement: string) => {
      if (!popover) return;
      editor
        .chain()
        .focus()
        .deleteRange({ from: popover.from, to: popover.to })
        .insertContentAt(popover.from, replacement)
        .run();
      setPopover(null);
    },
    [editor, popover]
  );

  const handleIgnore = useCallback(() => {
    if (!popover) return;
    // Add rule to ignored set via plugin meta
    const pluginState = grammarCheckPluginKey.getState(editor.state) as {
      matches: unknown[];
      ignoredRuleIds: Set<string>;
    } | undefined;

    const ignoredRuleIds = new Set(pluginState?.ignoredRuleIds ?? []);
    ignoredRuleIds.add(popover.ruleId);

    editor.view.dispatch(
      editor.state.tr.setMeta(grammarCheckPluginKey, {
        ignoredRuleIds,
        matches: pluginState?.matches ?? [],
      })
    );
    setPopover(null);
  }, [editor, popover]);

  if (!popover) return null;

  // Position the popover below the error text
  const editorRect = editor.view.dom.closest(".tiptap-editor")?.getBoundingClientRect();
  if (!editorRect) return null;

  const top = popover.rect.bottom - editorRect.top + 4;
  const left = Math.max(0, popover.rect.left - editorRect.left);

  const categoryLabel =
    popover.category === "TYPOS"
      ? "Spelling"
      : popover.category === "GRAMMAR" || popover.category === "CONFUSED_WORDS"
        ? "Grammar"
        : "Style";

  const categoryColor =
    popover.category === "TYPOS"
      ? "text-red-600"
      : popover.category === "GRAMMAR" || popover.category === "CONFUSED_WORDS"
        ? "text-blue-600"
        : "text-amber-600";

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-72 rounded-lg border border-border bg-popover p-3 shadow-lg"
      style={{ top, left: Math.min(left, (editorRect.width - 288)) }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className={`text-[10px] font-semibold uppercase ${categoryColor}`}>
            {categoryLabel}
          </span>
          <p className="text-xs text-foreground mt-0.5">{popover.message}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={() => setPopover(null)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {popover.replacements.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {popover.replacements.map((r, i) => (
            <button
              key={i}
              className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
              onClick={() => handleReplace(r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      <button
        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        onClick={handleIgnore}
      >
        Ignore this rule
      </button>
    </div>
  );
}
