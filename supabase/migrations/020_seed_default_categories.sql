-- Migration 020: Seed Default Categories
-- Gulfam Sweets & Dairy e-Commerce Platform

insert into public.categories (name, slug, description, is_active, sort_order)
values
  ('Mithai', 'mithai', 'Traditional South Asian sweets handcrafted with pure ingredients.', true, 10),
  ('Nimco', 'nimco', 'Crispy, savory snacks and authentic Pakistani nimco varieties.', true, 20),
  ('Bakery', 'bakery', 'Freshly baked biscuits, rusks, breads, and confectionery favorites.', true, 30),
  ('Cakes & Desserts', 'cakes-desserts', 'Celebration cakes, pastries, and signature desserts for every occasion.', true, 40),
  ('Fresh Snacks', 'fresh-snacks', 'Freshly fried hot samosas, roll patties, and tea-time snacks.', true, 50),
  ('Frozen Foods', 'frozen-foods', 'Premium frozen snacks, samosas, and parathas ready to fry at home.', true, 60),
  ('Gift Boxes', 'gift-boxes', 'Elegantly packaged luxury mithai and assorted sweets gift boxes.', true, 70),
  ('Wedding & Bulk Orders', 'wedding-bulk-orders', 'Custom catering, bulk orders, and sweet distribution boxes for weddings and celebrations.', true, 80)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
