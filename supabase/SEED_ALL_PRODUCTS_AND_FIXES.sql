-- ==============================================================================
-- GULFAM SWEETS & DAIRY — MASTER REPAIR, PERMISSIONS & COMPLETE PRODUCT SEED
-- ==============================================================================
-- Run this script in the Supabase SQL Editor.
-- This script is 100% idempotent and self-contained:
-- 1. Creates missing permission check functions first (fixes ERROR 42883)
-- 2. Creates missing tables and adds all columns to products, variants, orders, etc. (fixes ERROR 42703: column "sku" does not exist)
-- 3. Grants all table permissions to authenticated users (fixes ERROR "permission denied for table product_variants")
-- 4. Replaces get_best_selling_products RPC (fixes ERROR "column oi.product_id does not exist")
-- 5. Seeds all 8 categories and all 28 authentic products, variants, images, and inventory
-- 6. Seeds all 4 store settings (Store Info, Checkout Rules, Currency, Delivery Policy)
-- 7. Seeds default delivery zones
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEFINE ADMINISTRATIVE PERMISSION FUNCTIONS FIRST (Fixes ERROR 42883)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_super_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.admin_permissions ap ON ap.role = ur.role
      WHERE ur.user_id = auth.uid()
        AND ap.permission = p_permission
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_super_admin_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_permission(text) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. COMPLETE SCHEMA & COLUMN GUARANTEES (Fixes ERROR 42703: column does not exist)
-- ------------------------------------------------------------------------------

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Products (Guarantees sku, food_type, base_price, legacy_id, etc. exist)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  food_type text NOT NULL DEFAULT 'ambient',
  legacy_id text,
  sku text,
  image_url text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2),
  is_featured boolean NOT NULL DEFAULT false,
  ingredients text,
  storage_instructions text,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS food_type text NOT NULL DEFAULT 'ambient',
  ADD COLUMN IF NOT EXISTS legacy_id text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS base_price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ingredients text,
  ADD COLUMN IF NOT EXISTS storage_instructions text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku text,
  name text NOT NULL,
  weight_value numeric(10,3),
  weight_unit text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2),
  stock_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS weight_value numeric(10,3),
  ADD COLUMN IF NOT EXISTS weight_unit text,
  ADD COLUMN IF NOT EXISTS price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sale_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text,
  public_url text,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS public_url text,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.product_images ALTER COLUMN storage_path DROP NOT NULL;

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity_on_hand integer NOT NULL DEFAULT 0,
  quantity_reserved integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS quantity_on_hand integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_reserved integer NOT NULL DEFAULT 0;

-- Orders & Order Items
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text,
  customer_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  delivery_address text,
  city text,
  delivery_notes text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cod',
  payment_status text DEFAULT 'pending',
  status text DEFAULT 'pending',
  courier_name text,
  tracking_number text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS delivery_notes text,
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS courier_name text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text,
  variant_name text,
  variant_label text,
  sku text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS variant_name text,
  ADD COLUMN IF NOT EXISTS variant_label text,
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit_price numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price numeric(12,2) NOT NULL DEFAULT 0;

-- Delivery Zones
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  region text,
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  free_delivery_threshold numeric(12,2),
  minimum_order_amount numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_zones 
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric(12,2),
  ADD COLUMN IF NOT EXISTS minimum_order_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Store Settings
CREATE TABLE IF NOT EXISTS public.store_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS key text,
  ADD COLUMN IF NOT EXISTS value jsonb,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

ALTER TABLE public.admin_permissions DROP CONSTRAINT IF EXISTS admin_permissions_role_check;
ALTER TABLE public.admin_permissions ADD CONSTRAINT admin_permissions_role_check
  CHECK (role IN ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager'));

-- Safe Unique Constraints (Guarantees ON CONFLICT clauses succeed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key') THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_sku_key') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_product_variant_id_key') THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_variant_id_key UNIQUE (product_variant_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. PERMISSIONS & RLS GRANTS (Fixes "permission denied for table product_variants")
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Explicit Table Grants (Overrides any previous revoke)
GRANT ALL ON TABLE public.product_variants TO authenticated, service_role;
GRANT SELECT ON TABLE public.product_variants TO anon;
GRANT ALL ON TABLE public.products TO authenticated, service_role;
GRANT SELECT ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.categories TO authenticated, service_role;
GRANT SELECT ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.product_images TO authenticated, service_role;
GRANT SELECT ON TABLE public.product_images TO anon;
GRANT ALL ON TABLE public.inventory TO authenticated, service_role;
GRANT SELECT ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.orders TO authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO authenticated, service_role;
GRANT ALL ON TABLE public.delivery_zones TO authenticated, service_role;
GRANT SELECT ON TABLE public.delivery_zones TO anon;
GRANT ALL ON TABLE public.store_settings TO authenticated, service_role;
GRANT SELECT ON TABLE public.store_settings TO anon;
GRANT ALL ON TABLE public.user_roles TO authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO authenticated, service_role;

-- Product Variants RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_variants_read_all ON public.product_variants;
DROP POLICY IF EXISTS product_variants_admin_all ON public.product_variants;
DROP POLICY IF EXISTS product_variants_public_read ON public.product_variants;
DROP POLICY IF EXISTS product_variants_public_read_anon ON public.product_variants;
DROP POLICY IF EXISTS product_variants_public_read_authenticated ON public.product_variants;
DROP POLICY IF EXISTS product_variants_admin_write ON public.product_variants;

CREATE POLICY product_variants_read_all ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY product_variants_admin_all ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_read_all ON public.products;
DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_read_all ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY products_admin_all ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Categories RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_read_all ON public.categories;
DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_read_all ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_admin_all ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Images RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_images_read_all ON public.product_images;
DROP POLICY IF EXISTS product_images_admin_all ON public.product_images;
CREATE POLICY product_images_read_all ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY product_images_admin_all ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inventory_admin_all ON public.inventory;
DROP POLICY IF EXISTS inventory_anon_select ON public.inventory;
CREATE POLICY inventory_admin_all ON public.inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY inventory_anon_select ON public.inventory FOR SELECT TO anon USING (true);

-- Delivery Zones RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS delivery_zones_read_all ON public.delivery_zones;
DROP POLICY IF EXISTS delivery_zones_admin_all ON public.delivery_zones;
CREATE POLICY delivery_zones_read_all ON public.delivery_zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY delivery_zones_admin_all ON public.delivery_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Store Settings RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_settings_read_all ON public.store_settings;
DROP POLICY IF EXISTS store_settings_admin_all ON public.store_settings;
CREATE POLICY store_settings_read_all ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY store_settings_admin_all ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Roles RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_roles_self_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_self_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.has_admin_role());
CREATE POLICY user_roles_admin_all ON public.user_roles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. DASHBOARD STATS & RPC FIXES (Eliminates "column oi.product_id does not exist")
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_best_selling_products(p_limit integer default 5)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  total_sold bigint,
  total_sales numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 100 THEN
    p_limit := 5;
  END IF;

  RETURN QUERY
    SELECT
      COALESCE(pv.product_id, p.id) as product_id,
      COALESCE(oi.product_name, p.name, 'Product')::text as product_name,
      COALESCE(SUM(oi.quantity), 0)::bigint as total_sold,
      COALESCE(SUM(oi.total_price), 0)::numeric as total_sales
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.product_variants pv ON pv.id = oi.product_variant_id
    LEFT JOIN public.products p ON p.id = pv.product_id
    WHERE o.payment_status = 'paid' OR o.status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered')
    GROUP BY COALESCE(pv.product_id, p.id), COALESCE(oi.product_name, p.name, 'Product')
    ORDER BY SUM(oi.quantity) DESC, SUM(oi.total_price) DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_best_selling_products(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_top_selling_products(p_limit integer default 10)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  total_sold bigint,
  total_sales numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT
      COALESCE(pv.product_id, p.id) AS product_id,
      COALESCE(oi.product_name, p.name, 'Product')::text AS product_name,
      COALESCE(sum(oi.quantity), 0)::bigint AS total_sold,
      COALESCE(sum(oi.total_price), 0)::numeric AS total_sales
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    LEFT JOIN public.product_variants pv ON pv.id = oi.product_variant_id
    LEFT JOIN public.products p ON p.id = pv.product_id
    WHERE o.status != 'cancelled'
    GROUP BY COALESCE(pv.product_id, p.id), COALESCE(oi.product_name, p.name, 'Product')
    ORDER BY total_sold DESC, total_sales DESC
    LIMIT COALESCE(p_limit, 10);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_top_selling_products(integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders', (SELECT count(*) FROM public.orders o
      WHERE (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'total_sales', COALESCE((SELECT sum(o.total) FROM public.orders o
      WHERE o.status != 'cancelled'
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at < p_end_date)), 0),
    'total_products', (SELECT count(*) FROM public.products),
    'active_products', (SELECT count(*) FROM public.products p WHERE p.status = 'active'),
    'draft_products', (SELECT count(*) FROM public.products p WHERE p.status = 'draft'),
    'archived_products', (SELECT count(*) FROM public.products p WHERE p.status = 'archived'),
    'total_categories', (SELECT count(*) FROM public.categories),
    'total_customers', (SELECT count(*) FROM public.profiles),
    'pending_orders', (SELECT count(*) FROM public.orders o
      WHERE o.status = 'pending'
        AND (p_start_date IS NULL OR o.created_at >= p_start_date)
        AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'confirmed_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'confirmed'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'processing_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'processing'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'packed_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'packed'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'shipped_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'shipped'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'delivered_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'delivered'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'cancelled_orders', (SELECT count(*) FROM public.orders o WHERE o.status = 'cancelled'
      AND (p_start_date IS NULL OR o.created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.created_at < p_end_date)),
    'today_sales', COALESCE((SELECT sum(o.total) FROM public.orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= date_trunc('day', now())), 0),
    'monthly_sales', COALESCE((SELECT sum(o.total) FROM public.orders o
      WHERE o.status != 'cancelled'
        AND o.created_at >= date_trunc('month', now())), 0),
    'low_stock_products', (SELECT count(*) FROM public.inventory i WHERE i.stock_quantity <= i.low_stock_threshold),
    'out_of_stock_products', (SELECT count(*) FROM public.inventory i WHERE i.stock_quantity = 0)
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(timestamptz, timestamptz) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 5. SEED OFFICIAL STORE CATEGORIES (Idempotent & Cleaned from Duplicates)
-- ------------------------------------------------------------------------------
-- Unify existing legacy category slugs
UPDATE public.categories SET slug = 'cakes', name = 'Cakes' WHERE slug = 'cakes-desserts';
UPDATE public.categories SET slug = 'wedding-bulk', name = 'Wedding & Bulk' WHERE slug = 'wedding-bulk-orders';

INSERT INTO public.categories (name, slug, description, is_active, sort_order)
VALUES
  ('Mithai', 'mithai', 'Traditional South Asian sweets handcrafted in pure desi ghee.', true, 10),
  ('Nimco', 'nimco', 'Crispy, savory snacks and authentic Pakistani nimco varieties.', true, 20),
  ('Fresh Snacks', 'fresh-snacks', 'Freshly fried hot samosas, roll patties, and afternoon tea snacks.', true, 30),
  ('Frozen Foods', 'frozen-foods', 'Premium frozen snacks, samosas, and parathas ready to fry at home.', true, 40),
  ('Bakery', 'bakery', 'Freshly baked biscuits, rusks, breads, and confectionery favorites.', true, 50),
  ('Cakes', 'cakes', 'Celebration cakes, pastries, and signature desserts for every occasion.', true, 60),
  ('Wedding & Bulk', 'wedding-bulk', 'Custom catering, bulk sweet distribution, and luxury thaals.', true, 70)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 6. SEED ALL 28 PRODUCTS, VARIANTS, AND IMAGES (Idempotent)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_cat_mithai uuid;
  v_cat_nimco uuid;
  v_cat_snacks uuid;
  v_cat_frozen uuid;
  v_cat_bakery uuid;
  v_cat_cakes uuid;
  v_cat_wedding uuid;
  v_prod_id uuid;
BEGIN
  SELECT id INTO v_cat_mithai FROM public.categories WHERE slug = 'mithai' LIMIT 1;
  SELECT id INTO v_cat_nimco FROM public.categories WHERE slug = 'nimco' LIMIT 1;
  SELECT id INTO v_cat_snacks FROM public.categories WHERE slug = 'fresh-snacks' LIMIT 1;
  SELECT id INTO v_cat_frozen FROM public.categories WHERE slug = 'frozen-foods' LIMIT 1;
  SELECT id INTO v_cat_bakery FROM public.categories WHERE slug = 'bakery' LIMIT 1;
  SELECT id INTO v_cat_cakes FROM public.categories WHERE slug IN ('cakes', 'cakes-desserts') ORDER BY (slug = 'cakes') DESC LIMIT 1;
  SELECT id INTO v_cat_wedding FROM public.categories WHERE slug IN ('wedding-bulk', 'wedding-bulk-orders') ORDER BY (slug = 'wedding-bulk') DESC LIMIT 1;

  -- 1. Shahi Gulab Jamun
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured, ingredients, storage_instructions)
  VALUES (v_cat_mithai, 'Shahi Gulab Jamun (Desi Ghee)', 'shahi-gulab-jamun', 'Soft khoya dumplings in cardamom syrup, fried in pure ghee.', 'active', 'ambient', 1800, 'GS-MIT-01', '1', true, 'Pure Desi Ghee, Khoya, Green Cardamom, Saffron, Sugar Syrup', 'Store in a cool dry place. Best consumed warm within 4 days.')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?auto=format&fit=crop&w=800&q=75', 'Shahi Gulab Jamun', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '500 g', 'GS-MIT-01-500G', 0.5, 'kg', 900, true),
    (v_prod_id, '1 kg', 'GS-MIT-01-1KG', 1.0, 'kg', 1800, true),
    (v_prod_id, '2 kg', 'GS-MIT-01-2KG', 2.0, 'kg', 3600, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 2. Zafrani Ras Malai
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured, ingredients, storage_instructions)
  VALUES (v_cat_mithai, 'Zafrani Ras Malai', 'zafrani-ras-malai', 'Saffron milk with soft paneer discs and pistachio.', 'active', 'fresh', 2200, 'GS-MIT-02', '2', true, 'Fresh Full Cream Milk, Organic Saffron, Pistachio, Paneer', 'Keep refrigerated at 2-4°C. Consume within 48 hours of delivery.')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=75', 'Zafrani Ras Malai', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '500 g', 'GS-MIT-02-500G', 0.5, 'kg', 1100, true),
    (v_prod_id, '1 kg', 'GS-MIT-02-1KG', 1.0, 'kg', 2200, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 3. Silver Leaf Kaju Katli
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured, ingredients, storage_instructions)
  VALUES (v_cat_mithai, 'Silver Leaf Kaju Katli', 'silver-leaf-kaju-katli', 'Diamond-cut cashew fudge finished with edible silver.', 'active', 'ambient', 3600, 'GS-MIT-03', '3', true, 'Premium Goan Cashews, Fine Sugar, Pure Edible Silver Foil (Vark)', 'Store in an airtight container at room temperature for up to 10 days.')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=75', 'Silver Leaf Kaju Katli', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '500 g', 'GS-MIT-03-500G', 0.5, 'kg', 1800, true),
    (v_prod_id, '1 kg', 'GS-MIT-03-1KG', 1.0, 'kg', 3600, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 4. Motichoor Laddu
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured, ingredients, storage_instructions)
  VALUES (v_cat_mithai, 'Motichoor Laddu', 'motichoor-laddu', 'Fine boondi pearls in ghee with saffron and nuts.', 'active', 'ambient', 1700, 'GS-MIT-04', '4', false, 'Gram Flour (Besan), Desi Ghee, Saffron, Melon Seeds, Green Cardamom', 'Keep in a cool dry place. Consume within 7 days.')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=800&q=75', 'Motichoor Laddu', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '500 g', 'GS-MIT-04-500G', 0.5, 'kg', 850, true),
    (v_prod_id, '1 kg', 'GS-MIT-04-1KG', 1.0, 'kg', 1700, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 5. Crispy Mix Nimco
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_nimco, 'Crispy Mix Nimco', 'crispy-mix-nimco', 'Gathiya, sev and peanuts with our house spice blend.', 'active', 'ambient', 1200, 'GS-NIM-05', '5', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=75', 'Crispy Mix Nimco', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '500 g', 'GS-NIM-05-500G', 0.5, 'kg', 600, true),
    (v_prod_id, '1 kg', 'GS-NIM-05-1KG', 1.0, 'kg', 1200, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 6. Masala Daal Moth
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_nimco, 'Masala Daal Moth', 'masala-daal-moth', 'Crunchy lentils tossed in tangy masala.', 'active', 'ambient', 1100, 'GS-NIM-06', '6')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=75', 'Masala Daal Moth', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-NIM-06-1KG', 1.0, 'kg', 1100, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 7. Chatpata Chana Daal
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_nimco, 'Chatpata Chana Daal', 'chatpata-chana-daal', 'Roasted chana daal with lemon and chaat masala.', 'active', 'ambient', 1000, 'GS-NIM-07', '7')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=75', 'Chatpata Chana Daal', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-NIM-07-1KG', 1.0, 'kg', 1000, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 8. Aloo Bhujia
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_nimco, 'Aloo Bhujia', 'aloo-bhujia', 'Thin potato sev, light and extra crisp.', 'active', 'ambient', 1150, 'GS-NIM-08', '8', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1630409351217-bc86ed6d1e7f?auto=format&fit=crop&w=800&q=75', 'Aloo Bhujia', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-NIM-08-1KG', 1.0, 'kg', 1150, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 9. Chicken Samosa (Fresh)
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_snacks, 'Chicken Samosa (Fresh)', 'chicken-samosa-fresh', 'Crisp pastry with spiced minced chicken filling.', 'active', 'fresh', 720, 'GS-SNA-09', '9', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=75', 'Chicken Samosa', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '6 pcs', 'GS-SNA-09-6PC', 6, 'piece', 360, true),
    (v_prod_id, '12 pcs', 'GS-SNA-09-12PC', 12, 'piece', 720, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 10. Beef Roll
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_snacks, 'Beef Roll', 'beef-roll', 'Juicy seasoned beef wrapped in golden crust.', 'active', 'fresh', 900, 'GS-SNA-10', '10')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=75', 'Beef Roll', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '6 pcs', 'GS-SNA-10-6PC', 6, 'piece', 450, true),
    (v_prod_id, '12 pcs', 'GS-SNA-10-12PC', 12, 'piece', 900, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 11. Chicken Patties
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_snacks, 'Chicken Patties', 'chicken-patties', 'Flaky puff pastry with creamy chicken filling.', 'active', 'fresh', 850, 'GS-SNA-11', '11', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=75', 'Chicken Patties', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '6 pcs', 'GS-SNA-11-6PC', 6, 'piece', 425, true),
    (v_prod_id, '12 pcs', 'GS-SNA-11-12PC', 12, 'piece', 850, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 12. Aloo Cutlet
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_snacks, 'Aloo Cutlet', 'aloo-cutlet', 'Spiced potato cutlets, golden crumb-coated.', 'active', 'fresh', 600, 'GS-SNA-12', '12')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=75', 'Aloo Cutlet', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '6 pcs', 'GS-SNA-12-6PC', 6, 'piece', 300, true),
    (v_prod_id, '12 pcs', 'GS-SNA-12-12PC', 12, 'piece', 600, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 13. Chicken Spring Rolls (Frozen)
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_frozen, 'Chicken Spring Rolls (Frozen)', 'chicken-spring-rolls-frozen', 'Ready-to-fry rolls, packed at -18 C.', 'active', 'frozen', 680, 'GS-FRO-13', '13')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=75', 'Chicken Spring Rolls', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '6 pcs', 'GS-FRO-13-6PC', 6, 'piece', 340, true),
    (v_prod_id, '12 pcs', 'GS-FRO-13-12PC', 12, 'piece', 680, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 14. Seekh Kabab (Frozen)
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_frozen, 'Seekh Kabab (Frozen)', 'seekh-kabab-frozen', 'Hand-minced kabab on skewers, ready to grill or fry.', 'active', 'frozen', 950, 'GS-FRO-14', '14')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=75', 'Seekh Kabab', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '6 pcs', 'GS-FRO-14-6PC', 6, 'piece', 950, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 15. Cheese Samosas (Frozen)
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_frozen, 'Cheese Samosas (Frozen)', 'cheese-samosas-frozen', 'Mozzarella and cheddar stuffed in crisp pastry.', 'active', 'frozen', 780, 'GS-FRO-15', '15')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=75', 'Cheese Samosas', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '12 pcs', 'GS-FRO-15-12PC', 12, 'piece', 780, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 16. Crispy Nuggets (Frozen)
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_frozen, 'Crispy Nuggets (Frozen)', 'crispy-nuggets-frozen', 'Golden chicken nuggets for quick meals.', 'active', 'frozen', 850, 'GS-FRO-16', '16')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=75', 'Crispy Nuggets', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '12 pcs', 'GS-FRO-16-12PC', 12, 'piece', 850, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 17. Nan Khatai
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_bakery, 'Nan Khatai', 'nan-khatai', 'Melt-in-mouth traditional cardamom shortbread.', 'active', 'ambient', 1400, 'GS-BAK-17', '17', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=75', 'Nan Khatai', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-BAK-17-1KG', 1.0, 'kg', 1400, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 18. Almond Cookies
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_bakery, 'Almond Cookies', 'almond-cookies', 'Buttery cookies studded with roasted California almonds.', 'active', 'ambient', 1800, 'GS-BAK-18', '18')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=75', 'Almond Cookies', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-BAK-18-1KG', 1.0, 'kg', 1800, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 19. Fruit Cake Rusk
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_bakery, 'Fruit Cake Rusk', 'fruit-cake-rusk', 'Twice-baked crisp rusk with candied fruit.', 'active', 'ambient', 900, 'GS-BAK-19', '19')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=75', 'Fruit Cake Rusk', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-BAK-19-1KG', 1.0, 'kg', 900, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 20. Dry Fruit Biscuits
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_bakery, 'Dry Fruit Biscuits', 'dry-fruit-biscuits', 'Crunchy biscuits packed with pistachio and cashew.', 'active', 'ambient', 1600, 'GS-BAK-20', '20', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=75', 'Dry Fruit Biscuits', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 kg', 'GS-BAK-20-1KG', 1.0, 'kg', 1600, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 21. Belgian Chocolate Fudge Cake
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_cakes, 'Belgian Chocolate Fudge Cake', 'belgian-chocolate-fudge-cake', 'Layers of chocolate sponge with rich Belgian ganache.', 'active', 'fresh', 2499, 'GS-CAK-21', '21', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=75', 'Chocolate Cake', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES 
    (v_prod_id, '1 lb', 'GS-CAK-21-1LB', 1.0, 'lb', 2499, true),
    (v_prod_id, '2 lb', 'GS-CAK-21-2LB', 2.0, 'lb', 4800, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 22. Signature Red Velvet Cake
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_cakes, 'Signature Red Velvet Cake', 'signature-red-velvet-cake', 'Classic red velvet with Philadelphia cream cheese frosting.', 'active', 'fresh', 2699, 'GS-CAK-22', '22')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=75', 'Red Velvet Cake', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 lb', 'GS-CAK-22-1LB', 1.0, 'lb', 2699, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 23. German Black Forest Cake
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_cakes, 'German Black Forest Cake', 'german-black-forest-cake', 'Whipped cream, morello cherries and chocolate shavings.', 'active', 'fresh', 2399, 'GS-CAK-23', '23')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=75', 'Black Forest Cake', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 lb', 'GS-CAK-23-1LB', 1.0, 'lb', 2399, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 24. Chaunsa Mango Gateau
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_cakes, 'Chaunsa Mango Gateau', 'chaunsa-mango-gateau', 'Fresh Pakistani chaunsa mango puree with vanilla cream.', 'active', 'fresh', 2299, 'GS-CAK-24', '24', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=75', 'Mango Gateau', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '1 lb', 'GS-CAK-24-1LB', 1.0, 'lb', 2299, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 25. Wedding Mithai Box Set
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_wedding, 'Wedding Mithai Box Set', 'wedding-mithai-box-set', 'Assorted luxury mithai in an embossed gold-foil gift box.', 'active', 'ambient', 4500, 'GS-WED-25', '25', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=75', 'Wedding Box', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, 'Small Box', 'GS-WED-25-SM', 1, 'box', 4500, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 26. Dry Fruit Hamper
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_wedding, 'Dry Fruit Hamper', 'dry-fruit-hamper', 'Almonds, pistachios, cashews and dates in a keepsake wooden box.', 'active', 'ambient', 6500, 'GS-WED-26', '26')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=75', 'Dry Fruit Hamper', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, 'Medium Box', 'GS-WED-26-MD', 1, 'box', 6500, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 27. Mehndi Thaal Assortment
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id)
  VALUES (v_cat_wedding, 'Mehndi Thaal Assortment', 'mehndi-thaal-assortment', 'Ceremonial decorated thaal with mithai, nimco and fresh sweets.', 'active', 'fresh', 8500, 'GS-WED-27', '27')
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=75', 'Mehndi Thaal', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, 'Thaal Set', 'GS-WED-27-SET', 1, 'box', 8500, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

  -- 28. Barat Bulk Mithai Pack
  INSERT INTO public.products (category_id, name, slug, description, status, food_type, base_price, sku, legacy_id, is_featured)
  VALUES (v_cat_wedding, 'Barat Bulk Mithai Pack', 'barat-bulk-mithai-pack', 'Bulk mithai tubs for large gatherings and event distribution. Free delivery.', 'active', 'ambient', 17000, 'GS-WED-28', '28', true)
  ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price, status = 'active'
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_images (product_id, storage_path, public_url, alt_text, sort_order, is_primary)
  VALUES (v_prod_id, 'external/' || v_prod_id, 'https://images.unsplash.com/photo-1666190092159-3171cf0fbb12?auto=format&fit=crop&w=800&q=75', 'Barat Bulk Mithai', 0, true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.product_variants (product_id, name, sku, weight_value, weight_unit, price, is_available)
  VALUES (v_prod_id, '10 kg Tub', 'GS-WED-28-10KG', 10, 'kg', 17000, true)
  ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price;

END;
$$;

-- ------------------------------------------------------------------------------
-- 7. SEED DEFAULT INVENTORY FOR ALL VARIANTS (Stock = 50 units)
-- ------------------------------------------------------------------------------
INSERT INTO public.inventory (product_variant_id, quantity_on_hand, quantity_reserved)
SELECT pv.id, 50, 0
FROM public.product_variants pv
WHERE NOT EXISTS (
  SELECT 1 FROM public.inventory i WHERE i.product_variant_id = pv.id
);

-- ------------------------------------------------------------------------------
-- 8. SEED DEFAULT STORE SETTINGS (Idempotent)
-- ------------------------------------------------------------------------------
INSERT INTO public.store_settings (key, value, is_public)
VALUES
  ('store_info', '{"name": "Gulfam Sweets & Dairy", "phone": "0300 1234567", "email": "info@gulfamsweets.com", "address": "Main Market, Lahore, Pakistan", "opening_hours": "9:00 AM to 11:00 PM"}'::jsonb, true),
  ('currency', '{"code": "PKR", "symbol": "Rs.", "format": "Rs. {amount}"}'::jsonb, true),
  ('checkout_rules', '{"allow_guest_checkout": true, "cod_enabled": true, "bank_transfer_enabled": true, "raast_enabled": true}'::jsonb, true),
  ('delivery_policy', '{"standard_time_minutes": 60, "express_available": true, "fresh_food_same_day_only": true, "free_delivery_threshold": 3000}'::jsonb, true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  is_public = EXCLUDED.is_public;

-- ------------------------------------------------------------------------------
-- 9. SEED DEFAULT DELIVERY ZONES (100% Idempotent, Safe from Duplicates)
-- ------------------------------------------------------------------------------
ALTER TABLE public.delivery_zones 
  ADD COLUMN IF NOT EXISTS free_delivery_threshold numeric(12,2),
  ADD COLUMN IF NOT EXISTS minimum_order_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS delivery_fee numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Safely remove any duplicate delivery zone entries before indexing
DELETE FROM public.delivery_zones
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY lower(trim(name)), lower(trim(city)) ORDER BY id) as rnum
    FROM public.delivery_zones
  ) t
  WHERE t.rnum > 1
);

-- Safely create unique index
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS delivery_zones_name_city_idx ON public.delivery_zones (name, city);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;

-- Insert missing delivery zones without requiring unique constraint
INSERT INTO public.delivery_zones (name, city, region, delivery_fee, free_delivery_threshold, minimum_order_amount, is_active)
SELECT d.name, d.city, d.region, d.delivery_fee, d.free_delivery_threshold, d.minimum_order_amount, d.is_active
FROM (
  VALUES
    ('Lahore Central & Mall Road', 'Lahore', 'Punjab', 150.00, 2500.00, 500.00, true),
    ('Gulberg, Model Town & Garden Town', 'Lahore', 'Punjab', 150.00, 2500.00, 500.00, true),
    ('DHA & Cantt', 'Lahore', 'Punjab', 200.00, 3000.00, 500.00, true),
    ('Johar Town & Faisal Town', 'Lahore', 'Punjab', 200.00, 3000.00, 500.00, true),
    ('Bahria Town & Raiwind Road', 'Lahore', 'Punjab', 300.00, 4000.00, 1000.00, true)
) AS d(name, city, region, delivery_fee, free_delivery_threshold, minimum_order_amount, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.delivery_zones dz
  WHERE lower(trim(dz.name)) = lower(trim(d.name)) 
    AND lower(trim(dz.city)) = lower(trim(d.city))
);

-- Update fees and thresholds to standard store rates
UPDATE public.delivery_zones dz
SET 
  delivery_fee = d.delivery_fee,
  free_delivery_threshold = d.free_delivery_threshold,
  minimum_order_amount = d.minimum_order_amount,
  is_active = d.is_active
FROM (
  VALUES
    ('Lahore Central & Mall Road', 'Lahore', 150.00, 2500.00, 500.00, true),
    ('Gulberg, Model Town & Garden Town', 'Lahore', 150.00, 2500.00, 500.00, true),
    ('DHA & Cantt', 'Lahore', 200.00, 3000.00, 500.00, true),
    ('Johar Town & Faisal Town', 'Lahore', 200.00, 3000.00, 500.00, true),
    ('Bahria Town & Raiwind Road', 'Lahore', 300.00, 4000.00, 1000.00, true)
) AS d(name, city, delivery_fee, free_delivery_threshold, minimum_order_amount, is_active)
WHERE lower(trim(dz.name)) = lower(trim(d.name)) 
  AND lower(trim(dz.city)) = lower(trim(d.city));

-- ------------------------------------------------------------------------------
-- 10. ENSURE SUPER ADMIN ROLE FOR HOOMANKHAN701@GMAIL.COM
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'hoomankhan701@gmail.com' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_admin_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, email)
    VALUES (v_admin_id, 'Muhammad Hooman', 'hoomankhan701@gmail.com')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
  END IF;
END;
$$;


-- ------------------------------------------------------------------------------
-- 11. COMPLETE SITE MEDIA & ASSETS MANAGEMENT SYSTEM
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_key text UNIQUE NOT NULL,
  title text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  url text NOT NULL,
  poster_url text,
  mobile_url text,
  storage_path text,
  file_name text,
  file_size text,
  dimensions text,
  page text NOT NULL,
  section text NOT NULL,
  location_path text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  autoplay boolean DEFAULT true,
  loop boolean DEFAULT true,
  muted boolean DEFAULT true,
  controls boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helper function to check if current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin', 'admin', 'manager', 'inventory_manager', 'order_manager')
    )
    OR (
      SELECT coalesce(raw_app_meta_data->>'role', '') IN ('super_admin', 'admin')
      FROM auth.users
      WHERE id = auth.uid()
    )
  );
$$;

-- Table permissions
GRANT ALL ON TABLE public.site_media TO authenticated, service_role;
GRANT SELECT ON TABLE public.site_media TO anon;

-- Enable Row Level Security
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

-- Public / Anonymous read access so storefront displays the active media
DROP POLICY IF EXISTS "public read site_media" ON public.site_media;
CREATE POLICY "public read site_media" ON public.site_media
  FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_admin());

-- Admin full management access
DROP POLICY IF EXISTS "admin manage site_media" ON public.site_media;
CREATE POLICY "admin manage site_media" ON public.site_media
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.site_media (
  media_key, title, media_type, url, poster_url, file_name, file_size, dimensions, page, section, location_path, description, autoplay, loop, muted, controls
) VALUES
(
  'home_hero_circle_video',
  'Homepage Golden Ring Hero Video',
  'video',
  '/videos/gulfam-commercial.mp4',
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  'gulfam-commercial.mp4',
  '11.0 MB',
  '1080p HD',
  'home',
  'Hero Section',
  'Homepage → Hero Section → Golden Ring Circular Video',
  'Main commercial video playing inside the golden ring on the homepage.',
  true, true, true, false
),
(
  'mithai_hero_video',
  'Mithai Page Hero Background Video',
  'video',
  '/videos/mithai-food-video.mp4',
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=1600&q=80',
  'mithai-food-video.mp4',
  '9.1 MB',
  '1080p HD',
  'mithai',
  'Hero Banner',
  'Mithai Page → Hero Banner → Background Ambient Video',
  'Ambient royal background video for the Mithai department banner.',
  true, true, true, false
),
(
  'nimco_hero_video',
  'Nimco Page Hero Background Video',
  'video',
  '/videos/nimco-food-video.mp4',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=80',
  'nimco-food-video.mp4',
  '10.7 MB',
  '1080p HD',
  'nimco',
  'Hero Banner',
  'Nimco Page → Hero Banner → Background Ambient Video',
  'Ambient background video for the Nimco & Savoury department banner.',
  true, true, true, false
),
(
  'fresh_snacks_hero_video',
  'Fresh Snacks Page Hero Background Video',
  'video',
  '/videos/fresh-snacks-video.mp4',
  'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1600&q=80',
  'fresh-snacks-video.mp4',
  '11.3 MB',
  '1080p HD',
  'fresh-snacks',
  'Hero Banner',
  'Fresh Snacks Page → Hero Banner → Background Ambient Video',
  'Ambient background video for the Fresh Snacks department banner.',
  true, true, true, false
),
(
  'frozen_foods_hero_video',
  'Frozen Foods Page Hero Background Video',
  'video',
  '/videos/frozen-foods-video.mp4',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1600&q=80',
  'frozen-foods-video.mp4',
  '15.9 MB',
  '1080p HD',
  'frozen-foods',
  'Hero Banner',
  'Frozen Foods Page → Hero Banner → Background Ambient Video',
  'Ambient rotating platter background video for Frozen Foods banner.',
  true, true, true, false
),
(
  'bakery_hero_video',
  'Bakery Page Hero Background Video',
  'video',
  '/videos/bakery-video.mp4',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80',
  'bakery-video.mp4',
  '12.1 MB',
  '1080p HD',
  'bakery',
  'Hero Banner',
  'Bakery Page → Hero Banner → Background Ambient Video',
  'Ambient rotating bakery treats background video for Bakery banner.',
  true, true, true, false
),
(
  'cakes_hero_video',
  'Cakes & Desserts Page Hero Background Video',
  'video',
  '/videos/cakes-video.mp4',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80',
  'cakes-video.mp4',
  '11.6 MB',
  '1080p HD',
  'cakes',
  'Hero Banner',
  'Cakes Page → Hero Banner → Background Ambient Video',
  'Ambient chocolate cake rotating background video for Cakes banner.',
  true, true, true, false
),
(
  'wedding_hero_video',
  'Wedding & Bulk Orders Page Hero Background Video',
  'video',
  '/videos/wedding-video.mp4',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80',
  'wedding-video.mp4',
  '14.0 MB',
  '1080p HD',
  'wedding',
  'Hero Banner',
  'Wedding Page → Hero Banner → Background Ambient Video',
  'Ambient wedding cake rotating background video for Wedding & Bulk Orders banner.',
  true, true, true, false
),
(
  'home_cat_mithai',
  'Homepage Category Circle - Mithai',
  'image',
  'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-mithai.jpg',
  '180 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Mithai Circle',
  'Circular category thumbnail image for Traditional Mithai.',
  false, false, false, false
),
(
  'home_cat_nimco',
  'Homepage Category Circle - Nimco',
  'image',
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-nimco.jpg',
  '210 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Nimco Circle',
  'Circular category thumbnail image for Nimco.',
  false, false, false, false
),
(
  'home_cat_snacks',
  'Homepage Category Circle - Fresh Snacks',
  'image',
  'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-snacks.jpg',
  '195 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Fresh Snacks Circle',
  'Circular category thumbnail image for Fresh Snacks.',
  false, false, false, false
),
(
  'home_cat_frozen',
  'Homepage Category Circle - Frozen Foods',
  'image',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-frozen.jpg',
  '175 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Frozen Foods Circle',
  'Circular category thumbnail image for Frozen Foods.',
  false, false, false, false
),
(
  'home_cat_bakery',
  'Homepage Category Circle - Bakery',
  'image',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-bakery.jpg',
  '220 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Bakery Circle',
  'Circular category thumbnail image for Bakery.',
  false, false, false, false
),
(
  'home_cat_cakes',
  'Homepage Category Circle - Cakes',
  'image',
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-cakes.jpg',
  '240 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Cakes Circle',
  'Circular category thumbnail image for Cakes & Desserts.',
  false, false, false, false
),
(
  'home_cat_wedding',
  'Homepage Category Circle - Wedding & Bulk',
  'image',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  null,
  'cat-wedding.jpg',
  '230 KB',
  '800x800',
  'home',
  'Shop by Category',
  'Homepage → Shop by Category → Wedding & Bulk Circle',
  'Circular category thumbnail image for Wedding & Bulk Orders.',
  false, false, false, false
),
(
  'about_story_image',
  'About Us Heritage Story Image',
  'image',
  'https://images.unsplash.com/photo-1567337710282-00832b415979?auto=format&fit=crop&w=800&q=80',
  null,
  'about-story.jpg',
  '320 KB',
  '1200x800',
  'about',
  'Story Section',
  'About Us Page → Story Section → Handcrafted Since 1990 Image',
  'Main featured image in the About Us story section.',
  false, false, false, false
),
(
  'about_kitchen_image',
  'About Us Master Kitchen Heritage Image',
  'image',
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  null,
  'about-kitchen.jpg',
  '310 KB',
  '1200x800',
  'about',
  'Heritage Section',
  'About Us Page → Heritage Section → Master Halwai & Kitchen Image',
  'Kitchen and master halwai craft showcase image.',
  false, false, false, false
)
ON CONFLICT (media_key) DO UPDATE
SET title = EXCLUDED.title,
    location_path = EXCLUDED.location_path,
    description = EXCLUDED.description;
