-- Migration 016: Database Constraints and Performance Indexes
-- Gulfam Sweets & Dairy e-Commerce Platform

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_coupon_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_coupon_id_fkey
      foreign key (coupon_id) references public.coupons(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_zone_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_delivery_zone_id_fkey
      foreign key (delivery_zone_id) references public.delivery_zones(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_time_slot_id_fkey' and conrelid = 'public.orders'::regclass) then
    alter table public.orders add constraint orders_delivery_time_slot_id_fkey
      foreign key (delivery_time_slot_id) references public.delivery_time_slots(id) on delete set null;
  end if;
end;
$$;

create index if not exists products_category_status_idx on public.products(category_id, status);
create index if not exists products_food_type_status_idx on public.products(food_type, status);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order);
create index if not exists variants_product_idx on public.product_variants(product_id);
create index if not exists inventory_movements_variant_created_idx on public.inventory_movements(variant_id, created_at desc);
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists coupon_usage_coupon_user_idx on public.coupon_usage(coupon_id, user_id);
create index if not exists reviews_product_status_idx on public.product_reviews(product_id, status);
create index if not exists inquiries_status_created_idx on public.customer_inquiries(status, created_at desc);
create index if not exists audit_logs_created_idx on public.admin_audit_logs(created_at desc);
