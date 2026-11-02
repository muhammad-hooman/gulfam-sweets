-- Gulfam Sweets & Dairy e-Commerce Platform
-- Database Seed Script (Idempotent)

-- 1. Default Store Categories
insert into public.categories (name, slug, description, is_active, sort_order)
values
  ('Mithai', 'mithai', 'Traditional South Asian sweets handcrafted with pure ingredients.', true, 10),
  ('Nimco', 'nimco', 'Crispy, savory snacks and authentic Pakistani nimco varieties.', true, 20),
  ('Bakery', 'bakery', 'Freshly baked biscuits, rusks, breads, and confectionery favorites.', true, 30),
  ('Cakes & Desserts', 'cakes-desserts', 'Celebration cakes, pastries, and signature desserts for every occasion.', true, 40),
  ('Fresh Snacks', 'fresh-snacks', 'Freshly fried hot samosas, roll patties, and tea-time snacks.', true, 50),
  ('Frozen Foods', 'frozen-foods', 'Premium frozen snacks, samosas, and parathas ready to fry at home.', true, 60),
  ('Gift Boxes', 'gift-boxes', 'Elegantly packaged luxury mithai and assorted sweets gift boxes.', true, 70),
  ('Wedding & Bulk Orders', 'wedding-bulk-orders', 'Custom catering, bulk orders, and sweet distribution boxes for weddings and celebrations.', true, 80)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- 2. Default Delivery Zones
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  region text,
  delivery_fee numeric(12,2) not null default 0,
  free_delivery_threshold numeric(12,2),
  minimum_order_amount numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.delivery_zones 
  add column if not exists free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  add column if not exists minimum_order_amount numeric(12,2) not null default 0 check (minimum_order_amount >= 0),
  add column if not exists region text,
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists is_active boolean not null default true;

-- Remove duplicates before creating index
delete from public.delivery_zones
where id in (
  select id
  from (
    select id, row_number() over (partition by lower(trim(name)), lower(trim(city)) order by id) as rnum
    from public.delivery_zones
  ) t
  where t.rnum > 1
);

do $$
begin
  begin
    create unique index if not exists delivery_zones_name_city_idx on public.delivery_zones (name, city);
  exception when others then
    null;
  end;
end;
$$;

insert into public.delivery_zones (name, city, region, delivery_fee, free_delivery_threshold, minimum_order_amount, is_active)
select d.name, d.city, d.region, d.delivery_fee, d.free_delivery_threshold, d.minimum_order_amount, d.is_active
from (
  values
    ('Lahore Central & Mall Road', 'Lahore', 'Punjab', 150.00, 2500.00, 500.00, true),
    ('Gulberg, Model Town & Garden Town', 'Lahore', 'Punjab', 150.00, 2500.00, 500.00, true),
    ('DHA & Cantt', 'Lahore', 'Punjab', 200.00, 3000.00, 500.00, true),
    ('Johar Town & Faisal Town', 'Lahore', 'Punjab', 200.00, 3000.00, 500.00, true),
    ('Bahria Town & Raiwind Road', 'Lahore', 'Punjab', 300.00, 4000.00, 1000.00, true)
) as d(name, city, region, delivery_fee, free_delivery_threshold, minimum_order_amount, is_active)
where not exists (
  select 1 from public.delivery_zones dz
  where lower(trim(dz.name)) = lower(trim(d.name))
    and lower(trim(dz.city)) = lower(trim(d.city))
);

-- 3. Default Store Settings
insert into public.store_settings (key, value, is_public)
values
  ('store_info', '{"name": "Gulfam Sweets & Dairy", "phone": "0300 1234567", "email": "info@gulfamsweets.com", "address": "Main Market, Lahore, Pakistan", "opening_hours": "9:00 AM to 11:00 PM"}'::jsonb, true),
  ('currency', '{"code": "PKR", "symbol": "Rs.", "format": "Rs. {amount}"}'::jsonb, true),
  ('checkout_rules', '{"allow_guest_checkout": true, "cod_enabled": true, "bank_transfer_enabled": true, "raast_enabled": true}'::jsonb, true),
  ('delivery_policy', '{"standard_time_minutes": 60, "express_available": true, "fresh_food_same_day_only": true}'::jsonb, true)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public;

-- 4. Default Role Permissions
alter table public.admin_permissions drop constraint if exists admin_permissions_role_check;
alter table public.admin_permissions add constraint admin_permissions_role_check
  check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

insert into public.admin_permissions (role, permission, description)
values
  ('admin', 'dashboard.view', 'View dashboard overview and analytics'),
  ('admin', 'catalog.manage', 'Manage categories, products, and variants'),
  ('admin', 'products.manage', 'Create, update, and manage products'),
  ('admin', 'categories.manage', 'Create and update categories'),
  ('admin', 'inventory.view', 'View stock levels and inventory movements'),
  ('admin', 'inventory.manage', 'Adjust stock levels with audited reasons'),
  ('admin', 'orders.view', 'View customer orders and item details'),
  ('admin', 'orders.manage', 'Update order status and fulfillment'),
  ('admin', 'customers.view', 'View customer profiles and spend history'),
  ('admin', 'customers.manage', 'Manage customer profiles and details'),
  ('admin', 'coupons.manage', 'Manage coupon codes and discount thresholds'),
  ('admin', 'promotions.manage', 'Manage banners and promotional campaigns'),
  ('admin', 'content.manage', 'Manage site banners and content elements'),
  ('admin', 'settings.manage', 'Configure store settings and delivery zones'),
  ('admin', 'delivery.manage', 'Configure delivery zones and time slots'),
  ('admin', 'payments.manage', 'Manage payment records and record COD collections'),
  ('admin', 'reviews.manage', 'Moderate customer product reviews'),
  ('admin', 'inquiries.manage', 'Respond to and manage customer contact inquiries'),
  ('admin', 'media.manage', 'Upload, reorder, and remove store media in storage'),
  ('admin', 'audit.view', 'View administrative audit logs'),
  ('admin', 'users.manage', 'View and assign administrative roles'),

  ('manager', 'dashboard.view', 'View dashboard overview and analytics'),
  ('manager', 'catalog.manage', 'Manage categories, products, and variants'),
  ('manager', 'products.manage', 'Create, update, and manage products'),
  ('manager', 'categories.manage', 'Create and update categories'),
  ('manager', 'inventory.view', 'View stock levels and inventory movements'),
  ('manager', 'inventory.manage', 'Adjust stock levels with audited reasons'),
  ('manager', 'orders.view', 'View customer orders and item details'),
  ('manager', 'orders.manage', 'Update order status and fulfillment'),
  ('manager', 'customers.view', 'View customer profiles and spend history'),
  ('manager', 'coupons.manage', 'Manage coupon codes and discount thresholds'),
  ('manager', 'promotions.manage', 'Manage banners and promotional campaigns'),
  ('manager', 'content.manage', 'Manage site banners and content elements'),
  ('manager', 'payments.manage', 'Manage payment records and record COD collections'),
  ('manager', 'reviews.manage', 'Moderate customer product reviews'),
  ('manager', 'inquiries.manage', 'Respond to and manage customer contact inquiries'),
  ('manager', 'media.manage', 'Upload, reorder, and remove store media in storage'),

  ('inventory_manager', 'dashboard.view', 'View dashboard overview and analytics'),
  ('inventory_manager', 'catalog.manage', 'Manage categories, products, and variants'),
  ('inventory_manager', 'products.manage', 'Create, update, and manage products'),
  ('inventory_manager', 'categories.manage', 'Create and update categories'),
  ('inventory_manager', 'inventory.view', 'View stock levels and inventory movements'),
  ('inventory_manager', 'inventory.manage', 'Adjust stock levels with audited reasons'),
  ('inventory_manager', 'media.manage', 'Upload, reorder, and remove store media in storage'),

  ('order_manager', 'dashboard.view', 'View dashboard overview and analytics'),
  ('order_manager', 'orders.view', 'View customer orders and item details'),
  ('order_manager', 'orders.manage', 'Update order status and fulfillment'),
  ('order_manager', 'customers.view', 'View customer profiles and spend history'),
  ('order_manager', 'payments.manage', 'Manage payment records and record COD collections'),
  ('order_manager', 'inquiries.manage', 'Respond to and manage customer contact inquiries')
on conflict (role, permission) do nothing;
