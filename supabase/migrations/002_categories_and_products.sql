-- Migration 002: Categories and Products
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  food_type text not null default 'ambient' check (food_type in ('fresh', 'frozen', 'ambient')),
  legacy_id text unique,
  sku text unique,
  image_url text,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
