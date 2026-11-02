# Supabase Database Functions & Architecture

This directory outlines the server-side architecture and PostgreSQL stored procedures (`SECURITY DEFINER` functions) that execute all critical business logic for **Gulfam Sweets & Dairy**.

Client applications (Storefront and Admin Panel) never perform direct writes on financial or inventory records. All sensitive mutations are wrapped in atomic database functions with Row-Level Security (RLS) enforcement and role-based permissions.

---

## 1. Security Architecture & RBAC

Every administrative function verifies user permissions using `public.has_admin_permission(p_permission text)`:

```sql
select public.has_admin_permission('orders.manage');
```

- **`super_admin`**: Automatically bypasses all permission checks. Can assign roles and alter permissions.
- **`admin`**: Full operational store access (products, orders, customers, inventory, payments, settings, reports).
- **`manager`**: Store operations access excluding sensitive system settings and role assignments.
- **`inventory_manager`**: Stock levels, inventory movements, product catalog, and media management.
- **`order_manager`**: Customer orders, fulfillment tracking, payments verification, and customer inquiries.

---

## 2. Core RPC Functions Reference

### `create_checkout_order(p_payload jsonb, p_idempotency_key text) -> jsonb`
- **Caller:** Storefront checkout (Guest or Authenticated user).
- **Behavior:**
  1. Enforces idempotency via `p_idempotency_key`. Repeated submissions return the existing order without duplicate charging or stock deductions.
  2. Resolves actual item prices, names, and SKUs from `public.products` and `public.product_variants`. Client-provided prices are completely discarded.
  3. Verifies and reserves inventory atomically with `FOR UPDATE` row locks.
  4. Validates coupon code eligibility (date validity, minimum order threshold, usage limits, category and product restrictions) and computes the exact discount.
  5. Computes delivery fee based on delivery zone rules and free shipping thresholds.
  6. Inserts `orders`, `order_items`, `payments`, and `coupon_usage` records within a single transaction.
  7. Clears the user's persisted database cart if authenticated.

---

### `adjust_inventory(p_variant_id uuid, p_quantity_delta integer, p_reason text)`
- **Caller:** Admin Panel (`/admin/inventory`).
- **Permission Required:** `inventory.manage`.
- **Behavior:**
  1. Validates that `p_quantity_delta` is not zero and `p_reason` is non-empty.
  2. Locks variant inventory row with `FOR UPDATE`.
  3. Enforces non-negative constraint (`quantity_on_hand + p_quantity_delta >= 0`).
  4. Updates `public.inventory` and mirrors `public.product_variants.stock_quantity`.
  5. Appends an audited record to `public.inventory_movements` with `performed_by = auth.uid()`.

---

### `update_order_status(p_order_id uuid, p_status text, p_internal_note text default null)`
- **Caller:** Admin Panel (`/admin/orders`).
- **Permission Required:** `orders.manage`.
- **Behavior:**
  1. Enforces strict state machine transitions:
     - `pending` ➔ `confirmed` | `cancelled`
     - `confirmed` ➔ `processing` | `cancelled`
     - `processing` ➔ `packed` | `cancelled`
     - `packed` ➔ `shipped` | `cancelled`
     - `shipped` ➔ `delivered` | `returned`
     - `delivered` ➔ `returned` | `refunded`
     - `returned` ➔ `refunded`
  2. If status transitions to `cancelled`, reserved stock is automatically refunded back to inventory and logged in `inventory_movements`.
  3. Appends an event to `public.order_status_history`.
  4. Updates payment status to `refunded` when status reaches `refunded`.

---

### `update_order_fulfillment(p_order_id uuid, p_courier_name text, p_tracking_number text, p_internal_notes text)`
- **Caller:** Admin Panel (`/admin/orders` details modal).
- **Permission Required:** `orders.manage`.
- **Behavior:**
  - Safely updates courier details, tracking number, and appends internal operator notes.

---

### `record_cod_payment(p_payment_id uuid, p_payment_reference text, p_collected_at timestamptz)`
- **Caller:** Admin Panel (`/admin/payments`).
- **Permission Required:** `payments.manage`.
- **Behavior:**
  1. Validates payment record and verifies it is a pending Cash on Delivery (`cod`) payment.
  2. Sets payment status to `paid`, records collection timestamp, reference/receipt number, and logs transaction.
  3. Updates associated order's `payment_status` to `paid`.

---

### `apply_coupon(p_code text, p_cart_items jsonb) -> jsonb`
- **Caller:** Storefront checkout and Cart Drawer.
- **Behavior:**
  - Validates coupon code validity, dates, minimum spend, and eligible items without placing an order. Returns calculated discount amount and status.

---

### `get_admin_dashboard_stats(p_start_date timestamptz, p_end_date timestamptz) -> jsonb`
- **Caller:** Admin Panel (`/admin` Dashboard Overview).
- **Permission Required:** `dashboard.view`.
- **Behavior:**
  - Aggregates counts of products, active products, categories, customers, orders by status, total sales, today's sales, monthly sales, low stock count, and out of stock count in one fast query.

---

### `get_sales_report(p_start_date timestamptz, p_end_date timestamptz) -> table`
- **Caller:** Admin Panel (`/admin` and `/admin/reports`).
- **Permission Required:** `dashboard.view`.
- **Behavior:**
  - Aggregates daily sales totals, order counts, delivery fees collected, and discounts redeemed for the requested period.

---

### `assign_admin_role(p_user_id uuid, p_role text)`
- **Caller:** Admin Panel (`/admin/team`).
- **Permission Required:** `super_admin` role.
- **Behavior:**
  - Assigns or alters an administrative role for a user account with strict privilege checks.
