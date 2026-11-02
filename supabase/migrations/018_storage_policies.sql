-- Migration 018: Supabase Storage Buckets and Security Policies
-- Gulfam Sweets & Dairy e-Commerce Platform

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, null, null),
  ('banner-images', 'banner-images', true, null, null),
  ('category-images', 'category-images', true, null, null),
  ('customer-uploads', 'customer-uploads', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = case when excluded.id = 'customer-uploads' then 10485760 else storage.buckets.file_size_limit end,
      allowed_mime_types = case
        when excluded.id = 'customer-uploads'
          then array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
        else storage.buckets.allowed_mime_types
      end;

-- Storefront image public read
drop policy if exists "public storefront image read" on storage.objects;
create policy "public storefront image read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'banner-images', 'category-images'));

-- Storefront media admin write/delete
drop policy if exists "admin storefront image insert" on storage.objects;
create policy "admin storefront image insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('product-images', 'banner-images', 'category-images')
    and public.has_admin_permission('media.manage')
  );

drop policy if exists "admin storefront image update" on storage.objects;
create policy "admin storefront image update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('product-images', 'banner-images', 'category-images')
    and public.has_admin_permission('media.manage')
  )
  with check (
    bucket_id in ('product-images', 'banner-images', 'category-images')
    and public.has_admin_permission('media.manage')
  );

drop policy if exists "admin storefront image delete" on storage.objects;
create policy "admin storefront image delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('product-images', 'banner-images', 'category-images')
    and public.has_admin_permission('media.manage')
  );

-- Customer uploads
drop policy if exists "customer upload owner or admin read" on storage.objects;
create policy "customer upload owner or admin read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'customer-uploads'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_admin_permission('media.manage')
    )
  );

drop policy if exists "customer upload owner insert" on storage.objects;
create policy "customer upload owner insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'customer-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "customer upload owner or admin update" on storage.objects;
create policy "customer upload owner or admin update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'customer-uploads'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_admin_permission('media.manage')
    )
  )
  with check (
    bucket_id = 'customer-uploads'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_admin_permission('media.manage')
    )
  );

drop policy if exists "customer upload owner or admin delete" on storage.objects;
create policy "customer upload owner or admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'customer-uploads'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_admin_permission('media.manage')
    )
  );
