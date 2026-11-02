-- Migration 001: Profiles and Admin Roles
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists avatar_url text;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager')),
  permission text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (role, permission)
);

alter table public.admin_permissions drop constraint if exists admin_permissions_role_check;
alter table public.admin_permissions add constraint admin_permissions_role_check
  check (role in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));
