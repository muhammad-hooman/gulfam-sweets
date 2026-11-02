-- Migration 014: Customer Inquiries
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.customer_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 200),
  email text check (email is null or (email = btrim(email) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  phone text check (phone is null or length(btrim(phone)) between 1 and 50),
  subject text check (subject is null or length(btrim(subject)) <= 200),
  message text not null check (length(btrim(message)) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
