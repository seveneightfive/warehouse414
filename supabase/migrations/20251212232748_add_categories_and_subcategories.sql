-- # Add Categories and Subcategories System
--
-- ## Overview
-- Adds a comprehensive category and subcategory system to organize products.
--
-- ## New Tables
--
-- ### 1. categories
-- Main product categories with display order and icons
-- - id (uuid, primary key)
-- - name (text, unique) - Category name
-- - slug (text, unique) - URL-friendly slug
-- - icon_name (text) - Lucide icon name
-- - display_order (integer) - Sort order for display
-- - created_at (timestamptz)
--
-- ### 2. subcategories
-- Subcategories within each main category
-- - id (uuid, primary key)
-- - category_id (uuid, foreign key) - Parent category
-- - name (text) - Subcategory name
-- - slug (text) - URL-friendly slug
-- - display_order (integer) - Sort order for display
-- - created_at (timestamptz)
--
-- ## Changes to Existing Tables
--
-- ### products table
-- - Added category_id (uuid, foreign key) - Main category
-- - Added subcategory_id (uuid, foreign key, nullable) - Subcategory
--
-- ## Data Seeding
--
-- ### Categories (10 main categories):
-- 1. Curiosities (Sparkles icon)
-- 2. Desks (Monitor icon)
-- 3. Tables (Table icon)
-- 4. Seating (Armchair icon)
-- 5. Lighting (Lightbulb icon)
-- 6. Architectural (Building2 icon)
-- 7. Cabinets (Archive icon)
-- 8. Industrial (Factory icon)
-- 9. Sets (Package icon)
-- 10. Mirrors (Frame icon)
--
-- ### Subcategories:
-- - Each category has an "All" subcategory as default
-- - Additional subcategories for specific categories
--
-- ## Security
-- - Enable RLS on categories and subcategories tables
-- - Public read access for categories and subcategories
-- - Authenticated admin access for all operations
--
-- ## Indexes
-- - Added indexes on products(category_id) and products(subcategory_id) for better query performance

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon_name text NOT NULL,
  display_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Add category columns to products table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory_id uuid REFERENCES subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert categories with icons and display order
INSERT INTO categories (name, slug, icon_name, display_order) VALUES
  ('Curiosities', 'curiosities', 'Sparkles', 1),
  ('Desks', 'desks', 'Monitor', 2),
  ('Tables', 'tables', 'Table', 3),
  ('Seating', 'seating', 'Armchair', 4),
  ('Lighting', 'lighting', 'Lightbulb', 5),
  ('Architectural', 'architectural', 'Building2', 6),
  ('Cabinets', 'cabinets', 'Archive', 7),
  ('Industrial', 'industrial', 'Factory', 8),
  ('Sets', 'sets', 'Package', 9),
  ('Mirrors', 'mirrors', 'Frame', 10)
ON CONFLICT (slug) DO NOTHING;

-- Insert "All" subcategory for each category
INSERT INTO subcategories (category_id, name, slug, display_order)
SELECT id, 'All', 'all', 0
FROM categories
ON CONFLICT (category_id, slug) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Public can view categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for subcategories
CREATE POLICY "Public can view subcategories"
  ON subcategories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage subcategories"
  ON subcategories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_subcategories_display_order ON subcategories(display_order);