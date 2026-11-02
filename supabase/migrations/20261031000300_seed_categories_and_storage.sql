-- Storefront categories are the only seeded business rows. Inserts are repeatable
-- and do not create sample users, products, or orders.
insert into public.categories (name, slug, description, is_active, sort_order)
values
  ('Mithai', 'mithai', 'Traditional South Asian sweets.', true, 10),
  ('Nimco', 'nimco', 'Savory snacks and nimco.', true, 20),
  ('Bakery', 'bakery', 'Baked goods and bakery favorites.', true, 30),
  ('Cakes & Desserts', 'cakes-desserts', 'Cakes and desserts for every occasion.', true, 40),
  ('Fresh Snacks', 'fresh-snacks', 'Freshly prepared savory snacks.', true, 50),
  ('Frozen Foods', 'frozen-foods', 'Frozen snacks and ready-to-cook foods.', true, 60),
  ('Gift Boxes', 'gift-boxes', 'Curated sweet gift boxes.', true, 70),
  ('Wedding & Bulk Orders', 'wedding-bulk-orders', 'Wedding favors and bulk orders.', true, 80)
on conflict (slug) do nothing;

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

drop policy if exists "public storefront image read" on storage.objects;
create policy "public storefront image read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'banner-images', 'category-images'));

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
