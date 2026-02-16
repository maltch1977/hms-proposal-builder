-- Collaboration & Change Tracking

-- New table: proposal_collaborators
create table public.proposal_collaborators (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  added_by uuid references public.profiles(id),
  color text not null,
  created_at timestamptz default now(),
  unique (proposal_id, profile_id)
);

-- Alter proposal_changes: make author_id nullable (for AI), add change_type and summary
alter table public.proposal_changes alter column author_id drop not null;
alter table public.proposal_changes add column change_type text not null default 'human' check (change_type in ('human', 'ai', 'system'));
alter table public.proposal_changes add column summary text;

-- RLS for proposal_collaborators
alter table public.proposal_collaborators enable row level security;

create policy "Users can view collaborators for proposals in their org"
  on public.proposal_collaborators for select
  using (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_collaborators.proposal_id
        and pr.id = auth.uid()
    )
  );

create policy "Users can insert collaborators for proposals in their org"
  on public.proposal_collaborators for insert
  with check (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_collaborators.proposal_id
        and pr.id = auth.uid()
    )
  );

create policy "Users can delete collaborators for proposals in their org"
  on public.proposal_collaborators for delete
  using (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_collaborators.proposal_id
        and pr.id = auth.uid()
    )
  );

-- Update RLS for proposal_changes to allow nullable author_id (AI changes)
-- Drop existing policies if any and recreate
drop policy if exists "Users can view changes for proposals in their org" on public.proposal_changes;
drop policy if exists "Users can insert changes for proposals in their org" on public.proposal_changes;

create policy "Users can view changes for proposals in their org"
  on public.proposal_changes for select
  using (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_changes.proposal_id
        and pr.id = auth.uid()
    )
  );

create policy "Users can insert changes for proposals in their org"
  on public.proposal_changes for insert
  with check (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_changes.proposal_id
        and pr.id = auth.uid()
    )
  );

create policy "Users can update changes for proposals in their org"
  on public.proposal_changes for update
  using (
    exists (
      select 1 from public.proposals p
      join public.profiles pr on pr.organization_id = p.organization_id
      where p.id = proposal_changes.proposal_id
        and pr.id = auth.uid()
    )
  );
