-- HMS Proposal Builder - Row Level Security Policies

-- ============================================
-- Enable RLS on all tables
-- ============================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.section_types enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_sections enable row level security;
alter table public.library_items enable row level security;
alter table public.past_projects enable row level security;
alter table public.personnel enable row level security;
alter table public.references enable row level security;
alter table public.cost_library_items enable row level security;
alter table public.proposal_cost_items enable row level security;
alter table public.proposal_team_members enable row level security;
alter table public.proposal_case_studies enable row level security;
alter table public.proposal_references enable row level security;
alter table public.emr_ratings enable row level security;
alter table public.cover_photos enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;
alter table public.proposal_comments enable row level security;
alter table public.proposal_changes enable row level security;

-- ============================================
-- Helper function: get current user's profile
-- ============================================
create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================
-- ORGANIZATIONS
-- ============================================
create policy "Users can view own organization"
  on public.organizations for select
  using (id = public.get_user_org_id());

create policy "Super admins can update organization"
  on public.organizations for update
  using (id = public.get_user_org_id() and public.get_user_role() = 'super_admin');

-- ============================================
-- PROFILES
-- ============================================
create policy "Users can view profiles in own organization"
  on public.profiles for select
  using (organization_id = public.get_user_org_id());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "Admins can update profiles in org"
  on public.profiles for update
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- SECTION TYPES
-- ============================================
create policy "Users can view section types in org"
  on public.section_types for select
  using (organization_id = public.get_user_org_id());

create policy "Super admins can manage section types"
  on public.section_types for all
  using (organization_id = public.get_user_org_id() and public.get_user_role() = 'super_admin');

-- ============================================
-- PROPOSALS
-- ============================================
create policy "Users can view own proposals"
  on public.proposals for select
  using (
    organization_id = public.get_user_org_id()
    and (
      created_by = auth.uid()
      or public.get_user_role() in ('super_admin', 'hms_admin')
    )
  );

create policy "Users can create proposals"
  on public.proposals for insert
  with check (
    organization_id = public.get_user_org_id()
    and created_by = auth.uid()
  );

create policy "Users can update own proposals"
  on public.proposals for update
  using (
    organization_id = public.get_user_org_id()
    and (
      created_by = auth.uid()
      or public.get_user_role() in ('super_admin', 'hms_admin')
    )
  );

create policy "Admins can delete proposals"
  on public.proposals for delete
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- PROPOSAL SECTIONS
-- ============================================
create policy "Users can view proposal sections"
  on public.proposal_sections for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can insert proposal sections"
  on public.proposal_sections for insert
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can update proposal sections"
  on public.proposal_sections for update
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can delete proposal sections"
  on public.proposal_sections for delete
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- LIBRARY ITEMS
-- ============================================
create policy "Users can view library items in org"
  on public.library_items for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage library items"
  on public.library_items for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- PAST PROJECTS
-- ============================================
create policy "Users can view past projects in org"
  on public.past_projects for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage past projects"
  on public.past_projects for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- PERSONNEL
-- ============================================
create policy "Users can view personnel in org"
  on public.personnel for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage personnel"
  on public.personnel for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- REFERENCES
-- ============================================
create policy "Users can view references in org"
  on public.references for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage references"
  on public.references for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- COST LIBRARY ITEMS
-- ============================================
create policy "Users can view cost library in org"
  on public.cost_library_items for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage cost library"
  on public.cost_library_items for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- PROPOSAL COST ITEMS (same access as parent proposal)
-- ============================================
create policy "Users can view proposal cost items"
  on public.proposal_cost_items for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal cost items"
  on public.proposal_cost_items for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- PROPOSAL TEAM MEMBERS
-- ============================================
create policy "Users can view proposal team members"
  on public.proposal_team_members for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal team members"
  on public.proposal_team_members for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- PROPOSAL CASE STUDIES
-- ============================================
create policy "Users can view proposal case studies"
  on public.proposal_case_studies for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal case studies"
  on public.proposal_case_studies for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- PROPOSAL REFERENCES
-- ============================================
create policy "Users can view proposal references"
  on public.proposal_references for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal references"
  on public.proposal_references for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- EMR RATINGS
-- ============================================
create policy "Users can view EMR ratings in org"
  on public.emr_ratings for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage EMR ratings"
  on public.emr_ratings for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- COVER PHOTOS
-- ============================================
create policy "Users can view cover photos in org"
  on public.cover_photos for select
  using (organization_id = public.get_user_org_id());

create policy "Admins can manage cover photos"
  on public.cover_photos for all
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- ============================================
-- AUDIT LOG
-- ============================================
create policy "Admins can view audit log"
  on public.audit_log for select
  using (
    organization_id = public.get_user_org_id()
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "System can insert audit log"
  on public.audit_log for insert
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- NOTIFICATIONS
-- ============================================
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- ============================================
-- PROPOSAL COMMENTS (Phase 2)
-- ============================================
create policy "Users can view proposal comments"
  on public.proposal_comments for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal comments"
  on public.proposal_comments for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

-- ============================================
-- PROPOSAL CHANGES (Phase 2)
-- ============================================
create policy "Users can view proposal changes"
  on public.proposal_changes for select
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );

create policy "Users can manage proposal changes"
  on public.proposal_changes for all
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and p.organization_id = public.get_user_org_id()
      and (p.created_by = auth.uid() or public.get_user_role() in ('super_admin', 'hms_admin'))
    )
  );
