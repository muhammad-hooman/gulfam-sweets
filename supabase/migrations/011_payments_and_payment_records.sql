-- Migration 011: Payments and Payment Transactions
-- Gulfam Sweets & Dairy e-Commerce Platform

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  method text not null check (method in ('cod', 'bank_transfer', 'raast')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  payment_reference text,
  collected_at timestamptz,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  provider text,
  provider_reference text,
  status text not null,
  amount numeric(12,2) not null check (amount >= 0),
  response jsonb,
  occurred_at timestamptz,
  created_at timestamptz not null default now()
);
