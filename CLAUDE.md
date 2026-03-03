# CLAUDE.md — Project Instructions for AI Assistants

## Critical Rules

### DO NOT break the TipTap content sync pattern in rich-text-editor.tsx

The `isLocalUpdate` ref + useEffect pattern in `rich-text-editor.tsx` prevents
keystrokes from being dropped. This has regressed THREE times. The rules:

- **Never** call `editor.commands.setContent()` on content that came from user typing
- **Never** remove the `isLocalUpdate` ref guard from the content sync useEffect
- **Never** add a useEffect that calls `setContent` without checking `isLocalUpdate`
- To update content externally (Polish, AI rewrite), just pass a new `content` prop
- The `onUpdate` callback MUST set `isLocalUpdate.current = true` before `onChange`

### DO NOT set `setSaving(true)` on every keystroke in use-proposal.ts

The `setSaving(true)` call must only happen inside `flushSave()`, not in the
debounced content path of `updateSection()`. Setting it on every keystroke
causes the entire editor tree to re-render, compounding the dropped keystroke
problem above.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- Supabase (auth, database, storage)
- TipTap rich text editor
- PDF generation: Puppeteer HTML-to-PDF (`render-html.ts`) and `@react-pdf/renderer`
- SQL migrations in `supabase/migrations/`

## Key Architecture

- Proposals have sections stored in `proposal_sections` table with JSONB `content`
- Auto-save debounce: 800ms in `use-proposal.ts`, batches pending updates per section
- Two parallel PDF renderers that must stay in sync:
  - `src/lib/pdf/render-html.ts` (Puppeteer/HTML)
  - `src/components/pdf/*.tsx` (react-pdf)
- Personnel data: `year_started_in_trade` (not years_in_industry) — auto-calculates display
