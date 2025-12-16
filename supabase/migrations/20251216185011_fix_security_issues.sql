/*
  # Fix Database Security Issues

  1. Performance Improvements
    - Add missing indexes on foreign key columns
    - Remove duplicate index on products table

  2. Security Improvements
    - Consolidate multiple permissive RLS policies
    - Fix function search path mutability

  3. Changes
    - Add indexes: cross_listings(product_id), hold_interest_notifications(product_id),
      pdf_downloads(product_id), product_holds(product_id), product_images(product_id),
      product_offers(product_id), product_sales(product_id)
    - Drop duplicate index: idx_products_workflow_stage
    - Consolidate RLS policies for better security
    - Set immutable search_path on functions
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Index for cross_listings.product_id
CREATE INDEX IF NOT EXISTS idx_cross_listings_product_id
ON cross_listings(product_id);

-- Index for hold_interest_notifications.product_id
CREATE INDEX IF NOT EXISTS idx_hold_interest_notifications_product_id
ON hold_interest_notifications(product_id);

-- Index for pdf_downloads.product_id
CREATE INDEX IF NOT EXISTS idx_pdf_downloads_product_id
ON pdf_downloads(product_id);

-- Index for product_holds.product_id
CREATE INDEX IF NOT EXISTS idx_product_holds_product_id
ON product_holds(product_id);

-- Index for product_images.product_id
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
ON product_images(product_id);

-- Index for product_offers.product_id
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id
ON product_offers(product_id);

-- Index for product_sales.product_id
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id
ON product_sales(product_id);

-- =====================================================
-- 2. REMOVE DUPLICATE INDEX
-- =====================================================

DROP INDEX IF EXISTS idx_products_workflow_stage;

-- =====================================================
-- 3. CONSOLIDATE RLS POLICIES
-- =====================================================

-- Categories: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Subcategories: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view subcategories" ON subcategories;
DROP POLICY IF EXISTS "Authenticated users can manage subcategories" ON subcategories;

CREATE POLICY "Anyone can view subcategories"
  ON subcategories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert subcategories"
  ON subcategories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subcategories"
  ON subcategories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subcategories"
  ON subcategories FOR DELETE
  TO authenticated
  USING (true);

-- Products: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view available and sold products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

CREATE POLICY "Anyone can view available and sold products"
  ON products FOR SELECT
  USING (status IN ('available', 'sold'));

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Product Images: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view product images" ON product_images;
DROP POLICY IF EXISTS "Authenticated users can manage product images" ON product_images;

CREATE POLICY "Anyone can view product images"
  ON product_images FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert product images"
  ON product_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product images"
  ON product_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product images"
  ON product_images FOR DELETE
  TO authenticated
  USING (true);

-- Product Offers: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can create offers" ON product_offers;
DROP POLICY IF EXISTS "Authenticated users can view and manage offers" ON product_offers;

CREATE POLICY "Anyone can create offers"
  ON product_offers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view offers"
  ON product_offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update offers"
  ON product_offers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete offers"
  ON product_offers FOR DELETE
  TO authenticated
  USING (true);

-- Product Holds: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view active holds" ON product_holds;
DROP POLICY IF EXISTS "Public can create holds" ON product_holds;
DROP POLICY IF EXISTS "Authenticated users can manage holds" ON product_holds;

CREATE POLICY "Anyone can view active holds"
  ON product_holds FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can create holds"
  ON product_holds FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update holds"
  ON product_holds FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete holds"
  ON product_holds FOR DELETE
  TO authenticated
  USING (true);

-- Cross Listings: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view active cross listings" ON cross_listings;
DROP POLICY IF EXISTS "Authenticated users can manage cross listings" ON cross_listings;

CREATE POLICY "Anyone can view active cross listings"
  ON cross_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert cross listings"
  ON cross_listings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cross listings"
  ON cross_listings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cross listings"
  ON cross_listings FOR DELETE
  TO authenticated
  USING (true);

-- Reviews: Consolidate to single policy per action
DROP POLICY IF EXISTS "Public can view featured reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can manage reviews" ON reviews;

CREATE POLICY "Anyone can view featured reviews"
  ON reviews FOR SELECT
  USING (is_featured = true);

CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 4. FIX FUNCTION SEARCH PATH MUTABILITY
-- =====================================================

-- Recreate update_updated_at_column with immutable search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate generate_consignor_code with immutable search_path
CREATE OR REPLACE FUNCTION generate_consignor_code(last_name_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_code text;
  counter integer := 1;
  new_code text;
BEGIN
  base_code := UPPER(LEFT(last_name_input, 3));
  new_code := base_code;

  WHILE EXISTS (SELECT 1 FROM consignors WHERE consignor_code = new_code) LOOP
    new_code := base_code || LPAD(counter::text, 2, '0');
    counter := counter + 1;
  END LOOP;

  RETURN new_code;
END;
$$;

-- Recreate generate_sku with immutable search_path
CREATE OR REPLACE FUNCTION generate_sku(
  consignor_code_input text,
  category_id_input uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  category_code text;
  current_counter integer;
  new_sku text;
BEGIN
  SELECT code INTO category_code
  FROM categories
  WHERE id = category_id_input;

  IF category_code IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  INSERT INTO sku_counters (consignor_code, category_id, counter)
  VALUES (consignor_code_input, category_id_input, 1)
  ON CONFLICT (consignor_code, category_id)
  DO UPDATE SET counter = sku_counters.counter + 1
  RETURNING counter INTO current_counter;

  new_sku := consignor_code_input || '-' || category_code || '-' || LPAD(current_counter::text, 4, '0');

  RETURN new_sku;
END;
$$;

-- Recreate update_workflow_stage_timestamp with immutable search_path
CREATE OR REPLACE FUNCTION update_workflow_stage_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    NEW.workflow_stage_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate update_consignor_timestamp with immutable search_path
CREATE OR REPLACE FUNCTION update_consignor_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.consignor_id IS DISTINCT FROM OLD.consignor_id THEN
    NEW.consignor_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;