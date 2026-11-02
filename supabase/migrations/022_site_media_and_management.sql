-- Migration 022: Site Media Management System
-- Gulfam Sweets & Dairy e-Commerce Platform
-- Enables full admin control over all website images and videos without touching code.

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

-- Ensure public storage bucket 'site-media' exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-media',
  'site-media',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4', 'video/webm']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800;

-- Storage bucket access policies
DROP POLICY IF EXISTS "public read site-media bucket" ON storage.objects;
CREATE POLICY "public read site-media bucket" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "admin insert site-media bucket" ON storage.objects;
CREATE POLICY "admin insert site-media bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-media' AND public.is_admin()
  );

DROP POLICY IF EXISTS "admin update site-media bucket" ON storage.objects;
CREATE POLICY "admin update site-media bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-media' AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'site-media' AND public.is_admin()
  );

DROP POLICY IF EXISTS "admin delete site-media bucket" ON storage.objects;
CREATE POLICY "admin delete site-media bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-media' AND public.is_admin()
  );

-- Seed default site media entries
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

