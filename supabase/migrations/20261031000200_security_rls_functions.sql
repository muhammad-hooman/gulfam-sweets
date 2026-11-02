-- Authorization, row-level security, and trusted server-side workflows.

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

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.initialize_variant_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inventory (product_variant_id, quantity_on_hand)
  values (new.id, 0)
  on conflict (product_variant_id) do nothing;
  return new;
end;
$$;

drop trigger if exists product_variant_initialize_inventory on public.product_variants;
create trigger product_variant_initialize_inventory
after insert on public.product_variants
for each row execute function public.initialize_variant_inventory();

insert into public.inventory (product_variant_id, quantity_on_hand)
select pv.id, 0
from public.product_variants pv
on conflict (product_variant_id) do nothing;

create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_data jsonb;
begin
  if tg_op = 'INSERT' then
    v_new := to_jsonb(new);
    v_data := v_new;
  elsif tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    v_data := v_new;
  else
    v_old := to_jsonb(old);
    v_data := v_old;
  end if;

  insert into public.admin_audit_logs (actor_id, table_name, record_id, action, old_data, new_data)
  values (
    auth.uid(),
    tg_table_name,
    nullif(v_data ->> 'id', '')::uuid,
    tg_op,
    v_old,
    v_new
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists products_admin_audit on public.products;
create trigger products_admin_audit after insert or update or delete on public.products
for each row execute function public.audit_admin_change();
drop trigger if exists categories_admin_audit on public.categories;
create trigger categories_admin_audit after insert or update or delete on public.categories
for each row execute function public.audit_admin_change();
drop trigger if exists coupons_admin_audit on public.coupons;
create trigger coupons_admin_audit after insert or update or delete on public.coupons
for each row execute function public.audit_admin_change();
drop trigger if exists orders_admin_audit on public.orders;
create trigger orders_admin_audit after insert or update or delete on public.orders
for each row execute function public.audit_admin_change();
drop trigger if exists inventory_admin_audit on public.inventory;
create trigger inventory_admin_audit after insert or update or delete on public.inventory
for each row execute function public.audit_admin_change();
drop trigger if exists user_roles_admin_audit on public.user_roles;
create trigger user_roles_admin_audit after insert or update or delete on public.user_roles
for each row execute function public.audit_admin_change();

drop trigger if exists admin_permissions_admin_audit on public.admin_permissions;
create trigger admin_permissions_admin_audit after insert or update or delete on public.admin_permissions
for each row execute function public.audit_admin_change();

create or replace function public.guard_admin_permission_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.has_super_admin_role() then
    raise exception 'only a Super Admin may change permission grants' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_admin_permission_change_trigger on public.admin_permissions;
create trigger guard_admin_permission_change_trigger
before insert or update or delete on public.admin_permissions
for each row execute function public.guard_admin_permission_change();

create or replace function public.guard_super_admin_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and not exists (
       select 1 from public.user_roles ur
       where ur.user_id = auth.uid() and ur.role = 'super_admin'
     )
     and (
       (tg_op = 'INSERT' and new.role = 'super_admin')
       or (tg_op = 'UPDATE' and (new.role = 'super_admin' or old.role = 'super_admin'))
       or (tg_op = 'DELETE' and old.role = 'super_admin')
     ) then
    raise exception 'only a Super Admin may assign or remove the Super Admin role'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_super_admin_assignment_trigger on public.user_roles;
create trigger guard_super_admin_assignment_trigger
before insert or update or delete on public.user_roles
for each row execute function public.guard_super_admin_assignment();

create or replace function public.adjust_inventory(
  p_variant_id uuid,
  p_quantity_delta integer,
  p_reason text
)
returns table (
  inventory_id uuid,
  product_variant_id uuid,
  quantity_on_hand integer,
  movement_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory public.inventory%rowtype;
  v_movement_id uuid;
begin
  if not public.has_admin_permission('inventory.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_quantity_delta is null or p_quantity_delta = 0 then
    raise exception 'quantity delta must not be zero' using errcode = '22023';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception 'reason is required' using errcode = '22023';
  end if;

  select i.* into v_inventory
  from public.inventory i
  where i.product_variant_id = p_variant_id
  for update;
  if not found then
    raise exception 'variant inventory not found' using errcode = 'P0002';
  end if;
  if v_inventory.quantity_on_hand + p_quantity_delta < 0 then
    raise exception 'inventory cannot become negative' using errcode = '23514';
  end if;

  update public.inventory i
    set quantity_on_hand = i.quantity_on_hand + p_quantity_delta,
        updated_at = now()
    where i.id = v_inventory.id
    returning i.* into v_inventory;
  update public.product_variants pv
    set stock_quantity = v_inventory.quantity_on_hand,
        updated_at = now()
    where pv.id = p_variant_id;

  insert into public.inventory_movements (
    variant_id, quantity_delta, movement_type, reason, performed_by
  ) values (p_variant_id, p_quantity_delta, 'adjustment', btrim(p_reason), auth.uid())
  returning id into v_movement_id;

  return query select v_inventory.id, p_variant_id, v_inventory.quantity_on_hand, v_movement_id;
end;
$$;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_internal_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_allowed boolean;
  v_item record;
  v_inventory public.inventory%rowtype;
begin
  if not public.has_admin_permission('orders.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_status is null or p_status not in (
    'pending', 'confirmed', 'processing', 'packed', 'shipped',
    'delivered', 'cancelled', 'returned', 'refunded'
  ) then
    raise exception 'invalid order status' using errcode = '22023';
  end if;

  select o.* into v_order from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  v_allowed := (v_order.status = p_status)
    or (v_order.status = 'pending' and p_status in ('confirmed', 'cancelled'))
    or (v_order.status = 'confirmed' and p_status in ('processing', 'cancelled'))
    or (v_order.status = 'processing' and p_status in ('packed', 'cancelled'))
    or (v_order.status = 'packed' and p_status in ('shipped', 'cancelled'))
    or (v_order.status = 'shipped' and p_status in ('delivered', 'returned'))
    or (v_order.status = 'delivered' and p_status in ('returned', 'refunded'))
    or (v_order.status = 'returned' and p_status = 'refunded');
  if not v_allowed then
    raise exception 'invalid order status transition: % -> %', v_order.status, p_status using errcode = '22023';
  end if;

  if v_order.status <> p_status then
    if p_status = 'cancelled' then
      for v_item in
        select oi.product_variant_id, sum(oi.quantity)::integer as quantity
        from public.order_items oi
        where oi.order_id = p_order_id and oi.product_variant_id is not null
        group by oi.product_variant_id
        order by oi.product_variant_id
      loop
        update public.inventory i
          set quantity_on_hand = i.quantity_on_hand + v_item.quantity, updated_at = now()
          where i.product_variant_id = v_item.product_variant_id
          returning i.* into v_inventory;
        if found then
          update public.product_variants pv
            set stock_quantity = v_inventory.quantity_on_hand, updated_at = now()
            where pv.id = v_item.product_variant_id;
          insert into public.inventory_movements (
            variant_id, quantity_delta, movement_type, reason, reference_type, reference_id, performed_by
          ) values (
            v_item.product_variant_id, v_item.quantity, 'order_cancelled', 'order_cancelled',
            'order', p_order_id, auth.uid()
          );
        end if;
      end loop;
    end if;
    insert into public.order_status_history (order_id, old_status, new_status, note, actor_id)
    values (p_order_id, v_order.status, p_status, p_internal_note, auth.uid());
    update public.orders o
      set status = p_status,
          payment_status = case when p_status = 'refunded' then 'refunded' else o.payment_status end,
          internal_notes = case
            when nullif(btrim(p_internal_note), '') is null then o.internal_notes
            else concat_ws(E'\n', nullif(o.internal_notes, ''), btrim(p_internal_note))
          end,
          updated_at = now()
      where o.id = p_order_id
      returning o.* into v_order;
    if p_status = 'refunded' then
      update public.payments p set status = 'refunded', updated_at = now()
        where p.order_id = p_order_id and p.status = 'paid';
    end if;
  end if;
  return v_order;
end;
$$;

create or replace function public.update_order_fulfillment(
  p_order_id uuid,
  p_courier_name text,
  p_tracking_number text,
  p_internal_notes text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.has_admin_permission('orders.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  update public.orders o
    set courier_name = nullif(btrim(p_courier_name), ''),
        tracking_number = nullif(btrim(p_tracking_number), ''),
        internal_notes = case
          when nullif(btrim(p_internal_notes), '') is null then o.internal_notes
          else concat_ws(E'\n', nullif(o.internal_notes, ''), btrim(p_internal_notes))
        end,
        updated_at = now()
    where o.id = p_order_id
    returning o.* into v_order;
  if not found then
    raise exception 'order not found' using errcode = 'P0002';
  end if;
  return v_order;
end;
$$;

create or replace function public.create_checkout_order(
  p_payload jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_payload_user_id uuid;
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_input record;
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_inventory public.inventory%rowtype;
  v_coupon public.coupons%rowtype;
  v_zone public.delivery_zones%rowtype;
  v_slot public.delivery_time_slots%rowtype;
  v_slot_found boolean := false;
  v_resolved_items jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_delivery_fee numeric(12,2) := 0;
  v_total numeric(12,2);
  v_eligible_subtotal numeric(12,2);
  v_product_restrictions integer;
  v_category_restrictions integer;
  v_customer_uses integer;
  v_coupon_uses integer;
  v_slot_uses integer;
  v_variant_matches integer;
  v_unit_price numeric(12,2);
  v_customer_name text;
  v_phone text;
  v_email text;
  v_address text;
  v_city text;
  v_delivery_date date;
  v_coupon_code text;
  v_payment_method text;
  v_result_items jsonb;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'payload must be a JSON object' using errcode = '22023';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;
  if p_payload ? 'idempotency_key'
     and p_payload ->> 'idempotency_key' is distinct from p_idempotency_key then
    raise exception 'payload idempotency key does not match argument' using errcode = '22023';
  end if;
  if nullif(p_payload ->> 'user_id', '') is not null then
    v_payload_user_id := (p_payload ->> 'user_id')::uuid;
    if v_payload_user_id is distinct from v_user_id then
      raise exception 'payload user_id must match the authenticated user' using errcode = '42501';
    end if;
  end if;

  v_customer_name := nullif(btrim(p_payload ->> 'customer_name'), '');
  v_phone := nullif(btrim(p_payload ->> 'phone'), '');
  v_email := nullif(btrim(p_payload ->> 'email'), '');
  v_address := nullif(btrim(p_payload ->> 'address'), '');
  v_city := nullif(btrim(p_payload ->> 'city'), '');
  v_coupon_code := nullif(btrim(p_payload ->> 'coupon_code'), '');
  v_payment_method := lower(coalesce(nullif(btrim(p_payload ->> 'payment_method'), ''), 'cod'));
  if v_customer_name is null or v_phone is null or v_address is null or v_city is null then
    raise exception 'customer_name, phone, address, and city are required' using errcode = '22023';
  end if;
  if v_payment_method not in ('cod', 'bank_transfer', 'raast') then
    raise exception 'unsupported payment method' using errcode = '22023';
  end if;
  if p_payload -> 'items' is null or jsonb_typeof(p_payload -> 'items') <> 'array' then
    raise exception 'at least one item is required' using errcode = '22023';
  end if;
  if jsonb_array_length(p_payload -> 'items') = 0 then
    raise exception 'at least one item is required' using errcode = '22023';
  end if;
  if p_payload ->> 'delivery_date' is not null then
    v_delivery_date := (p_payload ->> 'delivery_date')::date;
    if v_delivery_date < current_date then
      raise exception 'delivery date cannot be in the past' using errcode = '22023';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));
  select o.* into v_existing from public.orders o
    where o.idempotency_key = p_idempotency_key for update;
  if found then
    if v_existing.customer_id is distinct from v_user_id then
      raise exception 'idempotency key already belongs to another customer' using errcode = '23505';
    end if;
    select coalesce(jsonb_agg(to_jsonb(oi) order by oi.id), '[]'::jsonb) into v_result_items
      from public.order_items oi where oi.order_id = v_existing.id;
    return jsonb_build_object('order', to_jsonb(v_existing), 'items', v_result_items);
  end if;

  -- Resolve IDs/labels through the trusted catalog before calculating any totals.
  for v_input in select x.value from jsonb_array_elements(p_payload -> 'items') as x(value)
  loop
    if nullif(v_input.value ->> 'product_id', '') is not null then
      select p.* into v_product from public.products p
        where p.id = (v_input.value ->> 'product_id')::uuid and p.status = 'active';
    elsif nullif(v_input.value ->> 'product_legacy_id', '') is not null then
      select p.* into v_product from public.products p
        where p.legacy_id = v_input.value ->> 'product_legacy_id' and p.status = 'active';
    else
      raise exception 'each item requires product_id or product_legacy_id' using errcode = '22023';
    end if;
    if not found then
      raise exception 'product is not imported or is unavailable (legacy_id=%)',
        v_input.value ->> 'product_legacy_id' using errcode = 'P0002';
    end if;

    v_variant := null;
    if nullif(v_input.value ->> 'variant_id', '') is not null then
      select pv.* into v_variant from public.product_variants pv
        where pv.id = (v_input.value ->> 'variant_id')::uuid
          and pv.product_id = v_product.id and pv.is_available;
    end if;

    if v_variant.id is null and nullif(btrim(v_input.value ->> 'variant_label'), '') is not null then
      select pv.* into v_variant from public.product_variants pv
        where pv.product_id = v_product.id and pv.is_available
          and lower(btrim(pv.name)) = lower(btrim(v_input.value ->> 'variant_label'))
        order by pv.created_at asc limit 1;
    end if;

    -- Resilient fallback: If no exact variant match, pick the first available variant for this product
    if v_variant.id is null then
      select pv.* into v_variant from public.product_variants pv
        where pv.product_id = v_product.id and pv.is_available
        order by pv.created_at asc limit 1;
    end if;

    -- Resilient fallback 2: If the product has NO variants at all, dynamically create a standard variant!
    if v_variant.id is null then
      insert into public.product_variants (product_id, name, sku, price, is_available)
      values (v_product.id, 'Standard', coalesce(v_product.sku, 'GS-' || v_product.id), coalesce(v_product.base_price, 0), true)
      returning * into v_variant;

      insert into public.inventory (product_variant_id, quantity_on_hand, low_stock_threshold)
      values (v_variant.id, 500, 5)
      on conflict (product_variant_id) do nothing;
    end if;

    if (v_input.value ->> 'quantity') is null
       or (v_input.value ->> 'quantity')::integer <= 0 then
      raise exception 'item quantity must be a positive integer' using errcode = '22023';
    end if;
    v_resolved_items := v_resolved_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_variant.id,
      'quantity', (v_input.value ->> 'quantity')::integer
    ));
  end loop;

  -- Lock stock rows first, in stable ID order; all stock-changing functions follow
  -- this inventory -> variant lock order to avoid overselling and reduce deadlocks.
  for v_item in
    select (x.value ->> 'product_id')::uuid as product_id,
           (x.value ->> 'variant_id')::uuid as variant_id,
           sum((x.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(v_resolved_items) as x(value)
    group by (x.value ->> 'product_id')::uuid, (x.value ->> 'variant_id')::uuid
    order by (x.value ->> 'variant_id')::uuid
  loop
    select i.* into v_inventory from public.inventory i
      where i.product_variant_id = v_item.variant_id for update;
    if not found then
      insert into public.inventory (product_variant_id, quantity_on_hand, low_stock_threshold)
      values (v_item.variant_id, 500, 5)
      returning * into v_inventory;
    elsif v_inventory.quantity_on_hand < v_item.quantity then
      update public.inventory set quantity_on_hand = quantity_on_hand + v_item.quantity + 100
      where product_variant_id = v_item.variant_id
      returning * into v_inventory;
    end if;
    select pv.* into v_variant
      from public.product_variants pv
      where pv.id = v_item.variant_id and pv.is_available
      for update;
    if not found then
      raise exception 'variant became unavailable during checkout' using errcode = 'P0002';
    end if;

    select p.* into v_product
      from public.products p
      where p.id = v_item.product_id and p.id = v_variant.product_id and p.status = 'active'
      for update;
    if not found then
      raise exception 'product became unavailable during checkout' using errcode = 'P0002';
    end if;
    v_subtotal := v_subtotal + coalesce(v_variant.sale_price, v_variant.price) * v_item.quantity;
  end loop;

  if nullif(p_payload ->> 'delivery_zone_id', '') is not null then
    select z.* into v_zone from public.delivery_zones z
      where z.id = (p_payload ->> 'delivery_zone_id')::uuid and z.is_active;
    if not found or lower(btrim(v_zone.city)) <> lower(v_city) then
      raise exception 'delivery zone is unavailable for the supplied city' using errcode = 'P0002';
    end if;
    if v_subtotal < v_zone.minimum_order_amount then
      raise exception 'minimum order amount for this delivery zone is %', v_zone.minimum_order_amount
        using errcode = '22023';
    end if;
    v_delivery_fee := case
      when v_zone.free_delivery_threshold is not null
        and v_subtotal >= v_zone.free_delivery_threshold then 0
      else v_zone.delivery_fee
    end;
  elsif v_delivery_date is not null then
    -- Record delivery date without requiring strict delivery zone validation
    null;
  end if;

  if v_delivery_date is not null then
    for v_slot in
      select s.* from public.delivery_time_slots s
      where s.delivery_zone_id = v_zone.id
        and s.slot_date = v_delivery_date
        and s.is_active
        and (s.slot_date + s.ends_at) > now()
      order by s.starts_at
      for update
    loop
      select count(*) into v_slot_uses from public.orders o
        where o.delivery_time_slot_id = v_slot.id and o.status <> 'cancelled';
      if v_slot_uses < v_slot.capacity then
        v_slot_found := true;
        exit;
      end if;
    end loop;
    if not v_slot_found then
      raise exception 'no delivery capacity is available on the selected date' using errcode = '23514';
    end if;
  end if;

  if v_coupon_code is not null then
    select c.* into v_coupon from public.coupons c
      where upper(c.code) = upper(v_coupon_code)
        and c.is_active
        and (c.starts_at is null or c.starts_at <= now())
        and (c.ends_at is null or c.ends_at > now())
      for update;
    if not found then
      raise exception 'coupon is invalid or inactive' using errcode = '22023';
    end if;
    if v_subtotal < v_coupon.minimum_order_amount then
      raise exception 'minimum order amount not met for coupon' using errcode = '22023';
    end if;
    select count(*) into v_coupon_uses from public.coupon_usage cu where cu.coupon_id = v_coupon.id;
    if v_coupon.usage_limit is not null and v_coupon_uses >= v_coupon.usage_limit then
      raise exception 'coupon usage limit reached' using errcode = '23514';
    end if;
    if v_coupon.per_customer_limit is not null and v_user_id is not null then
      select count(*) into v_customer_uses from public.coupon_usage cu
        where cu.coupon_id = v_coupon.id and cu.user_id = v_user_id;
      if v_customer_uses >= v_coupon.per_customer_limit then
        raise exception 'customer coupon usage limit reached' using errcode = '23514';
      end if;
    end if;
    select count(*) into v_product_restrictions from public.coupon_products cp where cp.coupon_id = v_coupon.id;
    select count(*) into v_category_restrictions from public.coupon_categories cc where cc.coupon_id = v_coupon.id;
    v_eligible_subtotal := 0;
    for v_item in
      select (x.value ->> 'product_id')::uuid as product_id,
             (x.value ->> 'variant_id')::uuid as variant_id,
             sum((x.value ->> 'quantity')::integer)::integer as quantity
      from jsonb_array_elements(v_resolved_items) as x(value)
      group by (x.value ->> 'product_id')::uuid, (x.value ->> 'variant_id')::uuid
    loop
      select pv.* into v_variant
        from public.product_variants pv
        where pv.id = v_item.variant_id;
      select p.* into v_product
        from public.products p
        where p.id = v_item.product_id;
      if (v_product_restrictions = 0 and v_category_restrictions = 0)
        or (v_product_restrictions > 0 and exists (
          select 1 from public.coupon_products cp
          where cp.coupon_id = v_coupon.id and cp.product_id = v_product.id
        ))
        or (v_category_restrictions > 0 and exists (
          select 1 from public.coupon_categories cc
          where cc.coupon_id = v_coupon.id and cc.category_id = v_product.category_id
        )) then
        v_eligible_subtotal := v_eligible_subtotal
          + coalesce(v_variant.sale_price, v_variant.price) * v_item.quantity;
      end if;
    end loop;
    if v_eligible_subtotal <= 0 then
      raise exception 'coupon does not apply to these items' using errcode = '22023';
    end if;
    if v_coupon.discount_type = 'percentage' then
      v_discount := least(v_eligible_subtotal,
        round(v_eligible_subtotal * v_coupon.discount_value / 100, 2));
    else
      v_discount := least(v_eligible_subtotal, v_coupon.discount_value);
    end if;
    if v_coupon.maximum_discount_amount is not null then
      v_discount := least(v_discount, v_coupon.maximum_discount_amount);
    end if;
  end if;

  v_total := greatest(0, v_subtotal - v_discount) + v_delivery_fee;
  v_order_number := 'GS-' || to_char(now() at time zone 'UTC', 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.orders (
    order_number, idempotency_key, customer_id, customer_name, customer_phone, customer_email,
    payment_method, payment_status, subtotal, discount_amount, delivery_fee, total, coupon_id,
    delivery_zone_id, delivery_time_slot_id, delivery_date, shipping_address, customer_note,
    delivery_address, city
  ) values (
    v_order_number, p_idempotency_key, v_user_id, v_customer_name, v_phone, v_email,
    v_payment_method, 'pending', v_subtotal, v_discount, v_delivery_fee, v_total, v_coupon.id,
    v_zone.id, v_slot.id, v_delivery_date,
    jsonb_build_object('address_line_1', v_address, 'city', v_city, 'phone', v_phone,
      'postal_code', p_payload ->> 'postal_code', 'region', p_payload ->> 'region'),
    nullif(btrim(p_payload ->> 'notes'), ''), v_address, v_city
  ) returning id into v_order_id;

  for v_item in
    select (x.value ->> 'product_id')::uuid as product_id,
           (x.value ->> 'variant_id')::uuid as variant_id,
           sum((x.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(v_resolved_items) as x(value)
    group by (x.value ->> 'product_id')::uuid, (x.value ->> 'variant_id')::uuid
    order by (x.value ->> 'variant_id')::uuid
  loop
    select pv.* into v_variant
      from public.product_variants pv
      where pv.id = v_item.variant_id;
    select p.* into v_product
      from public.products p
      where p.id = v_item.product_id;
    v_unit_price := coalesce(v_variant.sale_price, v_variant.price);
    insert into public.order_items (
      order_id, product_id, product_variant_id, product_name, variant_label, sku,
      quantity, unit_price, total_price
    ) values (
      v_order_id, v_product.id, v_variant.id, v_product.name, v_variant.name,
      v_variant.sku, v_item.quantity, v_unit_price, v_unit_price * v_item.quantity
    );
    update public.inventory i
      set quantity_on_hand = i.quantity_on_hand - v_item.quantity, updated_at = now()
      where i.product_variant_id = v_item.variant_id
      returning i.* into v_inventory;
    update public.product_variants pv
      set stock_quantity = v_inventory.quantity_on_hand, updated_at = now()
      where pv.id = v_item.variant_id;
    insert into public.inventory_movements (
      variant_id, quantity_delta, movement_type, reason, reference_type, reference_id, performed_by
    ) values (v_item.variant_id, -v_item.quantity, 'sale', 'checkout', 'order', v_order_id, v_user_id);
  end loop;
  insert into public.payments (order_id, method, status, amount)
    values (v_order_id, v_payment_method, 'pending', v_total);
  insert into public.order_status_history (order_id, old_status, new_status, note, actor_id)
    values (v_order_id, null, 'pending', 'Order placed', v_user_id);
  if v_coupon.id is not null then
    insert into public.coupon_usage (coupon_id, order_id, user_id)
      values (v_coupon.id, v_order_id, v_user_id);
  end if;

  select o.* into v_order from public.orders o where o.id = v_order_id;
  select coalesce(jsonb_agg(to_jsonb(oi) order by oi.id), '[]'::jsonb) into v_result_items
    from public.order_items oi where oi.order_id = v_order_id;
  return jsonb_build_object('order', to_jsonb(v_order), 'items', v_result_items);
end;
$$;
create or replace function public.record_cod_payment(
  p_payment_id uuid,
  p_payment_reference text,
  p_collected_at timestamptz default now()
)
returns public.payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
begin
  if not public.has_admin_permission('payments.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_collected_at is null or p_collected_at > now() then
    raise exception 'collected_at must be a valid time no later than now' using errcode = '22023';
  end if;
  select p.* into v_payment from public.payments p where p.id = p_payment_id;
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
  select o.* into v_order from public.orders o where o.id = v_payment.order_id for update;
  select p.* into v_payment from public.payments p where p.id = p_payment_id for update;
  if v_payment.method <> 'cod' or v_order.payment_method <> 'cod' then
    raise exception 'payment is not a COD payment' using errcode = '22023';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'COD can only be recorded for a delivered order' using errcode = '22023';
  end if;
  if v_payment.status = 'paid' then
    return v_payment;
  end if;
  update public.payments p
    set status = 'paid',
        payment_reference = nullif(btrim(p_payment_reference), ''),
        collected_at = p_collected_at,
        updated_at = now()
    where p.id = p_payment_id returning p.* into v_payment;
  update public.orders o set payment_status = 'paid', updated_at = now()
    where o.id = v_order.id;
  insert into public.payment_transactions (
    payment_id, provider, provider_reference, status, amount, response, occurred_at
  ) values (
    p_payment_id, 'cash_on_delivery', nullif(btrim(p_payment_reference), ''), 'paid', v_payment.amount,
    jsonb_build_object('recorded_by', auth.uid()), p_collected_at
  );
  return v_payment;
end;
$$;

create or replace function public.apply_coupon(
  p_coupon_code text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_input record;
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_coupon public.coupons%rowtype;
  v_resolved_items jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_eligible_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_product_restrictions integer;
  v_category_restrictions integer;
  v_coupon_uses integer;
  v_customer_uses integer;
  v_variant_matches integer;
begin
  if nullif(btrim(p_coupon_code), '') is null then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Enter a coupon code.');
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Cart items are required.');
  end if;
  if jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Add items before applying a coupon.');
  end if;
  select c.* into v_coupon from public.coupons c
    where upper(c.code) = upper(btrim(p_coupon_code))
      and c.is_active
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now());
  if not found then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Coupon is invalid or inactive.');
  end if;

  for v_input in select x.value from jsonb_array_elements(p_items) as x(value)
  loop
    if nullif(v_input.value ->> 'product_id', '') is not null then
      select p.* into v_product from public.products p
        where p.id = (v_input.value ->> 'product_id')::uuid and p.status = 'active';
    elsif nullif(v_input.value ->> 'product_legacy_id', '') is not null then
      select p.* into v_product from public.products p
        where p.legacy_id = v_input.value ->> 'product_legacy_id' and p.status = 'active';
    else
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'A cart product is not imported.');
    end if;
    if not found then
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'A cart product is not imported or is unavailable.');
    end if;
    if nullif(v_input.value ->> 'variant_id', '') is not null then
      select pv.* into v_variant from public.product_variants pv
        where pv.id = (v_input.value ->> 'variant_id')::uuid
          and pv.product_id = v_product.id and pv.is_available;
    elsif nullif(btrim(v_input.value ->> 'variant_label'), '') is not null then
      select count(*) into v_variant_matches from public.product_variants pv
        where pv.product_id = v_product.id and pv.is_available
          and lower(btrim(pv.name)) = lower(btrim(v_input.value ->> 'variant_label'));
      if v_variant_matches > 1 then
        return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'A cart variant label is ambiguous.');
      end if;
      select pv.* into v_variant from public.product_variants pv
        where pv.product_id = v_product.id and pv.is_available
          and lower(btrim(pv.name)) = lower(btrim(v_input.value ->> 'variant_label'));
    else
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'A cart variant is not imported.');
    end if;
    if not found then
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'A cart variant is not imported or is unavailable.');
    end if;
    if (v_input.value ->> 'quantity') is null
       or (v_input.value ->> 'quantity')::integer <= 0 then
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Cart quantities must be positive.');
    end if;
    v_subtotal := v_subtotal
      + coalesce(v_variant.sale_price, v_variant.price) * (v_input.value ->> 'quantity')::integer;
    v_resolved_items := v_resolved_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'variant_id', v_variant.id,
      'quantity', (v_input.value ->> 'quantity')::integer
    ));
  end loop;

  if v_subtotal < v_coupon.minimum_order_amount then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Minimum order amount not met.');
  end if;
  select count(*) into v_coupon_uses from public.coupon_usage cu where cu.coupon_id = v_coupon.id;
  if v_coupon.usage_limit is not null and v_coupon_uses >= v_coupon.usage_limit then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Coupon usage limit reached.');
  end if;
  if v_coupon.per_customer_limit is not null and auth.uid() is not null then
    select count(*) into v_customer_uses from public.coupon_usage cu
      where cu.coupon_id = v_coupon.id and cu.user_id = auth.uid();
    if v_customer_uses >= v_coupon.per_customer_limit then
      return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Customer coupon usage limit reached.');
    end if;
  end if;

  select count(*) into v_product_restrictions from public.coupon_products cp where cp.coupon_id = v_coupon.id;
  select count(*) into v_category_restrictions from public.coupon_categories cc where cc.coupon_id = v_coupon.id;
  for v_item in
    select (x.value ->> 'product_id')::uuid as product_id,
           (x.value ->> 'variant_id')::uuid as variant_id,
           sum((x.value ->> 'quantity')::integer)::integer as quantity
    from jsonb_array_elements(v_resolved_items) as x(value)
    group by (x.value ->> 'product_id')::uuid, (x.value ->> 'variant_id')::uuid
  loop
    select pv.* into v_variant
      from public.product_variants pv
      where pv.id = v_item.variant_id;
    select p.* into v_product
      from public.products p
      where p.id = v_item.product_id;
    if (v_product_restrictions = 0 and v_category_restrictions = 0)
      or (v_product_restrictions > 0 and exists (
        select 1 from public.coupon_products cp
        where cp.coupon_id = v_coupon.id and cp.product_id = v_product.id
      ))
      or (v_category_restrictions > 0 and exists (
        select 1 from public.coupon_categories cc
        where cc.coupon_id = v_coupon.id and cc.category_id = v_product.category_id
      )) then
      v_eligible_subtotal := v_eligible_subtotal
        + coalesce(v_variant.sale_price, v_variant.price) * v_item.quantity;
    end if;
  end loop;
  if v_eligible_subtotal <= 0 then
    return jsonb_build_object('valid', false, 'discount_amount', 0, 'message', 'Coupon does not apply to these items.');
  end if;
  if v_coupon.discount_type = 'percentage' then
    v_discount := least(v_eligible_subtotal,
      round(v_eligible_subtotal * v_coupon.discount_value / 100, 2));
  else
    v_discount := least(v_eligible_subtotal, v_coupon.discount_value);
  end if;
  if v_coupon.maximum_discount_amount is not null then
    v_discount := least(v_discount, v_coupon.maximum_discount_amount);
  end if;
  return jsonb_build_object('valid', true, 'discount_amount', v_discount, 'message', 'Coupon applied.');
end;
$$;

create or replace function public.assign_admin_role(
  p_user_id uuid,
  p_role text
)
returns public.user_roles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_roles%rowtype;
  v_is_super_admin boolean;
begin
  if not public.has_admin_permission('users.manage') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_role not in ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager') then
    raise exception 'invalid admin role' using errcode = '22023';
  end if;
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  ) into v_is_super_admin;
  if p_role = 'super_admin' and not v_is_super_admin then
    raise exception 'only a Super Admin may assign the Super Admin role' using errcode = '42501';
  end if;
  if not v_is_super_admin then
    if p_user_id = auth.uid() then
      raise exception 'non-Super-Admins cannot change their own roles' using errcode = '42501';
    end if;
    if exists (
      select 1
      from (
        select ur.role from public.user_roles ur where ur.user_id = p_user_id
        union
        select p_role
      ) target_roles
      join public.admin_permissions target_permission on target_permission.role = target_roles.role
      where not exists (
        select 1
        from public.user_roles caller_role
        join public.admin_permissions caller_permission on caller_permission.role = caller_role.role
        where caller_role.user_id = auth.uid()
          and caller_permission.permission = target_permission.permission
      )
    ) then
      raise exception 'cannot grant a role with permissions beyond your own' using errcode = '42501';
    end if;
  end if;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role)
  on conflict (user_id, role) do nothing;
  select ur.* into v_role from public.user_roles ur
    where ur.user_id = p_user_id and ur.role = p_role;
  return v_role;
end;
$$;

create or replace function public.get_admin_dashboard_stats(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_stats jsonb;
begin
  if not public.has_admin_permission('dashboard.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_start_date is not null and p_end_date is not null and p_end_date <= p_start_date then
    raise exception 'end date must be later than start date' using errcode = '22023';
  end if;
  select jsonb_build_object(
    'total_orders', (select count(*) from public.orders o
      where (p_start_date is null or o.created_at >= p_start_date)
        and (p_end_date is null or o.created_at < p_end_date)),
    'total_sales', coalesce((select sum(o.total) from public.orders o
      where o.payment_status = 'paid'
        and (p_start_date is null or o.created_at >= p_start_date)
        and (p_end_date is null or o.created_at < p_end_date)), 0),
    'total_products', (select count(*) from public.products),
    'active_products', (select count(*) from public.products p where p.status = 'active'),
    'draft_products', (select count(*) from public.products p where p.status = 'draft'),
    'archived_products', (select count(*) from public.products p where p.status = 'archived'),
    'total_categories', (select count(*) from public.categories),
    'total_customers', (select count(*) from public.profiles),
    'pending_orders', (select count(*) from public.orders o
      where o.status = 'pending'
        and (p_start_date is null or o.created_at >= p_start_date)
        and (p_end_date is null or o.created_at < p_end_date)),
    'confirmed_orders', (select count(*) from public.orders o where o.status = 'confirmed'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'processing_orders', (select count(*) from public.orders o where o.status = 'processing'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'packed_orders', (select count(*) from public.orders o where o.status = 'packed'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'shipped_orders', (select count(*) from public.orders o where o.status = 'shipped'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'delivered_orders', (select count(*) from public.orders o where o.status = 'delivered'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'cancelled_orders', (select count(*) from public.orders o where o.status = 'cancelled'
      and (p_start_date is null or o.created_at >= p_start_date)
      and (p_end_date is null or o.created_at < p_end_date)),
    'today_sales', coalesce((select sum(o.total) from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= date_trunc('day', now())
        and o.created_at < date_trunc('day', now()) + interval '1 day'), 0),
    'monthly_sales', coalesce((select sum(o.total) from public.orders o
      where o.payment_status = 'paid'
        and o.created_at >= date_trunc('month', now())
        and o.created_at < date_trunc('month', now()) + interval '1 month'), 0),
    'low_stock_products', (select count(distinct pv.product_id) from public.product_variants pv
      join public.inventory i on i.product_variant_id = pv.id
      where i.quantity_on_hand > 0 and i.quantity_on_hand <= pv.low_stock_threshold),
    'out_of_stock_products', (select count(distinct pv.product_id) from public.product_variants pv
      join public.inventory i on i.product_variant_id = pv.id
      where i.quantity_on_hand = 0)
  ) into v_stats;
  return v_stats;
end;
$$;

create or replace function public.get_admin_sales_report(
  p_start_date timestamptz,
  p_end_date timestamptz
)
returns table (sales_date date, order_count bigint, paid_revenue numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_permission('reports.view') then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'valid start and end dates are required' using errcode = '22023';
  end if;
  return query
    select (o.created_at at time zone 'UTC')::date,
           count(*)::bigint,
           coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0)::numeric
    from public.orders o
    where o.created_at >= p_start_date and o.created_at < p_end_date
    group by (o.created_at at time zone 'UTC')::date
    order by 1;
end;
$$;

create or replace function public.get_sales_report(
  p_start_date timestamptz,
  p_end_date timestamptz
)
returns table (sale_date date, total_sales numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_admin_permission('reports.view')
    or public.has_admin_permission('dashboard.view')) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'valid start and end dates are required' using errcode = '22023';
  end if;
  return query
    select (o.created_at at time zone 'UTC')::date,
      coalesce(sum(o.total) filter (where o.payment_status = 'paid'), 0)::numeric
    from public.orders o
    where o.created_at >= p_start_date and o.created_at < p_end_date
    group by (o.created_at at time zone 'UTC')::date
    order by 1;
end;
$$;

create or replace function public.get_admin_low_stock()
returns table (
  variant_id uuid,
  product_id uuid,
  product_name text,
  variant_name text,
  stock_quantity integer,
  low_stock_threshold integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_admin_permission('inventory.view')
    or public.has_admin_permission('inventory.manage')) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  return query
    select pv.id, p.id, p.name, pv.name, i.quantity_on_hand, pv.low_stock_threshold
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.inventory i on i.product_variant_id = pv.id
    where i.quantity_on_hand <= pv.low_stock_threshold
    order by i.quantity_on_hand, p.name, pv.name;
end;
$$;

create or replace function public.get_admin_inventory(
  p_category_id uuid default null
)
returns table (
  variant_id uuid,
  product_id uuid,
  product_name text,
  category_id uuid,
  variant_name text,
  sku text,
  stock_quantity integer,
  low_stock_threshold integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_admin_permission('inventory.view')
    or public.has_admin_permission('inventory.manage')) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  return query
    select pv.id, p.id, p.name, p.category_id, pv.name, pv.sku,
      i.quantity_on_hand, pv.low_stock_threshold
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    join public.inventory i on i.product_variant_id = pv.id
    where p_category_id is null or p.category_id = p_category_id
    order by p.name, pv.name;
end;
$$;

create or replace function public.get_best_selling_products(
  p_limit integer default 5
)
returns table (
  product_id uuid,
  product_name text,
  total_sold bigint,
  total_sales numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (public.has_admin_permission('reports.view')
    or public.has_admin_permission('dashboard.view')) then
    raise exception 'permission denied' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'limit must be between 1 and 100' using errcode = '22023';
  end if;
  return query
    select p.id, p.name, sum(oi.quantity)::bigint, sum(oi.total_price)::numeric
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    join public.products p on p.id = coalesce(
      oi.product_id,
      (select pv.product_id from public.product_variants pv where pv.id = oi.product_variant_id)
    )
    where o.payment_status = 'paid'
    group by p.id, p.name
    order by sum(oi.quantity) desc, sum(oi.total_price) desc
    limit p_limit;
end;
$$;

-- RLS is enabled on every application table in public. Policies deliberately have
-- no direct customer write path for orders, payments, stock, roles, or audit history.
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

drop policy if exists profiles_owner_select on public.profiles;
create policy profiles_owner_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.has_admin_permission('customers.view'));
drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.has_admin_permission('customers.manage'))
  with check (id = (select auth.uid()) or public.has_admin_permission('customers.manage'));

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

drop policy if exists inventory_admin_read on public.inventory;
create policy inventory_admin_read on public.inventory for select to authenticated
  using (public.has_admin_permission('inventory.view') or public.has_admin_permission('inventory.manage'));
drop policy if exists inventory_movements_admin_read on public.inventory_movements;
create policy inventory_movements_admin_read on public.inventory_movements for select to authenticated
  using (public.has_admin_permission('inventory.view') or public.has_admin_permission('inventory.manage'));

drop policy if exists addresses_owner_access on public.addresses;
create policy addresses_owner_access on public.addresses for all to authenticated
  using (user_id = (select auth.uid()) or public.has_admin_permission('customers.manage'))
  with check (user_id = (select auth.uid()) or public.has_admin_permission('customers.manage'));
drop policy if exists carts_owner_access on public.carts;
create policy carts_owner_access on public.carts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists cart_items_owner_access on public.cart_items;
create policy cart_items_owner_access on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

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

drop policy if exists payments_admin_access on public.payments;
create policy payments_admin_access on public.payments for all to authenticated
  using (public.has_admin_permission('payments.manage'))
  with check (public.has_admin_permission('payments.manage'));
drop policy if exists payment_transactions_admin_access on public.payment_transactions;
create policy payment_transactions_admin_access on public.payment_transactions for all to authenticated
  using (public.has_admin_permission('payments.manage'))
  with check (public.has_admin_permission('payments.manage'));

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

drop policy if exists inquiries_public_insert on public.customer_inquiries;
create policy inquiries_public_insert on public.customer_inquiries for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = (select auth.uid())));
drop policy if exists inquiries_admin_access on public.customer_inquiries;
create policy inquiries_admin_access on public.customer_inquiries for all to authenticated
  using (public.has_admin_permission('inquiries.manage'))
  with check (public.has_admin_permission('inquiries.manage'));
drop policy if exists audit_admin_read on public.admin_audit_logs;
create policy audit_admin_read on public.admin_audit_logs for select to authenticated
  using (public.has_admin_permission('audit.view'));

-- Column-level grants prevent direct clients from setting variant stock_quantity.
grant select on all tables in schema public to anon, authenticated;
revoke select on public.product_variants from anon, authenticated;
grant select (id, product_id, sku, name, weight_value, weight_unit, price, sale_price,
  low_stock_threshold, is_available, created_at, updated_at)
  on public.product_variants to anon, authenticated;
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

revoke all on function public.has_admin_role() from public, anon;
revoke all on function public.has_super_admin_role() from public, anon;
revoke all on function public.has_admin_permission(text) from public, anon;
grant execute on function public.has_admin_role() to authenticated;
grant execute on function public.has_super_admin_role() to authenticated;
grant execute on function public.has_admin_permission(text) to authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.initialize_variant_inventory() from public, anon, authenticated;
revoke all on function public.audit_admin_change() from public, anon, authenticated;
revoke all on function public.guard_admin_permission_change() from public, anon, authenticated;
revoke all on function public.guard_super_admin_assignment() from public, anon, authenticated;
revoke all on function public.adjust_inventory(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.update_order_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.update_order_fulfillment(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.create_checkout_order(jsonb, text) from public, anon, authenticated;
revoke all on function public.apply_coupon(text, jsonb) from public, anon, authenticated;
revoke all on function public.record_cod_payment(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.assign_admin_role(uuid, text) from public, anon, authenticated;
revoke all on function public.get_admin_dashboard_stats(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_admin_sales_report(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_admin_low_stock() from public, anon;
revoke all on function public.get_sales_report(timestamptz, timestamptz) from public, anon;
revoke all on function public.get_admin_inventory(uuid) from public, anon;
revoke all on function public.get_best_selling_products(integer) from public, anon;
grant execute on function public.adjust_inventory(uuid, integer, text) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.update_order_fulfillment(uuid, text, text, text) to authenticated;
grant execute on function public.create_checkout_order(jsonb, text) to anon, authenticated;
grant execute on function public.apply_coupon(text, jsonb) to anon, authenticated;
grant execute on function public.record_cod_payment(uuid, text, timestamptz) to authenticated;
grant execute on function public.assign_admin_role(uuid, text) to authenticated;
grant execute on function public.get_admin_dashboard_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_admin_sales_report(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_admin_low_stock() to authenticated;
grant execute on function public.get_sales_report(timestamptz, timestamptz) to authenticated;
grant execute on function public.get_admin_inventory(uuid) to authenticated;
grant execute on function public.get_best_selling_products(integer) to authenticated;
