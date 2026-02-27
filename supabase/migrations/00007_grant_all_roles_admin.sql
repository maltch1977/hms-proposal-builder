-- Grant proposal_user the same permissions as hms_admin everywhere.
-- This removes the admin-only restriction so all authenticated users
-- in the same org have full access.

-- ============================================
-- PAST PROJECTS
-- ============================================
drop policy if exists "Admins can manage past projects" on public.past_projects;
create policy "All users can manage past projects"
  on public.past_projects for all
  using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- PERSONNEL
-- ============================================
drop policy if exists "Admins can manage personnel" on public.personnel;
create policy "All users can manage personnel"
  on public.personnel for all
  using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- REFERENCES
-- ============================================
drop policy if exists "Admins can manage references" on public.references;
create policy "All users can manage references"
  on public.references for all
  using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- EMR RATINGS
-- ============================================
drop policy if exists "Admins can manage EMR ratings" on public.emr_ratings;
create policy "All users can manage EMR ratings"
  on public.emr_ratings for all
  using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- LIBRARY ITEMS
-- ============================================
drop policy if exists "Admins can manage library items" on public.library_items;
create policy "All users can manage library items"
  on public.library_items for all
  using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- ============================================
-- STORAGE: PROJECT PHOTOS
-- ============================================
drop policy if exists "Admins can upload project photos" on storage.objects;
create policy "All users can upload project photos" on storage.objects for insert
  with check (bucket_id = 'project-photos');

drop policy if exists "Admins can delete project photos" on storage.objects;
create policy "All users can delete project photos" on storage.objects for delete
  using (bucket_id = 'project-photos');

-- ============================================
-- STORAGE: PERSONNEL PHOTOS
-- ============================================
drop policy if exists "Admins can upload personnel photos" on storage.objects;
create policy "All users can upload personnel photos" on storage.objects for insert
  with check (bucket_id = 'personnel-photos');

drop policy if exists "Admins can delete personnel photos" on storage.objects;
create policy "All users can delete personnel photos" on storage.objects for delete
  using (bucket_id = 'personnel-photos');

-- ============================================
-- STORAGE: PROPOSAL FILES
-- ============================================
drop policy if exists "Admins can upload proposal files" on storage.objects;
create policy "All users can upload proposal files" on storage.objects for insert
  with check (bucket_id = 'proposal-files');

drop policy if exists "Admins can delete proposal files" on storage.objects;
create policy "All users can delete proposal files" on storage.objects for delete
  using (bucket_id = 'proposal-files');
