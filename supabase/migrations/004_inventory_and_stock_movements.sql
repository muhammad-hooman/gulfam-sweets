-- Migration 004: Inventory and Stock Movements
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null unique references public.product_variants(id) on delete restrict,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity_delta integer not null check (quantity_delta <> 0),
  movement_type text not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
