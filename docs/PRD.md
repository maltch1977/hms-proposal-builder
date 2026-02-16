# HMS Proposal Builder — Product Requirements Document

**Version:** 1.0
**Date:** February 14, 2026
**Author:** Maltby Ventures
**Client:** HMS Commercial Service, Inc.
**Status:** Draft
**Classification:** Confidential

---

## 1. Executive Summary

HMS Commercial Service, Inc. is a Portland, Oregon-based commercial HVAC installation and controls company specializing in large-scale projects ranging from $500K to $50M+. Their proposal process currently relies on Microsoft Publisher exports to PDF, resulting in inconsistent formatting, duplicated effort, and a lack of standardization across their sales team.

The HMS Proposal Builder is a web-based application that replaces this manual process with a structured, AI-assisted proposal authoring platform. Users create proposals from scratch by filling in forms, selecting from content libraries, uploading project-specific files, and toggling sections on or off. The system enforces consistent branding, automates repetitive content, and produces professional PDF output every time.

The platform includes an AI-powered RFP intake engine that can parse uploaded RFP documents, extract requirements, and pre-fill the proposal with relevant content from the library — dramatically reducing the time and effort required to respond to bids.

### Key Objectives

- Eliminate inconsistency in proposal output across all HMS sales staff
- Reduce proposal creation time by 60–80% through AI-assisted content pre-filling and smart defaults
- Provide a centralized, searchable archive of all proposals
- Enable real-time collaboration between team members on shared proposals
- Implement role-based access control with section-level locking
- Support an approval workflow so managers can review proposals before client delivery
- Build a white-labelable architecture so the platform can be sold to other commercial contractors

---

## 2. Product Overview

### 2.1 What It Is

A hosted web application where HMS staff log in, create proposals using structured forms and content libraries, collaborate with teammates, and export polished, branded PDF documents for client delivery.

### 2.2 What It Is Not

- Not a PDF reformatter or document converter (the previous tool's approach)
- Not a project management tool or CRM
- Not a Gantt chart editor — schedules are created externally in Microsoft Project and uploaded as files

### 2.3 Core Capabilities

**Proposal Authoring:** Form-based data entry with structured fields per section. Rich text editing for narrative content. Drag-and-drop section reordering and toggle on/off. Real-time preview of the final proposal output.

**Content Libraries:** Every section type has an associated library of reusable content. Libraries store structured data with metadata for intelligent filtering and AI-powered suggestions. Content can be saved to libraries, selected from libraries, or uploaded from external files. An admin-designated default auto-populates each section for new proposals.

**AI Integration:** RFP document parsing and requirement extraction. Automatic proposal pre-filling based on RFP requirements matched to library content. Gantt chart analysis and Execution Strategy page generation. Smart team and reference suggestions based on project type.

**Collaboration:** Real-time multi-user editing (Google Docs-style). Change tracking with accept/reject workflow. Section-level commenting. Proposal sharing via email invitation.

**Workflow & Approvals:** Configurable per-user approval requirements. Manager review and approval routing based on organizational hierarchy. Status tracking: Draft → Submitted for Review → Approved / Returned with Feedback → Final.

**Admin & CMS Backend:** Three-tier access control (Super Admin, HMS Admin, Proposal User). Library management, default content configuration, and section locking. Personnel roster, past project database, and reference contact management. Audit logging with role-appropriate visibility.

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

**Super Admin (Platform Owner — Maltby Ventures):**
Full control over the entire system. Manages user accounts, system configuration, branding, and all libraries. Can override any lock set by HMS Admins. Activity is completely invisible to all other users — does not appear in audit logs visible to HMS staff. This is the only role that can modify the underlying platform configuration, theme settings, and section templates.

**HMS Admin (Sales Manager / Operations Lead):**
Manages content libraries, sets default content, and controls section locking for their organizational branch. Can configure approval requirements per user (toggle whether a user's proposals require manager review before export). Views audit logs for all users within their branch of the org hierarchy. Cannot see Super Admin activity. Cannot override Super Admin locks.

**Proposal User (Salesperson / Estimator):**
Creates and edits proposals within the guardrails set by admins. Selects content from libraries (where unlocked), edits sections inline (where unlocked), uploads files, and generates PDF output. No access to admin tools, audit logs, or library management. When encountering a locked field, sees the message: "This content is locked. Contact your administrator to request changes."

### 3.2 Organizational Hierarchy

The permission system supports a multi-level, multi-branch organizational tree — not flat roles. HMS may have a President at the top, regional managers underneath, each with their own teams of salespeople. Key behaviors:

- A manager can see and manage proposals, users, and audit logs only within their branch of the tree
- Approval routing follows the tree — a proposal requiring approval goes to the user's direct manager
- Multiple branches operate independently — Manager A cannot see Manager B's team unless they share a common parent
- The Super Admin operates above the entire tree and is invisible within it

### 3.3 Section-Level Locking

Any section, field, or content element within a proposal can be locked at two levels:

**Super Admin Lock:** Only the Super Admin can unlock. HMS Admins and Proposal Users see the locked indicator with no ability to change.

**HMS Admin Lock:** The HMS Admin can lock content so Proposal Users cannot edit it. Useful for enforcing a specific introduction, safety language, or QA/QC content across all proposals. The HMS Admin (or Super Admin) can unlock.

When a section is locked, the UI clearly indicates the locked state and displays: "This content is locked. Contact your administrator to request changes." The lock applies to text editing, library swapping, image replacement, and file uploads for that section.

---

## 4. Proposal Creation Flow

Users have two entry points for creating a new proposal. Both are always available from the main dashboard.

### 4.1 Path A: RFP Upload (AI-Guided)

This is the primary path for responding to formal bid requests.

**Step 1 — Upload RFP:** User uploads the client's RFP document (PDF, Word, or scanned image). The system sends it to the Claude Vision API for parsing.

**Step 2 — AI Extraction:** The AI reads the RFP and extracts: client name and address, project name and description, required proposal sections, specific content requirements (e.g., "provide 3 healthcare references"), submission deadline, team composition requirements, and any formatting or content specifications.

**Step 3 — Requirement Checklist:** The system generates a checklist of everything the RFP asks for. Each item is mapped to a section in the proposal builder. Items that can be auto-filled from libraries are pre-populated (e.g., the AI selects the 3 most relevant healthcare projects from the Firm Background library). Items requiring manual input are flagged.

**Step 4 — Guided Completion:** The user works through the checklist, confirming auto-filled content, making selections where needed, uploading files (Gantt charts, photos), and filling in unique content (pricing, project-specific narrative).

**Step 5 — Validation Review:** Before generating the final output, the system compares the completed proposal against the original RFP requirements. Any unaddressed items are surfaced as suggestions (not blockers): "The RFP requests a commissioning plan. You have not included Section V (QA/QC/Commissioning). Would you like to add it?" The user can add the section or explicitly dismiss the suggestion.

**Step 6 — Deadline Tracking:** If the AI extracted a submission deadline from the RFP, it is saved to the proposal and used for reminder notifications (7 days, 3 days, 1 day before deadline).

### 4.2 Path B: Manual Creation

For proposals without a formal RFP, or when the user prefers to start from scratch:

**Step 1 — New Proposal:** User clicks "New Proposal" from the dashboard. Enters client name, client address, and project name. Optionally selects a proposal template or starts with the default section configuration.

**Step 2 — Section Configuration:** All default sections appear in the sidebar with toggle switches and drag handles. The user reorders sections, toggles sections on/off, and begins filling in content. Each section auto-populates with its designated default content from the library.

**Step 3 — Content Entry:** The user works through each section, editing default text, swapping library items, uploading files, and entering unique content. The real-time preview panel shows the current state of the proposal output.

### 4.3 Editing Interface

The proposal editing interface is desktop-optimized with the following layout:

**Left Sidebar:** Section list with drag-and-drop reordering handles (six-line grip icon) and toggle switches for each section. Clicking a section scrolls the main editor to that section. Active section is highlighted. Section names update automatically based on content.

**Main Editor Area:** Scrollable content editor showing all active sections. Each section has its header, content fields, library selector, upload button, and lock indicator. Rich text editing for narrative fields. Inline change tracking indicators when collaborating.

**Right Panel (toggleable):** Live preview of the final PDF output. Updates in real-time as content changes. Zoom and page navigation controls.

**Top Bar:** Proposal title and client name. Save indicator (auto-save with manual save button). Share button, Preview button, and Generate/Export button. Proposal status badge (Draft, In Review, Approved, etc.).

---

## 5. Section Architecture

A proposal is composed of ordered sections. The current default section list (based on existing HMS proposals) is:

| # | Section | Content Model |
|---|---------|--------------|
| 1 | Cover Page | Per-proposal (client name, address, optional photo) |
| 2 | Introduction | Library with default; boilerplate with edits |
| 3 | Table of Contents | Auto-generated; no user input |
| 4 | Firm Background & Experience | Library (narrative) + Library (case studies) |
| 5 | Key Personnel & Org Chart | Personnel roster selection → auto-generated chart + table |
| 6 | Project Schedule | Gantt upload → AI Execution Strategy + optional raw Gantt embed |
| 7 | Site Logistics & Safety | Library with default; includes EMR table (global admin setting) |
| 8 | QA/QC/Commissioning | Library with default; boilerplate with edits |
| 9 | Closeout | Library with default; boilerplate with edits |
| 10 | Reference Check | Reference database selection by category |
| 11 | Interview Panel | Auto-generated from team selection (same as Section 5) |
| 12 | Project Cost | Dynamic line-item table with auto-calculation |

This section list is not fixed. The admin CMS allows the Super Admin to add, remove, rename, and reconfigure section types. New section types follow the universal section pattern described in Section 6.

### 5.1 Section Ordering & Toggling

Every section in the sidebar has a drag handle (six-line grip icon) and a toggle switch. Users can reorder sections by dragging and toggle sections on/off. The Table of Contents auto-generates based on the active sections in their current order, with correct page numbering calculated from the final PDF layout. Disabled sections are excluded from the output entirely.

---

## 6. Universal Section Pattern

Every section in the proposal builder (except Table of Contents, which is fully automatic) follows the same three-input interaction model:

### 6.1 Default / Library

Each section has a library of saved content items. One item is designated as the "default" and auto-populates when a new proposal is created. Users can browse the library and swap in a different item. The HMS Admin controls which item is the default. Library items are stored with structured metadata for filtering and AI-powered suggestions.

### 6.2 Upload

Users can upload an external file (Word, PDF, image, etc.) to populate a section. The system extracts content from the uploaded file using AI (Claude Vision for PDFs/images, text extraction for Word docs) and populates the section fields. Uploaded content can optionally be saved back to the library for future reuse.

### 6.3 Manual Edit

Regardless of how content arrived in a section (default, library selection, or upload), the user can always edit it inline for that specific proposal. Edits are proposal-specific and do not affect the library version unless the user explicitly saves back to the library. When the user starts the next proposal, the section resets to the current default.

### 6.4 Lock Override

Any of the three input modes can be locked by an admin. A locked section shows its content but disables editing, library swapping, and file uploads. The lock indicator and message ("This content is locked. Contact your administrator to request changes.") is displayed. Lock hierarchy: Super Admin locks override HMS Admin locks. HMS Admin locks apply to Proposal Users only.

---

## 7. Section Specifications

### 7.1 Cover Page

Two templates available, selectable per proposal:

**Template A — With Photo:** Full-bleed or contained project photo with client name, client address, HMS company info, and HMS logo overlay. The photo is uploaded per proposal or selected from a photo library.

**Template B — Without Photo:** Clean typographic cover with client name, project label (e.g., "RESPONSE TO RFP"), client address, and HMS company info. Matches the design of the reformatted Columbia Memorial PDF.

**Editable Fields:**
- Client name (text input)
- Client address (text input)
- Project label / document type (text input, default: "RESPONSE TO RFP")
- Cover photo (file upload, optional, Template A only)
- HMS company info is static (pulled from global settings), editable by Super Admin only

### 7.2 Introduction

A rich-text narrative section following the universal pattern. The default introduction is the standard HMS boilerplate. HMS Admin can lock this section to enforce a specific introduction across all salespeople. The library stores alternate introductions for different contexts (healthcare-specific, industrial, retrofit, etc.). AI can suggest the most relevant introduction based on RFP project type.

### 7.3 Table of Contents

Fully auto-generated. No user input. Reflects the active sections in their current order with correct page numbers. Updates dynamically as sections are added, removed, or reordered. Styled consistently with the HMS branded template.

### 7.4 Firm Background & Experience

This section has two distinct components:

#### 7.4a General Narrative

A rich-text narrative about HMS's qualifications, following the universal section pattern with library and default. Can be tailored per proposal or per industry vertical.

#### 7.4b Case Studies

Users select 1–5 past projects from the Past Projects Library. Each project in the library is a structured record:

- Project name
- Project type (new construction, retrofit, DDC upgrade, service contract, etc.)
- Building type (hospital, lab, office, school, industrial, etc.)
- Client name
- Square footage
- Completion date
- Narrative description (rich text)
- Project photo(s) (1–3 images)

The selected case studies render in a fixed, consistent layout on the page. The system auto-adjusts spacing based on the number of studies selected (1–5) to fill the page cleanly. Photos are pre-populated from the library record but can be swapped per proposal. When the RFP specifies requirements (e.g., "3 healthcare references"), the AI auto-suggests matching projects from the library, filtered by building type.

### 7.5 Key Personnel & Organizational Chart

This section is powered by the Personnel Roster — a master database of all HMS employees maintained in the admin CMS. Each person in the roster has:

- Full name
- Title / role
- Role type tag (Executive, Project Manager, Superintendent, Engineer, Programmer, etc.)
- Years in industry, years at HMS, years with Distech
- Task description / responsibilities (rich text)
- Specialties (healthcare, labs, industrial, etc.)
- Certifications
- Photo (optional)

**Proposal Workflow:**

**Step 1 — Team Selection:** User selects team members for this proposal from the roster. Can search/filter by role type, specialty, or name.

**Step 2 — Auto-Generated Org Chart:** Based on the selected team members' role types, the system auto-generates a hierarchical org chart. The hierarchy follows a standard pattern: Executive/President at top, Managers and Superintendents below, Engineers and Programmers below that. The client's name ("HMS Client") appears at the top of the chart as the root node.

**Step 3 — Manual Adjustment:** The user can drag team members to reposition them in the hierarchy if the auto-generated structure doesn't match the project's needs.

**Step 4 — Personnel Table:** Auto-generated from the same team selection. Displays name, role, years of experience, and task descriptions in a formatted table.

This same team selection also feeds Section 11 (Interview Panel) automatically — one selection, three outputs.

### 7.6 Project Schedule

This section has a unique workflow. The input is always an uploaded file (Gantt chart exported from Microsoft Project, typically PDF or image format). The user selects one of three output modes:

**Output Mode 1: AI Execution Strategy Only**

The system sends the uploaded Gantt chart(s) to the Claude Vision API. The AI analyzes the schedule data and generates a structured Execution Strategy page with the following editable fields:

- Total project duration (e.g., "20 months")
- Number of major phases (e.g., "4")
- Project start date
- Target completion date
- Milestone timeline (array of date + label pairs)
- Phase cards (array of: phase name, duration, completion date, description paragraph)
- Approach section (array of: approach title + description, e.g., "Off-Hours Work")
- Commitment statement (narrative paragraph)

All fields are individually editable after AI generation. If the Gantt is re-uploaded, the user is prompted: "The schedule has been updated. Do you want to regenerate the Execution Strategy? This will overwrite your current edits."

**Output Mode 2: Raw Gantt Charts Only**

The uploaded Gantt chart files are embedded directly into the proposal as images/pages. No AI processing.

**Output Mode 3: Both**

The AI-generated Execution Strategy pages appear first, followed by the raw Gantt chart pages.

### 7.7 Site Logistics & Safety

A rich-text narrative section following the universal pattern. Includes the Experience Modification Rating (EMR) table as a sub-component.

**EMR Table:** The EMR table is a global admin setting — maintained once by the HMS Admin and auto-populated into every proposal. It contains year/rating pairs (e.g., 2021: 0.75, 2022: 0.73, etc.). The HMS Admin adds a new row each year when the updated rating is available. The table is editable per proposal (rare) but resets to the global version for new proposals.

### 7.8 QA/QC/Commissioning

A rich-text narrative section following the universal pattern. Typically boilerplate content that is locked by the HMS Admin to ensure consistency. Divided into three sub-sections: Quality Assurance, Quality Control, and Commissioning. Each sub-section follows its own library/default/edit pattern, allowing different combinations to be assembled per proposal.

### 7.9 Closeout

A rich-text narrative section following the universal pattern. Covers training plans, final handover procedures, punch list completion, owner acceptance, and warranty support. Typically boilerplate with minor per-project edits.

### 7.10 Reference Check

Powered by a master Reference Database maintained in the admin CMS. Each reference record contains:

- Contact name
- Title
- Company / organization
- Phone number
- Email (optional)
- Category tag: Owner, General Contractor, Mechanical Contractor, etc.
- Associated projects (linked to Past Projects Library)

Per proposal, the user selects references from the database, filtered by category. The AI can auto-suggest references relevant to the project type. The output renders as a formatted two-column layout (Owners on the left, Generals on the right) matching the existing HMS proposal format.

### 7.11 Interview Panel

Auto-generated from the same team selection used in Section 5 (Key Personnel & Org Chart). No duplicate data entry. Displays each team member's name, role, years of experience, and a summary of their qualifications. The layout is consistent and auto-formatted.

### 7.12 Project Cost

A dynamic line-item table with auto-calculation. The user adds rows, and each row has:

- Description (free text)
- Type: Base Cost, Adder, or Deduct
- Amount (dollar value, always entered as positive)

The system handles sign convention automatically (deducts displayed in parentheses as negative values). The bottom of the table shows auto-calculated subtotals: Base Cost total, Adders total, Deducts total, and Net Project Total.

**Cost Library:** Common adders and deducts can be saved to a Cost Library with a default description and optionally a default price. When adding a line item, the user can either type a new description or select from the Cost Library and adjust the amount for this specific project.

---

## 8. AI Features

The platform integrates Claude API (Anthropic) for several AI-powered capabilities. All AI features operate server-side via Next.js API routes.

### 8.1 RFP Parsing & Requirement Extraction

When a user uploads an RFP document, the system sends each page to Claude Vision API for analysis. The AI extracts:

- Client name and contact information
- Project name, type, and description
- Submission deadline
- Required proposal sections and content
- Team composition requirements (e.g., "must include controls engineer with 10+ years healthcare experience")
- Reference requirements (e.g., "3 completed healthcare projects over $1M")
- Formatting or content specifications

The extracted requirements are structured into a JSON schema that maps to the proposal builder's section model, enabling automatic pre-filling and validation.

### 8.2 Smart Library Matching

When RFP requirements are extracted, the AI cross-references them against the structured metadata in all content libraries:

- Past Projects Library → suggests case studies matching the required project type, building type, and size
- Personnel Roster → suggests team members meeting experience and specialty requirements
- Reference Database → suggests references matching the required categories and project types
- Introduction Library → suggests the most contextually relevant introduction

Suggestions are presented as pre-selections that the user confirms or swaps. The AI provides a brief rationale for each suggestion (e.g., "Selected because: healthcare project, 31,375sf, hospital setting").

### 8.3 Gantt Chart → Execution Strategy

When Gantt chart files are uploaded, the AI analyzes the schedule data using Claude Vision and generates a structured Execution Strategy. The AI identifies major phases, key milestones, critical path items, and project duration. It then produces a clean, client-friendly summary with timeline graphics, phase breakdowns, and approach narrative.

### 8.4 Content Upload Extraction

When users upload external files to populate a section (e.g., a Word doc containing a custom introduction), the AI extracts the text content and formats it for the section's fields. For PDFs and images, Claude Vision handles extraction. For Word documents, text is extracted directly. The user reviews the extracted content before it's applied to the section.

### 8.5 Intelligent Assist Features

The following AI features run silently on the backend. Users experience them as built-in platform intelligence — they never see "AI" labeling, loading spinners for model calls, or any indication that a language model is involved. The features feel native to the tool.

#### 8.5a Pre-Export Quality Check

When the user clicks "Generate PDF," the system sends the full proposal (as structured JSON) to Claude before rendering. The AI scans for:

- Inconsistent client name spelling across sections
- Stale references to a different client (from duplicated proposals)
- Team members in the org chart but missing from the interview panel (or vice versa)
- Missing phone numbers or contact info in references
- Pricing math discrepancies (adders/deducts that don't match the displayed total)
- Empty or placeholder content in active sections
- Boilerplate text that still contains a previous client's name, address, or project details

Results are presented as a simple pre-export checklist: "We found 3 items to review before exporting." Each item links directly to the section/field that needs attention. The user can fix issues or dismiss them. No mention of AI — it reads like built-in validation.

#### 8.5b Narrative Polishing

After a user saves edits to any narrative section, the system asynchronously sends the text to Claude with instructions to clean up grammar, fix tense inconsistency, improve professional tone, and tighten phrasing — without changing meaning or voice. The polished version is presented as a subtle "Suggested refinement" that the user accepts with one click or ignores. The original text is preserved until they accept. This runs in the background and does not block the save action.

#### 8.5c Smart Cover Photo Suggestion

When the user is selecting a cover photo, the system filters the photo library by matching the proposal's project type and building type metadata. If photos in the library have been tagged (either manually by an admin or auto-tagged via Claude Vision during upload), the top 3 most relevant photos are surfaced as "Suggested" at the top of the picker. Feels like smart filtering, not AI.

#### 8.5d Competitive Language Optimization

Before export (or on-demand via a "Strengthen" button), the AI scans all narrative sections and flags weak or passive language. Examples: "we think we can deliver" → "HMS commits to delivering"; "we hope to minimize disruption" → "our phased approach minimizes disruption." Suggestions are shown inline as subtle highlights the user can accept or dismiss individually. Framed as "writing suggestions" — no AI branding.

#### 8.5e Executive Summary Auto-Generation

If the Executive Summary section is enabled, the AI reads all other completed sections and generates a tight 2-paragraph summary of the entire proposal — covering the project scope, HMS's qualifications, team composition, approach, and pricing. One click to generate, fully editable afterward. This saves the user from having to write a summary that synthesizes information they've already entered elsewhere.

#### 8.5f Duplicate Proposal Intelligence

When a user duplicates an existing proposal to use as a starting point for a new client, the AI scans the entire duplicated proposal and identifies every instance of the previous client's name, address, project name, dates, and any other client-specific details. These are presented as a checklist: "12 items need updating for your new client." Each item shows the old value, the field location, and an input for the new value. The user fills in the new client details once, clicks "Apply All," and every instance is updated. This prevents the catastrophic mistake of sending a $30M proposal with another client's name on it.

---

## 9. Collaboration & Workflow

### 9.1 Real-Time Co-Editing

Powered by Liveblocks. Multiple users can edit the same proposal simultaneously with:
- Live presence indicators (see who else is viewing/editing)
- Real-time content synchronization across all connected clients
- Cursor and selection awareness
- Automatic conflict resolution

### 9.2 Sharing

A proposal owner can share their proposal with other HMS users. Sharing sends an email notification with a direct link to the proposal. Shared users can edit within whatever permissions their role allows. Section locks still apply regardless of sharing.

### 9.3 Change Tracking

When multiple people collaborate on a proposal, all changes are tracked with the editor's name and timestamp. Changes are highlighted inline (similar to Track Changes in Microsoft Word). Collaborators can accept or reject individual changes, or accept/reject all. The proposal owner and HMS Admin can view the full change history.

### 9.4 Commenting

Users can leave comments on specific sections of a proposal. Comments include the author's name and timestamp. Other collaborators can reply to comments, creating threaded discussions. Comments can be resolved (hidden) when addressed.

### 9.5 Approval Workflow

The HMS Admin can configure, per user, whether their proposals require manager approval before export. When approval is required:

- **Draft:** The user is building the proposal. They can edit, collaborate, and preview freely.
- **Submitted for Review:** The user submits the proposal for approval. It routes to their direct manager in the org hierarchy.
- **In Review:** The manager reviews the proposal. They can view all content, see change tracking history, and leave section-level comments.
- **Approved:** The manager approves the proposal. The user can now export/generate the final PDF.
- **Returned with Feedback:** The manager sends the proposal back with comments. The user addresses the feedback and resubmits.

Users whose proposals do not require approval can export directly from Draft status.

---

## 10. Admin & CMS Backend

The admin panel is a separate interface within the application, accessible only to HMS Admin and Super Admin roles.

### 10.1 Super Admin Panel

- User management: create, edit, deactivate users; assign roles; configure org hierarchy
- System configuration: section templates, field definitions, default section order
- Branding & theming: logo, colors, fonts, company info (for white-label support)
- All library management capabilities (same as HMS Admin, plus override authority)
- Global lock management: can lock/unlock any content at any level
- System audit log: complete activity log across all users (invisible to HMS users)
- Proposal access: can view any proposal in the system

### 10.2 HMS Admin Panel

**Library Management:**
- Introduction Library: add, edit, delete, set default introduction
- Past Projects Library: manage project records with full metadata
- Personnel Roster: manage employee records, role types, specialties
- Reference Database: manage reference contacts by category
- Cost Library: manage common adder/deduct line items
- Cover Photo Library: manage project and building photos
- Section content libraries: for every boilerplate section (Safety, QA/QC, Closeout, etc.)

**Content Control:**
- Set default content for each section (what auto-populates on new proposals)
- Lock/unlock sections and fields for Proposal Users
- Configure which library items are available to Proposal Users

**User Management (within their branch):**
- View and manage users in their org branch
- Configure approval requirements per user
- Set user permissions within their branch

**Global Settings:**
- EMR table (Experience Modification Rating): add/edit year-rating pairs
- Company information: address, phone, website
- Default proposal template configuration

**Audit Log:**
View all user activity within their org branch: who edited which proposal, when, and what changed. Filterable by user, date range, and proposal. Super Admin activity is not visible in this log.

---

## 11. Proposal Output & Export

### 11.1 PDF Output (Primary)

The primary deliverable is a professionally branded PDF document generated server-side using React-PDF (@react-pdf/renderer). The output matches the clean, modern aesthetic of the reformatted Columbia Memorial proposal: navy/white color scheme with gold accents, HMS eagle logo in the header, clean typography with generous whitespace, consistent page numbering and section headers, and auto-generated Table of Contents with correct page references.

### 11.2 Word Document Output (Secondary)

Users can optionally export as a Word document (.docx) using docx.js. The Word output maintains the same content and structure as the PDF but may have minor formatting differences. This option exists for cases where clients request editable documents.

### 11.3 Output Design Specifications

Based on the reformatted Columbia Memorial Hospital proposal:

- Header: HMS eagle logo (not text-only logo) + "HMS Proposal" + client/project name
- Section headers: navy background bar with white section label text
- Body text: clean sans-serif font, professional spacing
- Tables: alternating row shading, navy header row with white text
- Case studies: consistent card layout with project photo, name, and description
- Org chart: clean box-and-line hierarchy diagram
- Project cost: formatted table with proper currency formatting and auto-calculated totals
- Footer: "HMS Commercial Service, Inc." + page number

---

## 12. Proposal Archive & Dashboard

### 12.1 Dashboard

The main landing page after login. Displays all proposals the user has access to (their own + shared):

- Search by client name, project name, or content keywords
- Filter by status (Draft, In Review, Approved, Exported), date range, creator
- Sort by last modified, creation date, client name, or deadline
- Quick actions: open, duplicate, share, export, archive
- Status badges showing proposal state at a glance
- Deadline indicators for proposals with RFP-extracted due dates

### 12.2 Proposal Archive

All proposals are stored indefinitely. Users can archive completed proposals to declutter the dashboard. Archived proposals can be searched, viewed, and duplicated. Duplication creates a new proposal pre-filled with all content from the source.

### 12.3 Export & Download

Users can download the final PDF or Word document at any time. Exported files are stored in the system as a record. The system maintains a version history — if a proposal is regenerated after edits, previous exports are preserved.

---

## 13. Notifications

The notification system is intentionally lean. Delivered via email and in-app indicators.

**Collaboration:** When someone edits a shared proposal, the owner is notified. When a proposal is shared, the recipient gets an email with a direct link.

**Approval:** When submitted for review, the manager is notified. When approved or returned, the submitter is notified.

**Deadline Reminders:** If an RFP deadline was extracted, reminders are sent at 7, 3, and 1 day before. Overdue proposals are flagged on the dashboard.

**Admin Changes:** Silent. No notifications for library updates, section locks, or configuration changes.

---

## 14. Technical Architecture

### 14.1 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend Framework | Next.js 15 (App Router) |
| UI Library | Tailwind CSS + shadcn/ui |
| Real-Time Collaboration | Liveblocks |
| Backend / Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI Integration | Anthropic Claude API (Sonnet, Vision-capable) |
| PDF Generation | React-PDF (@react-pdf/renderer) |
| Word Doc Generation | docx.js |
| Hosting | Vercel |
| File Storage | Supabase Storage |
| Email Notifications | Resend or Supabase Edge Functions + SMTP |

### 14.2 Architecture Overview

**Client Layer:** React components via Next.js App Router. Liveblocks for real-time state sync. Tailwind + shadcn/ui for components and styling.

**API Layer:** Next.js API routes for server-side operations (AI calls, PDF generation, file processing, business logic). Supabase client with Row Level Security (RLS) enforcing permission boundaries.

**Data Layer:** Supabase PostgreSQL for structured data. Supabase Storage for files. Supabase Auth for authentication and sessions.

**AI Layer:** Claude API called server-side. Vision API for document analysis. Text API for content generation.

### 14.3 Security & Access Control

Supabase RLS policies enforce the three-tier permission model at the database level. Every query is filtered by the authenticated user's role and org hierarchy position. File access controlled via signed URLs. All AI API calls are server-side only.

### 14.4 White-Label Architecture

Branding is driven by a theme configuration in the database. The Super Admin modifies the theme per deployment. Same codebase serves different orgs with different visuals. Supports multi-tenant or single-tenant deployment models.

---

## 15. Data Model Overview

Core database entities:

| Entity | Description |
|--------|------------|
| `organizations` | Multi-tenant org record. Stores branding/theme config. |
| `users` | Authenticated users. Linked to org. Has role and manager_id for hierarchy. |
| `proposals` | Core entity. Belongs to user and org. Stores status, client info, section order, deadline, metadata. |
| `proposal_sections` | Links proposal to active sections. Stores order, toggle state, section-specific content as JSONB. |
| `section_types` | Available section types (Cover, Intro, TOC, etc.). Configurable per org. |
| `library_items` | Reusable content for any section type. Content as JSONB, metadata for filtering, is_default flag. |
| `past_projects` | Structured case study records. Metadata: name, type, building_type, client, sqft, date, narrative, photos. |
| `personnel` | Employee roster. Name, title, role_type, years, specialties, certifications, tasks, photo. |
| `references` | Reference contacts. Name, title, company, phone, email, category tag, linked project IDs. |
| `cost_library_items` | Common adder/deduct line items with default description and optional default amount. |
| `proposal_cost_items` | Per-proposal cost line items. Description, type, amount. Linked to proposal. |
| `proposal_comments` | Section-level comments. Author, timestamp, content, parent_id for threading. |
| `proposal_changes` | Change tracking. Author, timestamp, section, field, old_value, new_value. |
| `audit_log` | System-wide activity log. User, action, entity_type, entity_id, timestamp, metadata. |
| `emr_ratings` | Global EMR table. Year and rating pairs. One set per org. |
| `notifications` | Notification records. User, type, proposal_id, message, read status, timestamp. |

All content-heavy fields use JSONB columns for flexibility.

---

## 16. Branding & Theming

### 16.1 HMS Brand Specifications

| Element | Value |
|---------|-------|
| Primary Logo | HMS eagle logo (with American flag, eagle, and "HMS Commercial Service, Inc." text) |
| Primary Color (Navy) | #1B365D |
| Secondary Color (Blue) | #2B5797 |
| Accent Color (Gold) | #C9A227 |
| Background | #FFFFFF (white) |
| Body Text | #333333 (dark gray) |
| Typography | Clean sans-serif (Arial or system equivalent) |
| Design Tone | Professional, clean, modern, sophisticated. No emojis. No playful elements. |

### 16.2 Theme Configuration

All branding elements are stored in the `organizations` table and applied dynamically. The theme includes: logo file, primary/secondary/accent colors, font family, company name/contact info, and footer text. Both the application UI and PDF output pull from the same theme configuration.

### 16.3 White-Label Considerations

When deploying for a new client, the Super Admin creates a new organization record with that client's branding. The domain (e.g., proposals.clientname.com) points to the same Vercel deployment, with the org identified by domain.

---

## 17. Design Principles

The HMS team is not highly tech-savvy. The application must be powerful under the hood but dead simple on the surface. The interface must feel like a premium product — the kind of tool that makes the user feel like their company is operating at a higher level.

**1. Minimize Typing, Maximize Selecting:** Smart defaults and library selections handle 80–90% of content. The user reviews and confirms, not writes from scratch.

**2. AI Does the Heavy Lifting:** RFP parsing pre-fills the proposal. Gantt analysis generates the Execution Strategy. Smart matching suggests the right team, references, and case studies. Intelligent assist features run silently in the background. The user never sees "AI" — they just experience a tool that seems to know what they need.

**3. Visually Clean, Not Visually Complex:** Premium, professional UI. Progressive disclosure — essentials first, details on demand. No cluttered screens, no dense forms with 20 fields visible at once. Generous whitespace. Smooth transitions and micro-animations where appropriate (page transitions, sidebar expand/collapse, toast notifications). The aesthetic should feel closer to Linear, Notion, or Stripe Dashboard than to a traditional enterprise form builder.

**4. Consistent Patterns:** Every section works the same way (universal section pattern). Learn once, apply everywhere.

**5. Guardrails Without Friction:** Locking, approvals, and validation protect quality without slowing down experienced users.

**6. Desktop-First, Mobile-Friendly:** Full editing on desktop (1280px+). Mobile/tablet supports reviewing, approving, and dashboard access.

### 17.1 UI Design Direction

The application interface should communicate sophistication and professionalism. Specific direction:

**Color Palette:** The app UI uses a neutral, modern palette — soft grays, white backgrounds, with the HMS navy and gold as accent colors for interactive elements, active states, and branding touches. Avoid heavy use of bright colors. The overall feel should be calm and premium.

**Typography:** Clean sans-serif throughout (Inter or similar). Clear hierarchy between headings, labels, body text, and metadata. Generous line height for readability.

**Layout:** Lots of breathing room. Cards and containers with subtle borders or shadows — never harsh outlines. Sidebar navigation is clean and minimal. The main content area never feels cramped.

**Interactions:** Smooth hover states, subtle transitions on panel open/close, toast notifications that slide in and auto-dismiss. Drag-and-drop should feel fluid (not janky). Loading states use skeleton screens, not spinners. Auto-save with a subtle "Saved" indicator that fades in/out.

**Empty States:** When a library has no items, or a section has no content, the empty state should be helpful and inviting — not a blank white box. Clear call-to-action: "Add your first past project" with a clean illustration or icon.

**Reference Apps for Design Tone:** Linear (task management), Notion (workspace), Stripe Dashboard (data presentation), Vercel Dashboard (deployment management). These apps share a common DNA: clean, fast, professional, with attention to detail in spacing, typography, and micro-interactions. The HMS Proposal Builder should feel like it belongs in this category.

---

## 18. MVP Scope & Phasing

### 18.1 Phase 1 — MVP (Demo-Ready)

Target: Functional prototype for client presentation and initial testing.

**Included:**
- User authentication (Supabase Auth)
- Proposal creation (manual path) with all 12 section types
- Section ordering (drag-and-drop) and toggling (on/off)
- Universal section pattern: library selection, manual editing, default content
- Content libraries for all section types with admin management
- Personnel roster with auto-generated org chart and personnel table
- Past projects library with case study selection (1–5)
- Reference database with category filtering
- Project cost dynamic line-item table with auto-calculation
- Cover page with both templates (photo / no photo)
- Auto-generated Table of Contents
- EMR table as global setting
- PDF export with HMS branding
- Basic role-based access (Super Admin, HMS Admin, Proposal User)
- Proposal dashboard with search and filter
- Admin panel for library management and user management

**Deferred to Phase 2:**
- RFP upload and AI parsing
- Gantt chart AI Execution Strategy generation
- Real-time collaboration (Liveblocks)
- Change tracking
- Approval workflow
- Section-level commenting
- Deadline reminders
- Word document export

### 18.2 Phase 2 — AI & Collaboration

- RFP upload path with AI parsing and requirement extraction
- Smart library matching (AI-powered suggestions)
- Gantt chart upload with AI Execution Strategy generation
- Real-time co-editing via Liveblocks
- Change tracking (Track Changes style)
- Section-level commenting
- Approval workflow with manager routing
- Deadline extraction and reminder notifications
- Word document export
- Intelligent Assist: Pre-export quality check
- Intelligent Assist: Duplicate proposal intelligence
- Intelligent Assist: Executive summary auto-generation
- Intelligent Assist: Narrative polishing
- Intelligent Assist: Competitive language optimization
- Intelligent Assist: Smart cover photo suggestion

### 18.3 Phase 3 — Scale & Polish

- White-label theme system with multi-tenant support
- Multi-branch org hierarchy with scoped admin views
- Advanced audit logging with export
- Proposal version history and export archive
- File upload content extraction (Word/PDF → section content)
- Cost library with default pricing
- Email delivery of proposals directly from the app
- Performance optimization and caching
- Onboarding flow for new users

---

## 19. Open Questions & Future Features

### 19.1 Open Questions

- Hosting domain: subdomain of HMS or standalone domain?
- HMS logo file: need high-resolution PNG/SVG of the eagle logo
- Existing content: does HMS have intro text, safety language, QA/QC, closeout text in digital format for import?
- Personnel data: existing employee roster/directory for import?
- Past project data: how many projects to load? Are descriptions and photos available?
- Reference contacts: existing list for import?
- Microsoft Project exports: what file format(s)? (PDF, image, .mpp, .xlsx?)
- Approval workflow: cases where multiple approvals are needed?
- Billing model: monthly SaaS, per-proposal, or annual license?

### 19.2 Future Feature Considerations

- AI-powered proposal scoring (completeness and quality rating)
- Template marketplace for different project types
- Client portal for online proposal viewing
- Analytics dashboard (win rates, volume, team productivity)
- CRM integration (HubSpot, Salesforce)
- Automated follow-up emails with tracking
- Mobile app for review and approval
