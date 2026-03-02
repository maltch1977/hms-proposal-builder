-- Allow all authenticated users to upload cover photos (not just admins)
-- The admin-only restriction was preventing proposal editors from adding cover photos

-- Drop the old admin-only upload policy
drop policy if exists "Admins can upload cover photos" on storage.objects;

-- Create new policy allowing any authenticated user to upload cover photos
create policy "Authenticated users can upload cover photos" on storage.objects for insert
  with check (
    bucket_id = 'cover-photos'
    and auth.role() = 'authenticated'
  );
