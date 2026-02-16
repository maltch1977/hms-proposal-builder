# HMS Proposal Builder — Implementation Plan

**Phase:** 1 (MVP)
**PRD Reference:** Section 18.1
**Date:** February 14, 2026

---

## 1. Supabase Database Schema

### 1.1 Tables

#### `organizations`
Multi-tenant org record. Stores branding/theme config. Even for single-tenant HMS, this enables white-label in Phase 3.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | e.g., "HMS Commercial Service, Inc." |
| `slug` | `text` | UNIQUE, NOT NULL | URL-safe identifier |
| `logo_url` | `text` | | Path in Supabase Storage |
| `primary_color` | `text` | default `'#1B365D'` | Navy |
| `secondary_color` | `text` | default `'#2B5797'` | Blue |
| `accent_color` | `text` | default `'#C9A227'` | Gold |
| `body_text_color` | `text` | default `'#333333'` | |
| `company_name` | `text` | | |
| `company_address` | `text` | | |
| `company_phone` | `text` | | |
| `company_website` | `text` | | |
| `company_email` | `text` | | |
| `footer_text` | `text` | | PDF footer text |
| `theme_config` | `jsonb` | default `'{}'` | Extended theme settings |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `profiles`
Extends Supabase `auth.users`. Every authenticated user has a corresponding profile.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, references `auth.users(id)` ON DELETE CASCADE | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `full_name` | `text` | NOT NULL | |
| `email` | `text` | NOT NULL | |
| `role` | `text` | NOT NULL, CHECK (`super_admin`, `hms_admin`, `proposal_user`) | |
| `manager_id` | `uuid` | FK → `profiles(id)`, nullable | Org hierarchy |
| `avatar_url` | `text` | nullable | |
| `is_active` | `boolean` | default `true` | |
| `requires_approval` | `boolean` | default `false` | Phase 2: approval workflow |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `section_types`
Defines the available section types for an organization. Seeded with the 12 default HMS sections.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `slug` | `text` | NOT NULL | e.g., `cover_page`, `introduction` |
| `display_name` | `text` | NOT NULL | e.g., "Cover Page" |
| `description` | `text` | | |
| `default_order` | `integer` | NOT NULL | 1–12 |
| `content_schema` | `jsonb` | | Defines expected content shape |
| `is_system` | `boolean` | default `true` | Built-in vs custom |
| `is_auto_generated` | `boolean` | default `false` | TOC, Interview Panel |
| `created_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(organization_id, slug)`

#### `proposals`
Core entity. One per proposal.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `created_by` | `uuid` | FK → `profiles(id)`, NOT NULL | |
| `title` | `text` | NOT NULL | |
| `client_name` | `text` | NOT NULL | |
| `client_address` | `text` | default `''` | |
| `project_label` | `text` | default `'RESPONSE TO RFP'` | |
| `status` | `text` | NOT NULL, CHECK (`draft`, `submitted`, `in_review`, `approved`, `returned`, `exported`, `archived`), default `'draft'` | |
| `cover_template` | `text` | CHECK (`photo`, `no_photo`), default `'no_photo'` | |
| `cover_photo_url` | `text` | nullable | |
| `deadline` | `timestamptz` | nullable | Phase 2: RFP deadline |
| `metadata` | `jsonb` | default `'{}'` | Extensible |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `proposal_sections`
Per-proposal section instances. Created from section_types when a proposal is created.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE, NOT NULL | |
| `section_type_id` | `uuid` | FK → `section_types(id)`, NOT NULL | |
| `order_index` | `integer` | NOT NULL | Position in proposal |
| `is_enabled` | `boolean` | default `true` | Toggle on/off |
| `content` | `jsonb` | default `'{}'` | Section-specific content |
| `library_item_id` | `uuid` | FK → `library_items(id)`, nullable | Which library item is loaded |
| `lock_level` | `text` | CHECK (`none`, `admin`, `super_admin`), default `'none'` | |
| `locked_by` | `uuid` | FK → `profiles(id)`, nullable | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(proposal_id, section_type_id)`

#### `library_items`
Universal content library. Stores reusable content for any section type.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `section_type_id` | `uuid` | FK → `section_types(id)`, NOT NULL | |
| `name` | `text` | NOT NULL | Display name |
| `description` | `text` | nullable | |
| `content` | `jsonb` | NOT NULL | Section-specific content |
| `metadata` | `jsonb` | default `'{}'` | Tags, categories for filtering |
| `is_default` | `boolean` | default `false` | One default per section type per org |
| `created_by` | `uuid` | FK → `profiles(id)` | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `past_projects`
Case study records for Firm Background section.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `project_name` | `text` | NOT NULL | |
| `project_type` | `text` | NOT NULL | new_construction, retrofit, ddc_upgrade, service_contract |
| `building_type` | `text` | NOT NULL | hospital, lab, office, school, industrial |
| `client_name` | `text` | NOT NULL | |
| `square_footage` | `integer` | nullable | |
| `completion_date` | `date` | nullable | |
| `narrative` | `text` | | Rich text (HTML) |
| `photos` | `jsonb` | default `'[]'` | Array of photo URLs (max 3) |
| `metadata` | `jsonb` | default `'{}'` | |
| `created_by` | `uuid` | FK → `profiles(id)` | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `personnel`
Employee roster for Key Personnel & Org Chart.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `full_name` | `text` | NOT NULL | |
| `title` | `text` | NOT NULL | |
| `role_type` | `text` | NOT NULL | Executive, Project Manager, Superintendent, Engineer, Programmer |
| `years_in_industry` | `integer` | nullable | |
| `years_at_company` | `integer` | nullable | |
| `years_with_distech` | `integer` | nullable | |
| `task_description` | `text` | | Rich text (HTML) |
| `specialties` | `text[]` | default `'{}'` | healthcare, labs, industrial, etc. |
| `certifications` | `text[]` | default `'{}'` | |
| `photo_url` | `text` | nullable | |
| `is_active` | `boolean` | default `true` | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `references`
Reference contacts for the Reference Check section.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `contact_name` | `text` | NOT NULL | |
| `title` | `text` | NOT NULL | |
| `company` | `text` | NOT NULL | |
| `phone` | `text` | NOT NULL | |
| `email` | `text` | nullable | |
| `category` | `text` | NOT NULL | Owner, General Contractor, Mechanical Contractor |
| `project_ids` | `uuid[]` | default `'{}'` | Linked past_projects |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `cost_library_items`
Reusable line items for Project Cost section.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `description` | `text` | NOT NULL | |
| `type` | `text` | NOT NULL, CHECK (`base`, `adder`, `deduct`) | |
| `default_amount` | `numeric(12,2)` | nullable | |
| `created_at` | `timestamptz` | default `now()` | |
| `updated_at` | `timestamptz` | default `now()` | |

#### `proposal_cost_items`
Per-proposal cost line items.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE, NOT NULL | |
| `description` | `text` | NOT NULL | |
| `type` | `text` | NOT NULL, CHECK (`base`, `adder`, `deduct`) | |
| `amount` | `numeric(12,2)` | NOT NULL | Always positive; sign from type |
| `order_index` | `integer` | NOT NULL | |
| `cost_library_item_id` | `uuid` | FK → `cost_library_items(id)`, nullable | Source library item |
| `created_at` | `timestamptz` | default `now()` | |

#### `proposal_team_members`
Links proposals to personnel for Key Personnel & Interview Panel.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE, NOT NULL | |
| `personnel_id` | `uuid` | FK → `personnel(id)`, NOT NULL | |
| `order_index` | `integer` | NOT NULL | |
| `role_override` | `text` | nullable | Override title for this proposal |
| `hierarchy_position` | `jsonb` | default `'{}'` | Org chart position data |
| `created_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(proposal_id, personnel_id)`

#### `proposal_case_studies`
Links proposals to past projects for Firm Background section.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE, NOT NULL | |
| `past_project_id` | `uuid` | FK → `past_projects(id)`, NOT NULL | |
| `order_index` | `integer` | NOT NULL | |
| `photo_overrides` | `jsonb` | nullable | Per-proposal photo swaps |
| `created_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(proposal_id, past_project_id)`

#### `proposal_references`
Links proposals to references for Reference Check section.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE, NOT NULL | |
| `reference_id` | `uuid` | FK → `references(id)`, NOT NULL | |
| `order_index` | `integer` | NOT NULL | |
| `created_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(proposal_id, reference_id)`

#### `emr_ratings`
Global EMR table maintained per organization.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `year` | `integer` | NOT NULL | |
| `rating` | `numeric(4,2)` | NOT NULL | |
| `created_at` | `timestamptz` | default `now()` | |

**Unique constraint:** `(organization_id, year)`

#### `cover_photos`
Photo library for cover pages.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `url` | `text` | NOT NULL | Supabase Storage path |
| `filename` | `text` | NOT NULL | |
| `project_type` | `text` | nullable | For Phase 2 AI suggestions |
| `building_type` | `text` | nullable | For Phase 2 AI suggestions |
| `tags` | `text[]` | default `'{}'` | |
| `uploaded_by` | `uuid` | FK → `profiles(id)` | |
| `created_at` | `timestamptz` | default `now()` | |

#### `audit_log`
Activity tracking. Super Admin entries are invisible to HMS users.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `user_id` | `uuid` | FK → `profiles(id)`, NOT NULL | |
| `action` | `text` | NOT NULL | create, update, delete, export, login, etc. |
| `entity_type` | `text` | NOT NULL | proposal, library_item, personnel, etc. |
| `entity_id` | `uuid` | nullable | |
| `metadata` | `jsonb` | default `'{}'` | Action-specific details |
| `created_at` | `timestamptz` | default `now()` | |

#### `notifications` *(Schema only — UI deferred to Phase 2)*
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `organization_id` | `uuid` | FK → `organizations(id)`, NOT NULL | |
| `user_id` | `uuid` | FK → `profiles(id)`, NOT NULL | |
| `type` | `text` | NOT NULL | share, approval, deadline, etc. |
| `proposal_id` | `uuid` | FK → `proposals(id)`, nullable | |
| `message` | `text` | NOT NULL | |
| `is_read` | `boolean` | default `false` | |
| `created_at` | `timestamptz` | default `now()` | |

#### `proposal_comments` *(Schema only — UI deferred to Phase 2)*
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE | |
| `section_id` | `uuid` | FK → `proposal_sections(id)`, nullable | |
| `author_id` | `uuid` | FK → `profiles(id)` | |
| `content` | `text` | NOT NULL | |
| `parent_id` | `uuid` | FK → `proposal_comments(id)`, nullable | Threading |
| `is_resolved` | `boolean` | default `false` | |
| `created_at` | `timestamptz` | default `now()` | |

#### `proposal_changes` *(Schema only — UI deferred to Phase 2)*
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `proposal_id` | `uuid` | FK → `proposals(id)` ON DELETE CASCADE | |
| `section_id` | `uuid` | FK → `proposal_sections(id)` | |
| `author_id` | `uuid` | FK → `profiles(id)` | |
| `field` | `text` | NOT NULL | |
| `old_value` | `jsonb` | nullable | |
| `new_value` | `jsonb` | nullable | |
| `status` | `text` | CHECK (`pending`, `accepted`, `rejected`), default `'pending'` | |
| `created_at` | `timestamptz` | default `now()` | |

### 1.2 Row Level Security (RLS) Policies

All tables have RLS enabled. Policies follow the three-tier role model.

#### `organizations`
- **SELECT:** Users can read their own organization only (`organization_id = auth.user.organization_id`)
- **UPDATE:** Super Admin only

#### `profiles`
- **SELECT:** Users can read profiles within their org. HMS Admin can read profiles within their branch (where `manager_id` chain leads to them). Super Admin can read all.
- **INSERT/UPDATE:** Super Admin and HMS Admin (within their branch)
- Users can update their own `avatar_url` and `full_name`

#### `proposals`
- **SELECT:** Proposal User sees own proposals. HMS Admin sees all proposals in their branch. Super Admin sees all.
- **INSERT:** Any authenticated user in the org
- **UPDATE:** Creator can update own proposals. HMS Admin can update proposals in their branch. Super Admin can update all.
- **DELETE:** Super Admin only (soft delete via `archived` status preferred)

#### `proposal_sections`
- **SELECT/UPDATE:** Same policy as parent proposal (joined through `proposal_id`)
- Lock enforcement at application layer + RLS: UPDATE denied if `lock_level = 'super_admin'` and user is not Super Admin; UPDATE denied if `lock_level = 'admin'` and user is `proposal_user`

#### `library_items`
- **SELECT:** All authenticated users in the org
- **INSERT/UPDATE/DELETE:** HMS Admin and Super Admin only

#### `past_projects`, `personnel`, `references`, `cost_library_items`, `cover_photos`
- **SELECT:** All authenticated users in the org
- **INSERT/UPDATE/DELETE:** HMS Admin and Super Admin only

#### `proposal_cost_items`, `proposal_team_members`, `proposal_case_studies`, `proposal_references`
- **SELECT/INSERT/UPDATE/DELETE:** Same policy as parent proposal

#### `emr_ratings`
- **SELECT:** All authenticated users in the org
- **INSERT/UPDATE/DELETE:** HMS Admin and Super Admin only

#### `audit_log`
- **SELECT:** HMS Admin sees logs in their branch, excluding Super Admin actions. Super Admin sees all.
- **INSERT:** System only (via service role or trigger)

#### `notifications`
- **SELECT/UPDATE:** Users can read/update their own notifications only

### 1.3 Database Functions & Triggers

- **`handle_new_user()`**: Trigger on `auth.users` INSERT → creates a `profiles` row
- **`update_updated_at()`**: Trigger on UPDATE → sets `updated_at = now()` on `proposals`, `proposal_sections`, `profiles`, `library_items`, `past_projects`, `personnel`, `organizations`
- **`create_proposal_sections()`**: Function called when a new proposal is created → inserts a `proposal_sections` row for each active `section_type` in the org, with default content from `library_items` where `is_default = true`
- **`log_audit_event()`**: Utility function to insert audit log entries

### 1.4 Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `logos` | Public read, admin write | Organization logos |
| `cover-photos` | Public read, admin write | Cover page photo library |
| `project-photos` | Public read, admin write | Past project photos |
| `personnel-photos` | Public read, admin write | Personnel headshots |
| `proposal-files` | Authenticated read (per proposal), user write | Uploaded Gantt charts, misc files |
| `exports` | Authenticated read (per proposal) | Generated PDF files |

---

## 2. Project File & Folder Structure

```
hms-proposal-builder/
├── docs/
│   ├── PRD.md
│   └── PLAN.md
├── public/
│   └── images/
│       └── placeholder-logo.svg
├── src/
│   ├── app/
│   │   ├── globals.css                    # Tailwind + custom CSS variables
│   │   ├── layout.tsx                     # Root layout (providers, fonts)
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                 # Auth layout (centered card)
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Login page
│   │   │   └── signup/
│   │   │       └── page.tsx               # Signup page (admin-created invites)
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                 # Dashboard layout (sidebar + topbar)
│   │   │   ├── page.tsx                   # Proposals dashboard (home)
│   │   │   │
│   │   │   ├── proposals/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # New proposal creation
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # Proposal editor
│   │   │   │       └── preview/
│   │   │   │           └── page.tsx       # Full-page PDF preview
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── layout.tsx             # Admin layout (admin sidebar)
│   │   │       ├── page.tsx               # Admin overview / redirect
│   │   │       ├── libraries/
│   │   │       │   └── page.tsx           # Library management (all section types)
│   │   │       ├── personnel/
│   │   │       │   └── page.tsx           # Personnel roster management
│   │   │       ├── projects/
│   │   │       │   └── page.tsx           # Past projects management
│   │   │       ├── references/
│   │   │       │   └── page.tsx           # Reference database management
│   │   │       ├── cost-library/
│   │   │       │   └── page.tsx           # Cost library management
│   │   │       ├── cover-photos/
│   │   │       │   └── page.tsx           # Cover photo library
│   │   │       ├── users/
│   │   │       │   └── page.tsx           # User management
│   │   │       └── settings/
│   │   │           └── page.tsx           # Org settings, EMR table, company info
│   │   │
│   │   └── api/
│   │       ├── proposals/
│   │       │   ├── route.ts               # CRUD proposals
│   │       │   └── [id]/
│   │       │       ├── route.ts           # Single proposal operations
│   │       │       ├── duplicate/
│   │       │       │   └── route.ts       # Duplicate proposal
│   │       │       ├── sections/
│   │       │       │   └── route.ts       # Batch update sections
│   │       │       └── export/
│   │       │           └── route.ts       # PDF generation endpoint
│   │       ├── library/
│   │       │   └── route.ts               # Library CRUD
│   │       ├── personnel/
│   │       │   └── route.ts               # Personnel CRUD
│   │       ├── projects/
│   │       │   └── route.ts               # Past projects CRUD
│   │       ├── references/
│   │       │   └── route.ts               # References CRUD
│   │       ├── upload/
│   │       │   └── route.ts               # File upload handler
│   │       └── auth/
│   │           └── callback/
│   │               └── route.ts           # Supabase auth callback
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── command.tsx
│   │   │   ├── popover.tsx
│   │   │   └── scroll-area.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                # Main app sidebar navigation
│   │   │   ├── topbar.tsx                 # Top navigation bar
│   │   │   ├── admin-sidebar.tsx          # Admin panel sidebar
│   │   │   └── user-menu.tsx              # User avatar + dropdown menu
│   │   │
│   │   ├── proposals/
│   │   │   ├── proposal-card.tsx          # Dashboard proposal card
│   │   │   ├── proposal-list.tsx          # Dashboard list view
│   │   │   ├── proposal-filters.tsx       # Search + filter bar
│   │   │   ├── create-proposal-dialog.tsx # New proposal modal
│   │   │   ├── status-badge.tsx           # Proposal status badge
│   │   │   └── empty-state.tsx            # No proposals empty state
│   │   │
│   │   ├── editor/
│   │   │   ├── editor-layout.tsx          # Three-panel editor container
│   │   │   ├── section-sidebar.tsx        # Left: section list + drag/toggle
│   │   │   ├── section-sidebar-item.tsx   # Individual sidebar section row
│   │   │   ├── editor-topbar.tsx          # Editor-specific top bar
│   │   │   ├── section-editor.tsx         # Main: section content renderer
│   │   │   ├── section-wrapper.tsx        # Wrapper per section (header, lock, library)
│   │   │   ├── library-selector.tsx       # Library item picker (command palette)
│   │   │   ├── lock-indicator.tsx         # Lock badge + message
│   │   │   ├── rich-text-editor.tsx       # TipTap editor wrapper
│   │   │   ├── file-upload.tsx            # File upload dropzone
│   │   │   ├── preview-panel.tsx          # Right: PDF preview panel
│   │   │   └── auto-save-indicator.tsx    # "Saved" indicator
│   │   │
│   │   ├── sections/
│   │   │   ├── cover-page.tsx             # Cover Page editor
│   │   │   ├── introduction.tsx           # Introduction editor
│   │   │   ├── table-of-contents.tsx      # TOC (read-only preview)
│   │   │   ├── firm-background.tsx        # Firm Background narrative
│   │   │   ├── case-study-selector.tsx    # Case study picker (past projects)
│   │   │   ├── case-study-card.tsx        # Individual case study card
│   │   │   ├── key-personnel.tsx          # Key Personnel editor
│   │   │   ├── team-selector.tsx          # Personnel picker
│   │   │   ├── org-chart.tsx              # Auto-generated org chart
│   │   │   ├── personnel-table.tsx        # Auto-generated personnel table
│   │   │   ├── project-schedule.tsx       # Project Schedule (upload)
│   │   │   ├── site-logistics.tsx         # Site Logistics & Safety editor
│   │   │   ├── emr-table.tsx              # EMR table component
│   │   │   ├── qaqc-commissioning.tsx     # QA/QC/Commissioning editor
│   │   │   ├── closeout.tsx               # Closeout editor
│   │   │   ├── reference-check.tsx        # Reference Check editor
│   │   │   ├── reference-selector.tsx     # Reference picker by category
│   │   │   ├── interview-panel.tsx        # Interview Panel (auto-generated)
│   │   │   ├── project-cost.tsx           # Project Cost editor
│   │   │   └── cost-line-item.tsx         # Individual cost row
│   │   │
│   │   ├── admin/
│   │   │   ├── data-table.tsx             # Reusable admin data table
│   │   │   ├── library-manager.tsx        # Library item CRUD
│   │   │   ├── library-item-form.tsx      # Library item create/edit form
│   │   │   ├── personnel-manager.tsx      # Personnel CRUD
│   │   │   ├── personnel-form.tsx         # Personnel create/edit form
│   │   │   ├── project-manager.tsx        # Past projects CRUD
│   │   │   ├── project-form.tsx           # Past project create/edit form
│   │   │   ├── reference-manager.tsx      # References CRUD
│   │   │   ├── reference-form.tsx         # Reference create/edit form
│   │   │   ├── cost-library-manager.tsx   # Cost library CRUD
│   │   │   ├── cover-photo-manager.tsx    # Cover photo library
│   │   │   ├── user-manager.tsx           # User management
│   │   │   ├── user-form.tsx              # User create/edit form
│   │   │   ├── emr-manager.tsx            # EMR table CRUD
│   │   │   └── settings-form.tsx          # Organization settings form
│   │   │
│   │   └── pdf/
│   │       ├── proposal-document.tsx      # Root React-PDF document
│   │       ├── pdf-styles.ts              # Shared PDF styles
│   │       ├── page-header.tsx            # PDF page header
│   │       ├── page-footer.tsx            # PDF page footer
│   │       ├── cover-page-pdf.tsx         # Cover page PDF template
│   │       ├── introduction-pdf.tsx       # Introduction PDF template
│   │       ├── toc-pdf.tsx                # Table of Contents PDF
│   │       ├── firm-background-pdf.tsx    # Firm Background PDF
│   │       ├── case-study-pdf.tsx         # Case study card PDF
│   │       ├── key-personnel-pdf.tsx      # Key Personnel PDF
│   │       ├── org-chart-pdf.tsx          # Org chart PDF
│   │       ├── schedule-pdf.tsx           # Project Schedule PDF
│   │       ├── safety-pdf.tsx             # Site Logistics & Safety PDF
│   │       ├── emr-table-pdf.tsx          # EMR table PDF
│   │       ├── qaqc-pdf.tsx              # QA/QC/Commissioning PDF
│   │       ├── closeout-pdf.tsx           # Closeout PDF
│   │       ├── reference-pdf.tsx          # Reference Check PDF
│   │       ├── interview-pdf.tsx          # Interview Panel PDF
│   │       └── project-cost-pdf.tsx       # Project Cost PDF
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  # Browser Supabase client
│   │   │   ├── server.ts                  # Server Supabase client
│   │   │   ├── middleware.ts              # Auth middleware helper
│   │   │   └── admin.ts                   # Service role client (API routes)
│   │   │
│   │   ├── hooks/
│   │   │   ├── use-user.ts               # Current user hook
│   │   │   ├── use-proposals.ts           # Proposals CRUD hook
│   │   │   ├── use-proposal.ts            # Single proposal hook
│   │   │   ├── use-sections.ts            # Proposal sections hook
│   │   │   ├── use-library.ts             # Library items hook
│   │   │   ├── use-personnel.ts           # Personnel hook
│   │   │   ├── use-projects.ts            # Past projects hook
│   │   │   ├── use-references.ts          # References hook
│   │   │   ├── use-auto-save.ts           # Auto-save debounce hook
│   │   │   └── use-org.ts                 # Organization data hook
│   │   │
│   │   ├── types/
│   │   │   ├── database.ts                # Supabase generated types
│   │   │   ├── proposal.ts                # Proposal-related types
│   │   │   ├── section.ts                 # Section content type definitions
│   │   │   └── index.ts                   # Re-exports
│   │   │
│   │   ├── utils/
│   │   │   ├── cn.ts                      # Tailwind class merge utility
│   │   │   ├── format.ts                  # Currency, date formatting
│   │   │   └── constants.ts               # Section slugs, role types, categories
│   │   │
│   │   └── providers/
│   │       ├── auth-provider.tsx           # Auth context provider
│   │       ├── org-provider.tsx            # Organization context provider
│   │       └── toast-provider.tsx          # Toast notification provider
│   │
│   └── middleware.ts                       # Next.js middleware (auth redirect)
│
├── supabase/
│   ├── config.toml                        # Supabase local config
│   ├── migrations/
│   │   └── 00001_initial_schema.sql       # Full schema migration
│   └── seed.sql                           # Seed data (org, section types, demo content)
│
├── .env.local.example                     # Environment variable template
├── components.json                        # shadcn/ui config
├── next.config.ts                         # Next.js configuration
├── tailwind.config.ts                     # Tailwind configuration
├── tsconfig.json                          # TypeScript configuration
├── postcss.config.mjs                     # PostCSS configuration
├── package.json                           # Dependencies
└── .gitignore
```

---

## 3. Build Order — Step-by-Step Tasks

### Task 1: Project Initialization & Dependencies

**Goal:** Scaffold Next.js 15 project, install all dependencies, configure Tailwind and shadcn/ui.

**Files to create/modify:**
- `package.json` — all dependencies
- `next.config.ts` — Next.js config
- `tailwind.config.ts` — custom theme (HMS colors, Inter font, spacing)
- `postcss.config.mjs`
- `tsconfig.json`
- `components.json` — shadcn/ui config
- `src/app/globals.css` — Tailwind directives + CSS custom properties
- `src/app/layout.tsx` — root layout with Inter font
- `src/lib/utils/cn.ts` — `cn()` utility
- `.env.local.example`
- `.gitignore`

**Dependencies:**
```
next@15 react react-dom typescript
tailwindcss postcss autoprefixer
@supabase/supabase-js @supabase/ssr
@react-pdf/renderer
@tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
lucide-react
date-fns
zod
react-dropzone
```

**shadcn/ui components to install:**
button, input, dialog, dropdown-menu, select, badge, card, table, tabs, switch, skeleton, separator, sheet, tooltip, command, popover, scroll-area, toast, toaster, label, textarea, avatar, alert-dialog, checkbox, radio-group, form

---

### Task 2: Supabase Schema, Auth & Storage Setup

**Goal:** Create the complete database schema, RLS policies, triggers, storage buckets, and seed data.

**Files to create/modify:**
- `supabase/config.toml`
- `supabase/migrations/00001_initial_schema.sql` — all tables, indexes, constraints
- `supabase/migrations/00002_rls_policies.sql` — all RLS policies
- `supabase/migrations/00003_functions_triggers.sql` — functions and triggers
- `supabase/migrations/00004_storage.sql` — storage bucket creation and policies
- `supabase/seed.sql` — HMS organization, 12 section types, sample data
- `src/lib/supabase/client.ts` — browser client
- `src/lib/supabase/server.ts` — server client (cookies)
- `src/lib/supabase/admin.ts` — service role client
- `src/lib/supabase/middleware.ts` — middleware helper
- `src/lib/types/database.ts` — TypeScript types (generated via `supabase gen types`)

---

### Task 3: Authentication System

**Goal:** Supabase Auth with email/password. Login page, signup flow, protected routes, user context.

**Files to create/modify:**
- `src/middleware.ts` — Next.js middleware for auth redirects
- `src/app/(auth)/layout.tsx` — centered auth layout
- `src/app/(auth)/login/page.tsx` — login form
- `src/app/(auth)/signup/page.tsx` — signup form (invited users)
- `src/app/api/auth/callback/route.ts` — OAuth callback handler
- `src/lib/providers/auth-provider.tsx` — auth context with user + profile
- `src/lib/hooks/use-user.ts` — `useUser()` hook
- `src/lib/types/proposal.ts` — start building shared types

---

### Task 4: Application Shell & Layout

**Goal:** Build the dashboard layout with sidebar navigation, top bar, user menu, and responsive behavior. Premium, Linear-like aesthetic.

**Files to create/modify:**
- `src/app/(dashboard)/layout.tsx` — dashboard layout
- `src/components/layout/sidebar.tsx` — main navigation sidebar
- `src/components/layout/topbar.tsx` — top bar
- `src/components/layout/user-menu.tsx` — avatar + dropdown
- `src/lib/providers/org-provider.tsx` — organization context
- `src/lib/providers/toast-provider.tsx` — toast notifications
- `src/lib/hooks/use-org.ts` — organization data hook
- `src/lib/utils/constants.ts` — role types, section slugs, etc.
- `src/lib/utils/format.ts` — formatting utilities

---

### Task 5: Proposals Dashboard

**Goal:** Main landing page showing all proposals with search, filter, status badges, empty state. Skeleton loading states.

**Files to create/modify:**
- `src/app/(dashboard)/page.tsx` — dashboard page
- `src/components/proposals/proposal-card.tsx` — proposal card
- `src/components/proposals/proposal-list.tsx` — list container
- `src/components/proposals/proposal-filters.tsx` — search + filter bar
- `src/components/proposals/create-proposal-dialog.tsx` — new proposal modal
- `src/components/proposals/status-badge.tsx` — status badges
- `src/components/proposals/empty-state.tsx` — empty state
- `src/lib/hooks/use-proposals.ts` — proposals CRUD hook
- `src/app/api/proposals/route.ts` — proposals list + create API

---

### Task 6: Proposal Editor — Layout & Section Infrastructure

**Goal:** Three-panel editor layout. Left sidebar with drag-and-drop section reordering and toggle switches. Main scrollable editor area. Toggleable right preview panel. Auto-save system.

**Files to create/modify:**
- `src/app/(dashboard)/proposals/[id]/page.tsx` — editor page
- `src/components/editor/editor-layout.tsx` — three-panel container
- `src/components/editor/section-sidebar.tsx` — section list with DnD + toggles
- `src/components/editor/section-sidebar-item.tsx` — sidebar row
- `src/components/editor/editor-topbar.tsx` — editor top bar (title, status, save, export)
- `src/components/editor/section-editor.tsx` — main content area (renders active sections)
- `src/components/editor/section-wrapper.tsx` — per-section wrapper (header, library, lock)
- `src/components/editor/auto-save-indicator.tsx` — auto-save status
- `src/components/editor/preview-panel.tsx` — right panel (placeholder for PDF)
- `src/lib/hooks/use-proposal.ts` — single proposal with sections
- `src/lib/hooks/use-sections.ts` — section CRUD operations
- `src/lib/hooks/use-auto-save.ts` — debounced auto-save
- `src/app/api/proposals/[id]/route.ts` — single proposal API
- `src/app/api/proposals/[id]/sections/route.ts` — sections API

---

### Task 7: Universal Section Pattern — Library, Rich Text, Locking

**Goal:** Implement the universal section pattern components: library selector (command palette), rich text editor (TipTap), file upload, and lock indicator. These are reused across all section types.

**Files to create/modify:**
- `src/components/editor/library-selector.tsx` — library browser/picker
- `src/components/editor/rich-text-editor.tsx` — TipTap editor
- `src/components/editor/lock-indicator.tsx` — lock badge + message
- `src/components/editor/file-upload.tsx` — file upload dropzone
- `src/lib/hooks/use-library.ts` — library items hook
- `src/app/api/library/route.ts` — library CRUD API
- `src/app/api/upload/route.ts` — file upload API
- `src/lib/types/section.ts` — section content type definitions

---

### Task 8: Content Sections — Cover Page, Introduction, Table of Contents

**Goal:** Build the first three section editors. Cover Page with two templates and photo picker. Introduction with rich text + library. Auto-generated Table of Contents.

**Files to create/modify:**
- `src/components/sections/cover-page.tsx` — cover page editor (template toggle, photo upload, fields)
- `src/components/sections/introduction.tsx` — introduction rich text editor
- `src/components/sections/table-of-contents.tsx` — auto-generated TOC preview

---

### Task 9: Content Sections — Firm Background & Key Personnel

**Goal:** Firm Background with narrative and case study selection. Key Personnel with team selector, auto-generated org chart, and personnel table.

**Files to create/modify:**
- `src/components/sections/firm-background.tsx` — narrative editor
- `src/components/sections/case-study-selector.tsx` — past project picker (search, filter by type/building)
- `src/components/sections/case-study-card.tsx` — selected case study card with photo
- `src/components/sections/key-personnel.tsx` — key personnel section container
- `src/components/sections/team-selector.tsx` — personnel picker (search, filter by role/specialty)
- `src/components/sections/org-chart.tsx` — auto-generated org chart (CSS/SVG)
- `src/components/sections/personnel-table.tsx` — team details table
- `src/lib/hooks/use-personnel.ts` — personnel data hook
- `src/lib/hooks/use-projects.ts` — past projects data hook
- `src/app/api/personnel/route.ts` — personnel API
- `src/app/api/projects/route.ts` — past projects API

---

### Task 10: Content Sections — Schedule, Safety, QA/QC, Closeout

**Goal:** Build the middle section editors. Project Schedule (file upload and embed only — AI deferred to Phase 2). Site Logistics with EMR table. QA/QC with three sub-sections. Closeout.

**Files to create/modify:**
- `src/components/sections/project-schedule.tsx` — file upload + preview/embed
- `src/components/sections/site-logistics.tsx` — rich text + EMR table
- `src/components/sections/emr-table.tsx` — EMR rating display/edit
- `src/components/sections/qaqc-commissioning.tsx` — three sub-section editor
- `src/components/sections/closeout.tsx` — rich text editor

---

### Task 11: Content Sections — References, Interview Panel, Project Cost

**Goal:** Reference Check with category-filtered selector. Interview Panel auto-generated from team selection (shared with Key Personnel). Project Cost with dynamic line items and auto-calculation.

**Files to create/modify:**
- `src/components/sections/reference-check.tsx` — reference section container
- `src/components/sections/reference-selector.tsx` — reference picker by category
- `src/components/sections/interview-panel.tsx` — auto-generated from team
- `src/components/sections/project-cost.tsx` — dynamic line-item table
- `src/components/sections/cost-line-item.tsx` — individual cost row
- `src/lib/hooks/use-references.ts` — references data hook
- `src/app/api/references/route.ts` — references API

---

### Task 12: Admin Panel — Layout & Library Management

**Goal:** Admin panel with dedicated sidebar navigation. Library management interface for all section types: create, edit, delete, set default.

**Files to create/modify:**
- `src/app/(dashboard)/admin/layout.tsx` — admin layout with sidebar
- `src/app/(dashboard)/admin/page.tsx` — admin overview (redirect or summary)
- `src/components/layout/admin-sidebar.tsx` — admin navigation sidebar
- `src/app/(dashboard)/admin/libraries/page.tsx` — library management page
- `src/components/admin/data-table.tsx` — reusable data table
- `src/components/admin/library-manager.tsx` — library CRUD
- `src/components/admin/library-item-form.tsx` — library create/edit form

---

### Task 13: Admin Panel — Personnel, Projects, References, Cost Library, Photos

**Goal:** Full CRUD management for all data entities: personnel roster, past projects (with photo management), reference contacts, cost library items, and cover photo library.

**Files to create/modify:**
- `src/app/(dashboard)/admin/personnel/page.tsx`
- `src/components/admin/personnel-manager.tsx`
- `src/components/admin/personnel-form.tsx`
- `src/app/(dashboard)/admin/projects/page.tsx`
- `src/components/admin/project-manager.tsx`
- `src/components/admin/project-form.tsx`
- `src/app/(dashboard)/admin/references/page.tsx`
- `src/components/admin/reference-manager.tsx`
- `src/components/admin/reference-form.tsx`
- `src/app/(dashboard)/admin/cost-library/page.tsx`
- `src/components/admin/cost-library-manager.tsx`
- `src/app/(dashboard)/admin/cover-photos/page.tsx`
- `src/components/admin/cover-photo-manager.tsx`

---

### Task 14: Admin Panel — User Management & Settings

**Goal:** User management (create, edit, deactivate, role assignment, manager assignment). Organization settings (company info, EMR table management).

**Files to create/modify:**
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/components/admin/user-manager.tsx`
- `src/components/admin/user-form.tsx`
- `src/app/(dashboard)/admin/settings/page.tsx`
- `src/components/admin/settings-form.tsx`
- `src/components/admin/emr-manager.tsx`

---

### Task 15: PDF Generation

**Goal:** React-PDF templates for all 12 section types with HMS branding. Server-side rendering via API route. Preview panel integration. Download/export flow.

**Files to create/modify:**
- `src/components/pdf/proposal-document.tsx` — root document (assembles all sections)
- `src/components/pdf/pdf-styles.ts` — shared styles (colors, fonts, spacing)
- `src/components/pdf/page-header.tsx` — HMS logo + proposal info header
- `src/components/pdf/page-footer.tsx` — "HMS Commercial Service, Inc." + page number
- `src/components/pdf/cover-page-pdf.tsx` — Template A and B
- `src/components/pdf/introduction-pdf.tsx`
- `src/components/pdf/toc-pdf.tsx` — with dynamic page numbers
- `src/components/pdf/firm-background-pdf.tsx`
- `src/components/pdf/case-study-pdf.tsx`
- `src/components/pdf/key-personnel-pdf.tsx`
- `src/components/pdf/org-chart-pdf.tsx`
- `src/components/pdf/schedule-pdf.tsx`
- `src/components/pdf/safety-pdf.tsx`
- `src/components/pdf/emr-table-pdf.tsx`
- `src/components/pdf/qaqc-pdf.tsx`
- `src/components/pdf/closeout-pdf.tsx`
- `src/components/pdf/reference-pdf.tsx`
- `src/components/pdf/interview-pdf.tsx`
- `src/components/pdf/project-cost-pdf.tsx`
- `src/app/api/proposals/[id]/export/route.ts` — PDF generation + storage
- `src/app/(dashboard)/proposals/[id]/preview/page.tsx` — full-page preview
- Update `src/components/editor/preview-panel.tsx` — live PDF rendering

---

### Task 16: Polish, Locking, Duplication & Phase 2 Preparation

**Goal:** Section locking enforcement. Proposal duplication. Loading states everywhere (skeletons). Empty states with inviting CTAs. Smooth transitions and animations. Error handling and toast notifications. Architectural hooks for Phase 2 (AI integration points, Liveblocks-ready editor, comments/changes schema in place).

**Files to create/modify:**
- Update all section components — enforce lock behavior
- `src/app/api/proposals/[id]/duplicate/route.ts` — duplication endpoint
- Update all page components — add skeleton loading states
- Update all list views — add empty states
- Add CSS transitions to `globals.css`
- Audit all error paths — add toast notifications
- Create Phase 2 placeholder comments in:
  - `src/components/editor/rich-text-editor.tsx` — note Liveblocks collaboration extension point
  - `src/components/editor/section-wrapper.tsx` — note commenting hook point
  - `src/app/api/proposals/[id]/route.ts` — note AI quality check hook point
  - `src/app/(dashboard)/proposals/new/page.tsx` — note RFP upload path entry point

---

## 4. Key Architecture Decisions for Phase 2 Readiness

### Rich Text Editor: TipTap
TipTap is chosen specifically because it supports the Liveblocks Yjs collaboration extension. In Phase 2, adding real-time co-editing requires only adding the `@liveblocks/react-tiptap` plugin — no editor replacement.

### Content as JSONB
All section content is stored as JSONB in `proposal_sections.content`. This allows the content schema to evolve without migrations and supports storing TipTap's JSON document format natively (required for Liveblocks sync).

### API Route Architecture
All data mutations go through Next.js API routes (`/api/*`). This creates clean insertion points for Phase 2 AI features (e.g., a pre-export quality check middleware in the export route, an RFP parsing endpoint).

### Section Type Registry
Each section type has a `slug` that maps to both the editor component and the PDF component. New section types can be added by registering a new slug, editor, and PDF template — the system dynamically renders based on the registry.

### Schema-First for Deferred Features
Tables for `proposal_comments`, `proposal_changes`, and `notifications` are created in the initial migration but have no UI. This means Phase 2 can add collaboration features without database changes.

### Organization Context
All data is scoped to `organization_id`. This makes the white-label Phase 3 feature a configuration change rather than a data model change.

---

## 5. Design System Notes

### CSS Custom Properties (from organization theme)
```css
--color-primary: #1B365D;    /* HMS Navy */
--color-secondary: #2B5797;  /* HMS Blue */
--color-accent: #C9A227;     /* HMS Gold */
--color-text: #333333;
--color-bg: #FFFFFF;
--color-surface: #F8F9FA;    /* Light gray for cards */
--color-border: #E5E7EB;     /* Subtle borders */
--color-muted: #6B7280;      /* Secondary text */
```

### Typography Scale
- `font-sans`: Inter (loaded via `next/font`)
- Display: 30px / 36px — page titles
- Heading: 20px / 28px — section headers
- Subheading: 16px / 24px — card titles, sidebar items
- Body: 14px / 20px — general content
- Caption: 12px / 16px — metadata, timestamps

### Component Patterns
- Cards: `bg-white border border-gray-200 rounded-lg shadow-sm`
- Hover states: `transition-all duration-150 hover:shadow-md hover:border-gray-300`
- Active sidebar item: left border accent + subtle background
- Skeleton loading: animated shimmer, matches layout shape
- Empty states: centered icon + heading + description + CTA button
- Toast notifications: slide-in from bottom-right, auto-dismiss 4s
