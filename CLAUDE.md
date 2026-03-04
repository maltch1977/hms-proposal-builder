# CLAUDE.md — Project Instructions for AI Assistants

## Critical Rules — AUTO-SAVE / KEYSTROKE DROPPING

**This bug has regressed FOUR times. These rules are non-negotiable.**

The client has repeatedly lost the ability to type in the editor because
auto-save disrupts the TipTap editor state. Three independent mechanisms
must ALL remain intact to prevent this:

### 1. isLocalUpdate guard in rich-text-editor.tsx

The `isLocalUpdate` ref + useEffect pattern prevents `setContent()` from
firing on content the user just typed (which resets the cursor).

- **Never** call `editor.commands.setContent()` on content that came from user typing
- **Never** remove the `isLocalUpdate` ref guard from the content sync useEffect
- **Never** add a useEffect that calls `setContent` without checking `isLocalUpdate`
- To update content externally (Polish, AI rewrite), just pass a new `content` prop
- The `onUpdate` callback MUST set `isLocalUpdate.current = true` before `onChange`

### 2. No setSaving(true) on every keystroke in use-proposal.ts

`setSaving(true)` must only happen inside `flushSave()`, not in the debounced
content path of `updateSection()`. Setting it on every keystroke re-renders the
entire editor tree.

### 3. No setSections() inside flushSave's API response handler in use-proposal.ts

`flushSave()` must NOT call `setSections()` after the API call succeeds.
The optimistic update already happened in `updateSection()` at keystroke time.
By the time the API response arrives, the user may have typed more — writing
the stale `updates` object back into state overwrites newer content and resets
the cursor. This was the root cause of the 4th regression.

**If you are modifying use-proposal.ts or rich-text-editor.tsx, re-read
these rules before saving your changes.**

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
