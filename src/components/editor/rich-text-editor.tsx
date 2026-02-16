"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { RequirementMark } from "./requirement-mark";
import {
  AuthorHighlightExtension,
  authorHighlightPluginKey,
} from "./author-highlight-extension";
import {
  GrammarCheckExtension,
  grammarCheckPluginKey,
} from "./grammar-check-extension";
import { GrammarPopover } from "./grammar-popover";
import { cn } from "@/lib/utils";
import type { AttributedSegment } from "@/lib/utils/compute-author-highlights";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Eye,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  authorHighlights?: AttributedSegment[];
}

// Phase 2: Add @liveblocks/react-tiptap collaboration extension here
export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  disabled = false,
  className,
  authorHighlights,
}: RichTextEditorProps) {
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(true);
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);
  const [requirementMarksEnabled, setRequirementMarksEnabled] = useState(true);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      RequirementMark,
      Placeholder.configure({ placeholder }),
      AuthorHighlightExtension,
      GrammarCheckExtension,
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px]",
        spellcheck: "true",
      },
    },
  });

  // Update highlight decorations when segments change
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.storage as any).authorHighlight.segments = authorHighlights || [];
    editor.view.dispatch(
      editor.state.tr.setMeta(authorHighlightPluginKey, true)
    );
  }, [editor, authorHighlights]);

  // Toggle browser spellcheck on the ProseMirror DOM
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("spellcheck", String(spellCheckEnabled));
  }, [editor, spellCheckEnabled]);

  // Toggle grammar check plugin enabled state
  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(
      editor.state.tr.setMeta(grammarCheckPluginKey, {
        enabled: grammarCheckEnabled,
      })
    );
  }, [editor, grammarCheckEnabled]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    label,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            isActive && "bg-accent text-accent-foreground"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div
      className={cn(
        "tiptap-editor rounded-lg border border-input/80 bg-background",
        disabled && "opacity-50",
        !grammarCheckEnabled && "hide-grammar-errors",
        !highlightsEnabled && "hide-author-highlights",
        !requirementMarksEnabled && "hide-requirement-marks",
        className
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-border/60 bg-muted/30 px-3 py-1.5 rounded-t-lg">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          icon={UnderlineIcon}
          label="Underline"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
          icon={Heading3}
          label="Heading 3"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon={ListOrdered}
          label="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          icon={Quote}
          label="Quote"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          label="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          label="Redo"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Toggle overlays</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuLabel>Show overlays</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={spellCheckEnabled}
              onCheckedChange={setSpellCheckEnabled}
            >
              Spell Check
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={grammarCheckEnabled}
              onCheckedChange={setGrammarCheckEnabled}
            >
              Grammar Check
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={highlightsEnabled}
              onCheckedChange={setHighlightsEnabled}
            >
              Author Highlights
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={requirementMarksEnabled}
              onCheckedChange={setRequirementMarksEnabled}
            >
              Requirement Marks
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative">
        <EditorContent editor={editor} />
        <GrammarPopover editor={editor} />
      </div>
    </div>
  );
}
