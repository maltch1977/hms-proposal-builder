-- HMS Proposal Builder - Functions & Triggers

-- ============================================
-- Auto-update updated_at timestamp
-- ============================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply updated_at trigger to relevant tables
create trigger set_updated_at before update on public.organizations
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.proposals
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.proposal_sections
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.library_items
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.past_projects
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.personnel
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.references
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.cost_library_items
  for each row execute function public.update_updated_at();

-- ============================================
-- Handle new user signup → create profile
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data->>'organization_id')::uuid,
      (select id from public.organizations limit 1)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'proposal_user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- Create proposal sections from section_types
-- ============================================
create or replace function public.create_proposal_sections(p_proposal_id uuid, p_org_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select st.id as section_type_id, st.default_order,
           li.id as library_item_id, li.content as default_content
    from public.section_types st
    left join public.library_items li
      on li.section_type_id = st.id
      and li.organization_id = p_org_id
      and li.is_default = true
    where st.organization_id = p_org_id
    order by st.default_order
  loop
    insert into public.proposal_sections (
      proposal_id, section_type_id, order_index, is_enabled, content, library_item_id
    ) values (
      p_proposal_id,
      r.section_type_id,
      r.default_order,
      true,
      coalesce(r.default_content, '{}'),
      r.library_item_id
    );
  end loop;
end;
$$;

-- ============================================
-- Audit log helper function
-- ============================================
create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    public.get_user_org_id(),
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  );
end;
$$;
