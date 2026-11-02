-- Migration 017: Row-Level Security (RLS) Policies
-- Gulfam Sweets & Dairy e-Commerce Platform

-- 1. Authorization helpers required by RLS policies
create or replace function public.has_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager')
  );
$$;

create or replace function public.has_super_admin_role()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  );
$$;

create or replace function public.has_admin_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'super_admin'
    )
    or exists (
      select 1
      from public.user_roles ur
      join public.admin_permissions ap on ap.role = ur.role
      where ur.user_id = auth.uid()
        and ap.permission = p_permission
    )
  );
$$;

revoke all on function public.has_admin_role() from public, anon;
revoke all on function public.has_super_admin_role() from public, anon;
revoke all on function public.has_admin_permission(text) from public, anon;
grant execute on function public.has_admin_role() to authenticated;
grant execute on function public.has_super_admin_role() to authenticated;
grant execute on function public.has_admin_permission(text) to authenticated;

-- 2. Enable Row-Level Security across all 29 tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_products enable row level security;
alter table public.coupon_categories enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.delivery_time_slots enable row level security;
alter table public.store_settings enable row level security;
alter table public.product_reviews enable row level security;
alter table public.banners enable row level security;
alter table public.promotions enable row level security;
alter table public.customer_inquiries enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant usage on schema public to anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Profiles
drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.has_admin_permission('customers.view'));
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.has_admin_permission('customers.manage'))
  with check (id = (select auth.uid()) or public.has_admin_permission('customers.manage'));

-- User roles & Admin permissions
drop policy if exists user_roles_admin_select on public.user_roles;
create policy user_roles_admin_select on public.user_roles for select to authenticated
  using (public.has_admin_permission('users.manage'));
drop policy if exists user_roles_admin_write on public.user_roles;
create policy user_roles_admin_write on public.user_roles for all to authenticated
  using (public.has_admin_permission('users.manage'))
  with check (public.has_admin_permission('users.manage'));
drop policy if exists admin_permissions_admin_select on public.admin_permissions;
create policy admin_permissions_admin_select on public.admin_permissions for select to authenticated
  using (public.has_super_admin_role());
drop policy if exists admin_permissions_admin_write on public.admin_permissions;
create policy admin_permissions_admin_write on public.admin_permissions for all to authenticated
  using (public.has_super_admin_role())
  with check (public.has_super_admin_role());

-- Categories
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_public_read_anon on public.categories;
create policy categories_public_read_anon on public.categories for select to anon using (is_active);
drop policy if exists categories_public_read_authenticated on public.categories;
create policy categories_public_read_authenticated on public.categories for select to authenticated
  using (is_active or public.has_admin_permission('catalog.manage'));
drop policy if exists categories_admin_write on public.categories;
create policy categories_admin_write on public.categories for all to authenticated
  using (public.has_admin_permission('catalog.manage'))
  with check (public.has_admin_permission('catalog.manage'));

-- Products
drop policy if exists products_public_read on public.products;
drop policy if exists products_public_read_anon on public.products;
create policy products_public_read_anon on public.products for select to anon using (status = 'active');
drop policy if exists products_public_read_authenticated on public.products;
create policy products_public_read_authenticated on public.products for select to authenticated
  using (status = 'active' or public.has_admin_permission('catalog.manage'));
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all to authenticated
  using (public.has_admin_permission('catalog.manage'))
  with check (public.has_admin_permission('catalog.manage'));

-- Product images
drop policy if exists product_images_public_read on public.product_images;
drop policy if exists product_images_public_read_anon on public.product_images;
create policy product_images_public_read_anon on public.product_images for select to anon
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists product_images_public_read_authenticated on public.product_images;
create policy product_images_public_read_authenticated on public.product_images for select to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active')
    or public.has_admin_permission('catalog.manage'));
drop policy if exists product_images_admin_write on public.product_images;
create policy product_images_admin_write on public.product_images for all to authenticated
  using (public.has_admin_permission('catalog.manage'))
  with check (public.has_admin_permission('catalog.manage'));

-- Product variants
drop policy if exists product_variants_public_read on public.product_variants;
drop policy if exists product_variants_public_read_anon on public.product_variants;
create policy product_variants_public_read_anon on public.product_variants for select to anon
  using (is_available and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
drop policy if exists product_variants_public_read_authenticated on public.product_variants;
create policy product_variants_public_read_authenticated on public.product_variants for select to authenticated
  using ((is_available and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'))
    or public.has_admin_permission('catalog.manage'));
drop policy if exists product_variants_admin_write on public.product_variants;
create policy product_variants_admin_write on public.product_variants for all to authenticated
  using (public.has_admin_permission('catalog.manage'))
  with check (public.has_admin_permission('catalog.manage'));

-- Inventory and Movements
drop policy if exists inventory_admin_read on public.inventory;
create policy inventory_admin_read on public.inventory for select to authenticated
  using (public.has_admin_permission('inventory.view') or public.has_admin_permission('inventory.manage'));
drop policy if exists inventory_movements_admin_read on public.inventory_movements;
create policy inventory_movements_admin_read on public.inventory_movements for select to authenticated
  using (public.has_admin_permission('inventory.view') or public.has_admin_permission('inventory.manage'));

-- Addresses
drop policy if exists addresses_owner_access on public.addresses;
create policy addresses_owner_access on public.addresses for all to authenticated
  using (user_id = (select auth.uid()) or public.has_admin_permission('customers.manage'))
  with check (user_id = (select auth.uid()) or public.has_admin_permission('customers.manage'));

-- Carts and Cart Items
drop policy if exists carts_owner_access on public.carts;
create policy carts_owner_access on public.carts for all to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists cart_items_owner_access on public.cart_items;
create policy cart_items_owner_access on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

-- Orders and Order Items
drop policy if exists orders_owner_admin_select on public.orders;
create policy orders_owner_admin_select on public.orders for select to authenticated
  using (customer_id = (select auth.uid())
    or public.has_admin_permission('orders.view')
    or public.has_admin_permission('orders.manage'));
drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders for all to authenticated
  using (public.has_admin_permission('orders.manage'))
  with check (public.has_admin_permission('orders.manage'));

drop policy if exists order_items_owner_admin_select on public.order_items;
create policy order_items_owner_admin_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = (select auth.uid())
      or public.has_admin_permission('orders.view')
      or public.has_admin_permission('orders.manage'))));
drop policy if exists order_items_admin_write on public.order_items;
create policy order_items_admin_write on public.order_items for all to authenticated
  using (public.has_admin_permission('orders.manage'))
  with check (public.has_admin_permission('orders.manage'));

drop policy if exists order_history_owner_admin_select on public.order_status_history;
create policy order_history_owner_admin_select on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
    and (o.customer_id = (select auth.uid())
      or public.has_admin_permission('orders.view')
      or public.has_admin_permission('orders.manage'))));
drop policy if exists order_history_admin_write on public.order_status_history;
create policy order_history_admin_write on public.order_status_history for all to authenticated
  using (public.has_admin_permission('orders.manage'))
  with check (public.has_admin_permission('orders.manage'));

-- Payments
drop policy if exists payments_admin_access on public.payments;
create policy payments_admin_access on public.payments for all to authenticated
  using (public.has_admin_permission('payments.manage'))
  with check (public.has_admin_permission('payments.manage'));
drop policy if exists payment_transactions_admin_access on public.payment_transactions;
create policy payment_transactions_admin_access on public.payment_transactions for all to authenticated
  using (public.has_admin_permission('payments.manage'))
  with check (public.has_admin_permission('payments.manage'));

-- Coupons
drop policy if exists coupons_admin_access on public.coupons;
create policy coupons_admin_access on public.coupons for all to authenticated
  using (public.has_admin_permission('promotions.manage'))
  with check (public.has_admin_permission('promotions.manage'));
drop policy if exists coupon_products_admin_access on public.coupon_products;
create policy coupon_products_admin_access on public.coupon_products for all to authenticated
  using (public.has_admin_permission('promotions.manage'))
  with check (public.has_admin_permission('promotions.manage'));
drop policy if exists coupon_categories_admin_access on public.coupon_categories;
create policy coupon_categories_admin_access on public.coupon_categories for all to authenticated
  using (public.has_admin_permission('promotions.manage'))
  with check (public.has_admin_permission('promotions.manage'));
drop policy if exists coupon_usage_owner_admin_read on public.coupon_usage;
create policy coupon_usage_owner_admin_read on public.coupon_usage for select to authenticated
  using (user_id = (select auth.uid()) or public.has_admin_permission('promotions.manage'));

-- Delivery zones and time slots
drop policy if exists delivery_zones_active_read on public.delivery_zones;
drop policy if exists delivery_zones_active_read_anon on public.delivery_zones;
create policy delivery_zones_active_read_anon on public.delivery_zones for select to anon using (is_active);
drop policy if exists delivery_zones_active_read_authenticated on public.delivery_zones;
create policy delivery_zones_active_read_authenticated on public.delivery_zones for select to authenticated
  using (is_active or public.has_admin_permission('delivery.manage'));
drop policy if exists delivery_zones_admin_write on public.delivery_zones;
create policy delivery_zones_admin_write on public.delivery_zones for all to authenticated
  using (public.has_admin_permission('delivery.manage'))
  with check (public.has_admin_permission('delivery.manage'));

drop policy if exists delivery_slots_active_read on public.delivery_time_slots;
drop policy if exists delivery_slots_active_read_anon on public.delivery_time_slots;
create policy delivery_slots_active_read_anon on public.delivery_time_slots for select to anon using (is_active);
drop policy if exists delivery_slots_active_read_authenticated on public.delivery_time_slots;
create policy delivery_slots_active_read_authenticated on public.delivery_time_slots for select to authenticated
  using (is_active or public.has_admin_permission('delivery.manage'));
drop policy if exists delivery_slots_admin_write on public.delivery_time_slots;
create policy delivery_slots_admin_write on public.delivery_time_slots for all to authenticated
  using (public.has_admin_permission('delivery.manage'))
  with check (public.has_admin_permission('delivery.manage'));

-- Store Settings
drop policy if exists settings_public_read on public.store_settings;
drop policy if exists settings_public_read_anon on public.store_settings;
create policy settings_public_read_anon on public.store_settings for select to anon using (is_public);
drop policy if exists settings_public_read_authenticated on public.store_settings;
create policy settings_public_read_authenticated on public.store_settings for select to authenticated
  using (is_public or public.has_admin_permission('settings.manage'));
drop policy if exists settings_admin_write on public.store_settings;
create policy settings_admin_write on public.store_settings for all to authenticated
  using (public.has_admin_permission('settings.manage'))
  with check (public.has_admin_permission('settings.manage'));

-- Reviews
drop policy if exists reviews_public_read on public.product_reviews;
drop policy if exists reviews_public_read_anon on public.product_reviews;
create policy reviews_public_read_anon on public.product_reviews for select to anon using (status = 'approved');
drop policy if exists reviews_public_read_authenticated on public.product_reviews;
create policy reviews_public_read_authenticated on public.product_reviews for select to authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or public.has_admin_permission('reviews.manage'));
drop policy if exists reviews_owner_insert on public.product_reviews;
create policy reviews_owner_insert on public.product_reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists reviews_admin_write on public.product_reviews;
create policy reviews_admin_write on public.product_reviews for all to authenticated
  using (public.has_admin_permission('reviews.manage'))
  with check (public.has_admin_permission('reviews.manage'));

-- Banners and Promotions
drop policy if exists banners_public_read on public.banners;
drop policy if exists banners_public_read_anon on public.banners;
create policy banners_public_read_anon on public.banners for select to anon using (is_active);
drop policy if exists banners_public_read_authenticated on public.banners;
create policy banners_public_read_authenticated on public.banners for select to authenticated
  using (is_active or public.has_admin_permission('promotions.manage'));
drop policy if exists banners_admin_write on public.banners;
create policy banners_admin_write on public.banners for all to authenticated
  using (public.has_admin_permission('promotions.manage'))
  with check (public.has_admin_permission('promotions.manage'));

drop policy if exists promotions_public_read on public.promotions;
drop policy if exists promotions_public_read_anon on public.promotions;
create policy promotions_public_read_anon on public.promotions for select to anon using (is_active);
drop policy if exists promotions_public_read_authenticated on public.promotions;
create policy promotions_public_read_authenticated on public.promotions for select to authenticated
  using (is_active or public.has_admin_permission('promotions.manage'));
drop policy if exists promotions_admin_write on public.promotions;
create policy promotions_admin_write on public.promotions for all to authenticated
  using (public.has_admin_permission('promotions.manage'))
  with check (public.has_admin_permission('promotions.manage'));

-- Customer Inquiries
drop policy if exists inquiries_public_insert on public.customer_inquiries;
create policy inquiries_public_insert on public.customer_inquiries for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = (select auth.uid())));
drop policy if exists inquiries_admin_access on public.customer_inquiries;
create policy inquiries_admin_access on public.customer_inquiries for all to authenticated
  using (public.has_admin_permission('inquiries.manage'))
  with check (public.has_admin_permission('inquiries.manage'));

-- Audit logs
drop policy if exists audit_admin_read on public.admin_audit_logs;
create policy audit_admin_read on public.admin_audit_logs for select to authenticated
  using (public.has_admin_permission('audit.view'));

-- Column-level grants prevent direct client tampering with sensitive values
grant select on all tables in schema public to anon, authenticated;
grant all on public.product_variants to authenticated;
grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images,
  public.addresses, public.carts, public.cart_items, public.delivery_zones,
  public.delivery_time_slots, public.store_settings, public.banners, public.promotions,
  public.coupons, public.coupon_products, public.coupon_categories
  to authenticated;
grant insert (product_id, sku, name, weight_value, weight_unit, price, sale_price, low_stock_threshold, is_available),
  update (product_id, sku, name, weight_value, weight_unit, price, sale_price, low_stock_threshold, is_available)
  on public.product_variants to authenticated;
grant update (full_name, email, phone, updated_at) on public.profiles to authenticated;
grant insert, update, delete on public.admin_permissions to authenticated;
grant insert, update, delete on public.product_reviews to authenticated;
grant insert (name, email, phone, subject, message, status) on public.customer_inquiries to anon, authenticated;
grant update on public.customer_inquiries to authenticated;
