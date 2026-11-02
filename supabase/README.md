# Gulfam Sweets — Supabase SQL Database & Backend

This repository contains the complete, production-ready, forward-only PostgreSQL schema and backend logic for **Gulfam Sweets & Dairy**.

All mutations to critical financial, order, and stock records are guarded by PostgreSQL `SECURITY DEFINER` stored procedures and protected by Row-Level Security (RLS) across all 29 database tables.

---

## Directory Structure

```
supabase/
├── migrations/
│   ├── 001_profiles_and_admin_roles.sql
│   ├── 002_categories_and_products.sql
│   ├── 003_product_images_and_variants.sql
│   ├── 004_inventory_and_stock_movements.sql
│   ├── 005_customer_addresses.sql
│   ├── 006_cart_and_cart_items.sql
│   ├── 007_orders_and_order_items.sql
│   ├── 008_order_status_history.sql
│   ├── 009_coupons_and_coupon_usage.sql
│   ├── 010_delivery_zones_and_settings.sql
│   ├── 011_payments_and_payment_records.sql
│   ├── 012_product_reviews.sql
│   ├── 013_banners_and_promotions.sql
│   ├── 014_customer_inquiries.sql
│   ├── 015_admin_permissions_and_audit_logs.sql
│   ├── 016_database_indexes_and_constraints.sql
│   ├── 017_rls_policies.sql
│   ├── 018_storage_policies.sql
│   ├── 019_database_functions_and_triggers.sql
│   └── 020_seed_default_categories.sql
├── seed/
│   └── seed.sql
├── functions/
│   └── README.md
└── README.md
```

---

## 20 Discrete Database Migrations

Apply these migrations sequentially in numeric order:

1. **`001_profiles_and_admin_roles.sql`**: Creates `profiles`, `user_roles`, and `admin_permissions` tables with check constraints.
2. **`002_categories_and_products.sql`**: Creates `categories` (taxonomy) and `products` (catalog with slug uniqueness, `food_type`, prices, and status).
3. **`003_product_images_and_variants.sql`**: Creates `product_images` (storage references) and `product_variants` (SKU, weights, prices, availability).
4. **`004_inventory_and_stock_movements.sql`**: Creates `inventory` (canonical stock on hand) and `inventory_movements` (audited ledger of stock changes).
5. **`005_customer_addresses.sql`**: Creates `addresses` for customer delivery destinations in Pakistan.
6. **`006_cart_and_cart_items.sql`**: Creates customer database shopping carts and line items.
7. **`007_orders_and_order_items.sql`**: Creates `orders` (idempotent numbers, status, payment method, delivery details) and `order_items` (immutable line snapshots).
8. **`008_order_status_history.sql`**: Creates `order_status_history` tracking operator updates and status transitions.
9. **`009_coupons_and_coupon_usage.sql`**: Creates `coupons`, `coupon_products`, `coupon_categories`, and `coupon_usage` redemption tracking.
10. **`010_delivery_zones_and_settings.sql`**: Creates `delivery_zones`, `delivery_time_slots`, and `store_settings`.
11. **`011_payments_and_payment_records.sql`**: Creates `payments` (COD, bank transfer, Raast) and `payment_transactions`.
12. **`012_product_reviews.sql`**: Creates `product_reviews` with moderation states (`pending`, `approved`, `rejected`).
13. **`013_banners_and_promotions.sql`**: Creates `banners` (hero sliders and promos) and `promotions`.
14. **`014_customer_inquiries.sql`**: Creates `customer_inquiries` for storefront contact submissions.
15. **`015_admin_permissions_and_audit_logs.sql`**: Creates `admin_audit_logs` and seeds default role-to-permission grants.
16. **`016_database_indexes_and_constraints.sql`**: Enforces foreign keys and high-performance B-tree indexes across all foreign keys and search columns.
17. **`017_rls_policies.sql`**: Enables and enforces Row-Level Security across all 29 tables with granular select/update/delete restrictions.
18. **`018_storage_policies.sql`**: Creates storage buckets (`product-images`, `banner-images`, `category-images`, `customer-uploads`) and storage access policies.
19. **`019_database_functions_and_triggers.sql`**: Implements all 17 atomic database functions (`create_checkout_order`, `adjust_inventory`, `update_order_status`, `record_cod_payment`, etc.) and security triggers.
20. **`020_seed_default_categories.sql`**: Idempotently seeds the 8 official Gulfam Sweets business categories.

---

## Bootstrapping Your First Super Admin

To grant Super Admin access to your account:

1. Sign up on the storefront with your email address (or create an account at `/create-account`).
2. Go to your **Supabase Dashboard ➔ SQL Editor** and run:

```sql
insert into public.user_roles (user_id, role)
values (
  (select id from auth.users where email = 'your-email@example.com'),
  'super_admin'
)
on conflict (user_id, role) do nothing;
```

3. Navigate to `http://localhost:5173/admin`. The system verifies the role via `has_admin_permission` RPC and provides full administrative access.

---

## Security Guarantees

- **No Client Price Tampering**: `create_checkout_order` recalculates all line totals and discount values from database rows. Client submitted totals are discarded.
- **Negative Stock Prevention**: Inventory adjustment rejects any update that would take stock below zero (`quantity_on_hand + delta >= 0`).
- **Audited History**: Every status update, inventory change, and COD collection logs the actor UUID (`auth.uid()`) and timestamp in dedicated ledger tables.
