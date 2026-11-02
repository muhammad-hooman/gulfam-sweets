-- Migration 015: Admin Permissions Defaults and Audit Logs
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- Ensure check constraint on admin_permissions allows all defined administrative roles
alter table public.admin_permissions drop constraint if exists admin_permissions_role_check;
alter table public.admin_permissions add constraint admin_permissions_role_check
  check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

-- Seed default role permissions (idempotent)
insert into public.admin_permissions (role, permission, description)
values
  -- admin role
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

  -- manager role
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

  -- inventory_manager role
  ('inventory_manager', 'dashboard.view', 'View dashboard overview and analytics'),
  ('inventory_manager', 'catalog.manage', 'Manage categories, products, and variants'),
  ('inventory_manager', 'products.manage', 'Create, update, and manage products'),
  ('inventory_manager', 'categories.manage', 'Create and update categories'),
  ('inventory_manager', 'inventory.view', 'View stock levels and inventory movements'),
  ('inventory_manager', 'inventory.manage', 'Adjust stock levels with audited reasons'),
  ('inventory_manager', 'media.manage', 'Upload, reorder, and remove store media in storage'),

  -- order_manager role
  ('order_manager', 'dashboard.view', 'View dashboard overview and analytics'),
  ('order_manager', 'orders.view', 'View customer orders and item details'),
  ('order_manager', 'orders.manage', 'Update order status and fulfillment'),
  ('order_manager', 'customers.view', 'View customer profiles and spend history'),
  ('order_manager', 'payments.manage', 'Manage payment records and record COD collections'),
  ('order_manager', 'inquiries.manage', 'Respond to and manage customer contact inquiries')
on conflict (role, permission) do nothing;
