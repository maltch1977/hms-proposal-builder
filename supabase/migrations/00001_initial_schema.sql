-- HMS Proposal Builder - Initial Schema
-- Phase 1 MVP with Phase 2/3 ready tables

-- ============================================
-- EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- ORGANIZATIONS
-- ============================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text default '#1B365D',
  secondary_color text default '#2B5797',
  accent_color text default '#C9A227',
  body_text_color text default '#333333',
  company_name text,
  company_address text,
  company_phone text,
  company_website text,
  company_email text,
  footer_text text,
  theme_config jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  full_name text not null,
  email text not null,
  role text not null check (role in ('super_admin', 'hms_admin', 'proposal_user')),
  manager_id uuid references public.profiles(id),
  avatar_url text,
  is_active boolean default true,
  requires_approval boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_organization on public.profiles(organization_id);
create index idx_profiles_manager on public.profiles(manager_id);
create index idx_profiles_role on public.profiles(role);

-- ============================================
-- SECTION TYPES
-- ============================================
create table public.section_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  slug text not null,
  display_name text not null,
  description text,
  default_order integer not null,
  content_schema jsonb,
  is_system boolean default true,
  is_auto_generated boolean default false,
  created_at timestamptz default now(),
  unique (organization_id, slug)
);

create index idx_section_types_org on public.section_types(organization_id);

-- ============================================
-- PROPOSALS
-- ============================================
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  created_by uuid not null references public.profiles(id),
  title text not null,
  client_name text not null,
  client_address text default '',
  project_label text default 'RESPONSE TO RFP',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'in_review', 'approved', 'returned', 'exported', 'archived')),
  cover_template text default 'no_photo' check (cover_template in ('photo', 'no_photo')),
  cover_photo_url text,
  deadline timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_proposals_org on public.proposals(organization_id);
create index idx_proposals_creator on public.proposals(created_by);
create index idx_proposals_status on public.proposals(status);
create index idx_proposals_created on public.proposals(created_at desc);

-- ============================================
-- LIBRARY ITEMS
-- ============================================
create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  section_type_id uuid not null references public.section_types(id),
  name text not null,
  description text,
  content jsonb not null,
  metadata jsonb default '{}',
  is_default boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_library_items_org on public.library_items(organization_id);
create index idx_library_items_section_type on public.library_items(section_type_id);
create index idx_library_items_default on public.library_items(section_type_id, is_default) where is_default = true;

-- ============================================
-- PROPOSAL SECTIONS
-- ============================================
create table public.proposal_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  section_type_id uuid not null references public.section_types(id),
  order_index integer not null,
  is_enabled boolean default true,
  content jsonb default '{}',
  library_item_id uuid references public.library_items(id),
  lock_level text default 'none' check (lock_level in ('none', 'admin', 'super_admin')),
  locked_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (proposal_id, section_type_id)
);

create index idx_proposal_sections_proposal on public.proposal_sections(proposal_id);
create index idx_proposal_sections_order on public.proposal_sections(proposal_id, order_index);

-- ============================================
-- PAST PROJECTS
-- ============================================
create table public.past_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  project_name text not null,
  project_type text not null,
  building_type text not null,
  client_name text not null,
  square_footage integer,
  completion_date date,
  narrative text,
  photos jsonb default '[]',
  metadata jsonb default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_past_projects_org on public.past_projects(organization_id);
create index idx_past_projects_type on public.past_projects(project_type);
create index idx_past_projects_building on public.past_projects(building_type);

-- ============================================
-- PERSONNEL
-- ============================================
create table public.personnel (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  full_name text not null,
  title text not null,
  role_type text not null,
  years_in_industry integer,
  years_at_company integer,
  years_with_distech integer,
  task_description text,
  specialties text[] default '{}',
  certifications text[] default '{}',
  photo_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_personnel_org on public.personnel(organization_id);
create index idx_personnel_role on public.personnel(role_type);
create index idx_personnel_active on public.personnel(organization_id, is_active) where is_active = true;

-- ============================================
-- REFERENCES
-- ============================================
create table public.references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  contact_name text not null,
  title text not null,
  company text not null,
  phone text not null,
  email text,
  category text not null,
  project_ids uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_references_org on public.references(organization_id);
create index idx_references_category on public.references(category);

-- ============================================
-- COST LIBRARY ITEMS
-- ============================================
create table public.cost_library_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  description text not null,
  type text not null check (type in ('base', 'adder', 'deduct')),
  default_amount numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_cost_library_org on public.cost_library_items(organization_id);

-- ============================================
-- PROPOSAL COST ITEMS
-- ============================================
create table public.proposal_cost_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  description text not null,
  type text not null check (type in ('base', 'adder', 'deduct')),
  amount numeric(12,2) not null,
  order_index integer not null,
  cost_library_item_id uuid references public.cost_library_items(id),
  created_at timestamptz default now()
);

create index idx_proposal_cost_items_proposal on public.proposal_cost_items(proposal_id);

-- ============================================
-- PROPOSAL TEAM MEMBERS
-- ============================================
create table public.proposal_team_members (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  personnel_id uuid not null references public.personnel(id),
  order_index integer not null,
  role_override text,
  hierarchy_position jsonb default '{}',
  created_at timestamptz default now(),
  unique (proposal_id, personnel_id)
);

create index idx_proposal_team_proposal on public.proposal_team_members(proposal_id);

-- ============================================
-- PROPOSAL CASE STUDIES
-- ============================================
create table public.proposal_case_studies (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  past_project_id uuid not null references public.past_projects(id),
  order_index integer not null,
  photo_overrides jsonb,
  created_at timestamptz default now(),
  unique (proposal_id, past_project_id)
);

create index idx_proposal_case_studies_proposal on public.proposal_case_studies(proposal_id);

-- ============================================
-- PROPOSAL REFERENCES
-- ============================================
create table public.proposal_references (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  reference_id uuid not null references public.references(id),
  order_index integer not null,
  created_at timestamptz default now(),
  unique (proposal_id, reference_id)
);

create index idx_proposal_references_proposal on public.proposal_references(proposal_id);

-- ============================================
-- EMR RATINGS
-- ============================================
create table public.emr_ratings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  year integer not null,
  rating numeric(4,2) not null,
  created_at timestamptz default now(),
  unique (organization_id, year)
);

-- ============================================
-- COVER PHOTOS
-- ============================================
create table public.cover_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  url text not null,
  filename text not null,
  project_type text,
  building_type text,
  tags text[] default '{}',
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create index idx_cover_photos_org on public.cover_photos(organization_id);

-- ============================================
-- AUDIT LOG
-- ============================================
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_audit_log_org on public.audit_log(organization_id);
create index idx_audit_log_user on public.audit_log(user_id);
create index idx_audit_log_created on public.audit_log(created_at desc);

-- ============================================
-- NOTIFICATIONS (Phase 2 - schema only)
-- ============================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  user_id uuid not null references public.profiles(id),
  type text not null,
  proposal_id uuid references public.proposals(id),
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read);

-- ============================================
-- PROPOSAL COMMENTS (Phase 2 - schema only)
-- ============================================
create table public.proposal_comments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  section_id uuid references public.proposal_sections(id),
  author_id uuid not null references public.profiles(id),
  content text not null,
  parent_id uuid references public.proposal_comments(id),
  is_resolved boolean default false,
  created_at timestamptz default now()
);

create index idx_proposal_comments_proposal on public.proposal_comments(proposal_id);

-- ============================================
-- PROPOSAL CHANGES (Phase 2 - schema only)
-- ============================================
create table public.proposal_changes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  section_id uuid not null references public.proposal_sections(id),
  author_id uuid not null references public.profiles(id),
  field text not null,
  old_value jsonb,
  new_value jsonb,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

create index idx_proposal_changes_proposal on public.proposal_changes(proposal_id);
