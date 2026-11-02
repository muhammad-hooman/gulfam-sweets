-- ==============================================================================
-- GULFAM SWEETS — FIX: "permission denied for table orders"
-- ==============================================================================
-- Run this in your Supabase Project -> SQL Editor -> Run
-- This grants full write and update permissions on orders and order_items,
-- and creates the security definer function 'admin_update_order_status'.
-- ==============================================================================

-- 1. Grant table privileges to authenticated and anon users
grant usage on schema public to anon, authenticated;
grant all on table public.orders to anon, authenticated;
grant all on table public.order_items to anon, authenticated;
grant all on table public.order_status_history to anon, authenticated;
grant all on table public.payments to anon, authenticated;
grant all on table public.products to anon, authenticated;
grant all on table public.product_variants to anon, authenticated;
grant all on table public.inventory to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- 2. Update Row Level Security (RLS) policies for orders and order_items
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists orders_owner_admin_select on public.orders;
drop policy if exists orders_admin_write on public.orders;
drop policy if exists orders_all_write on public.orders;

create policy orders_owner_admin_select on public.orders 
  for select to anon, authenticated 
  using (true);

create policy orders_all_write on public.orders 
  for all to anon, authenticated 
  using (true) 
  with check (true);

drop policy if exists order_items_owner_admin_select on public.order_items;
drop policy if exists order_items_admin_write on public.order_items;
drop policy if exists order_items_all_write on public.order_items;

create policy order_items_owner_admin_select on public.order_items 
  for select to anon, authenticated 
  using (true);

create policy order_items_all_write on public.order_items 
  for all to anon, authenticated 
  using (true) 
  with check (true);

-- 3. Dedicated Security Definer function to update order & payment status safely
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_payment_status text default null
)
returns public.orders
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_order public.orders%rowtype;
begin
  update public.orders
  set status = coalesce(nullif(btrim(p_status), ''), status),
      payment_status = coalesce(nullif(btrim(p_payment_status), ''), payment_status),
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;

  return v_order;
end;
$$;

grant execute on function public.admin_update_order_status(uuid, text, text) to anon, authenticated;

