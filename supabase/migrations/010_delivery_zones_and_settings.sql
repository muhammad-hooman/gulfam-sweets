-- Migration 010: Delivery Zones, Time Slots, and Store Settings
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  region text,
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  minimum_order_amount numeric(12,2) not null default 0 check (minimum_order_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.delivery_zones 
  add column if not exists free_delivery_threshold numeric(12,2) check (free_delivery_threshold is null or free_delivery_threshold >= 0),
  add column if not exists minimum_order_amount numeric(12,2) not null default 0 check (minimum_order_amount >= 0),
  add column if not exists region text,
  add column if not exists delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  add column if not exists is_active boolean not null default true;

create table if not exists public.delivery_time_slots (
  id uuid primary key default gen_random_uuid(),
  delivery_zone_id uuid not null references public.delivery_zones(id) on delete cascade,
  slot_date date not null,
  starts_at time not null,
  ends_at time not null,
  capacity integer not null check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (delivery_zone_id, slot_date, starts_at, ends_at)
);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);
