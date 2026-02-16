-- HMS Proposal Builder - Storage Buckets

-- ============================================
-- Create storage buckets
-- ============================================
insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
insert into storage.buckets (id, name, public) values ('cover-photos', 'cover-photos', true);
insert into storage.buckets (id, name, public) values ('project-photos', 'project-photos', true);
insert into storage.buckets (id, name, public) values ('personnel-photos', 'personnel-photos', true);
insert into storage.buckets (id, name, public) values ('proposal-files', 'proposal-files', false);
insert into storage.buckets (id, name, public) values ('exports', 'exports', false);

-- ============================================
-- Storage policies for public buckets
-- ============================================

-- Logos: public read, admin write
create policy "Public read logos" on storage.objects for select
  using (bucket_id = 'logos');

create policy "Admins can upload logos" on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "Admins can delete logos" on storage.objects for delete
  using (
    bucket_id = 'logos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- Cover photos: public read, admin write
create policy "Public read cover photos" on storage.objects for select
  using (bucket_id = 'cover-photos');

create policy "Admins can upload cover photos" on storage.objects for insert
  with check (
    bucket_id = 'cover-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "Admins can delete cover photos" on storage.objects for delete
  using (
    bucket_id = 'cover-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- Project photos: public read, admin write
create policy "Public read project photos" on storage.objects for select
  using (bucket_id = 'project-photos');

create policy "Admins can upload project photos" on storage.objects for insert
  with check (
    bucket_id = 'project-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "Admins can delete project photos" on storage.objects for delete
  using (
    bucket_id = 'project-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- Personnel photos: public read, admin write
create policy "Public read personnel photos" on storage.objects for select
  using (bucket_id = 'personnel-photos');

create policy "Admins can upload personnel photos" on storage.objects for insert
  with check (
    bucket_id = 'personnel-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

create policy "Admins can delete personnel photos" on storage.objects for delete
  using (
    bucket_id = 'personnel-photos'
    and public.get_user_role() in ('super_admin', 'hms_admin')
  );

-- Proposal files: authenticated read/write for proposal owners
create policy "Users can read own proposal files" on storage.objects for select
  using (
    bucket_id = 'proposal-files'
    and auth.role() = 'authenticated'
  );

create policy "Users can upload proposal files" on storage.objects for insert
  with check (
    bucket_id = 'proposal-files'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own proposal files" on storage.objects for delete
  using (
    bucket_id = 'proposal-files'
    and auth.role() = 'authenticated'
  );

-- Exports: authenticated read
create policy "Users can read exports" on storage.objects for select
  using (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
  );

create policy "System can write exports" on storage.objects for insert
  with check (
    bucket_id = 'exports'
    and auth.role() = 'authenticated'
  );
