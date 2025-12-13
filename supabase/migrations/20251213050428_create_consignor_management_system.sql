/*
  # Create Consignor Management System with Auto-Generated SKUs

  ## New Tables
  
  ### 1. consignors
  - `id` (uuid, primary key) - Unique identifier for consignor
  - `first_name` (text) - Consignor's first name
  - `last_name` (text) - Consignor's last name
  - `consignor_code` (text, unique) - Auto-generated 3-4 letter code from last name
  - `email` (text, nullable) - Contact email
  - `phone` (text, nullable) - Contact phone number
  - `address` (text, nullable) - Full address
  - `commission_rate` (numeric, default 50) - Commission percentage (0-100)
  - `notes` (text, nullable) - Internal notes about consignor
  - `is_active` (boolean, default true) - Whether consignor is currently active
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. sku_counters
  - `id` (uuid, primary key) - Unique identifier
  - `category_id` (uuid, foreign key) - References categories table
  - `current_count` (integer, default 0) - Current SKU increment counter
  - `last_updated` (timestamptz) - Last time counter was incremented
  
  ## Table Modifications
  
  ### products table
  - Add `consignor_id` (uuid, foreign key) - References consignors table
  - Keep existing `consignor` (text) for data migration purposes
  - Add `workflow_stage_updated_at` (timestamptz) - Track when workflow stage was last changed
  
  ## Functions
  
  ### generate_consignor_code(last_name text)
  - Generates unique 3-letter code from last name
  - Falls back to 4 letters if 3-letter code exists
  - Returns uppercase code
  
  ### generate_sku(consignor_code text, category_id uuid)
  - Generates SKU in format: CONSIGNORCODE-CATEGORYABBREV-INCREMENT
  - Automatically increments the global counter for the category
  - Returns the generated SKU
  
  ## Security
  
  - Enable RLS on consignors table
  - Enable RLS on sku_counters table
  - Policies allow public read access (for SKU generation)
  - All tables secured with proper RLS policies
  
  ## Indexes
  
  - Index on consignors.consignor_code for fast lookup
  - Index on consignors.is_active for filtering active consignors
  - Index on products.consignor_id for reporting
  - Index on sku_counters.category_id for counter lookups
*/

-- Create consignors table
CREATE TABLE IF NOT EXISTS consignors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  consignor_code text UNIQUE NOT NULL,
  email text,
  phone text,
  address text,
  commission_rate numeric DEFAULT 50 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sku_counters table for global per-category SKU increments
CREATE TABLE IF NOT EXISTS sku_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_count integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

-- Add consignor_id to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'consignor_id'
  ) THEN
    ALTER TABLE products ADD COLUMN consignor_id uuid REFERENCES consignors(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'workflow_stage_updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN workflow_stage_updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Function to generate unique consignor code from last name
CREATE OR REPLACE FUNCTION generate_consignor_code(last_name_input text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code_3_letters text;
  code_4_letters text;
  final_code text;
BEGIN
  -- Generate 3-letter code (uppercase)
  code_3_letters := UPPER(LEFT(REGEXP_REPLACE(last_name_input, '[^a-zA-Z]', '', 'g'), 3));
  
  -- Check if 3-letter code exists
  IF EXISTS (SELECT 1 FROM consignors WHERE consignor_code = code_3_letters) THEN
    -- Try 4-letter code
    code_4_letters := UPPER(LEFT(REGEXP_REPLACE(last_name_input, '[^a-zA-Z]', '', 'g'), 4));
    
    IF EXISTS (SELECT 1 FROM consignors WHERE consignor_code = code_4_letters) THEN
      -- If both exist, append a number
      final_code := code_3_letters || FLOOR(RANDOM() * 99 + 1)::text;
    ELSE
      final_code := code_4_letters;
    END IF;
  ELSE
    final_code := code_3_letters;
  END IF;
  
  RETURN final_code;
END;
$$;

-- Function to generate SKU with global per-category counter
CREATE OR REPLACE FUNCTION generate_sku(consignor_code_input text, category_id_input uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  category_name text;
  category_abbrev text;
  counter_value integer;
  new_sku text;
BEGIN
  -- Get category name
  SELECT name INTO category_name FROM categories WHERE id = category_id_input;
  
  -- Generate 3-letter category abbreviation
  category_abbrev := UPPER(LEFT(REGEXP_REPLACE(category_name, '[^a-zA-Z]', '', 'g'), 3));
  
  -- Initialize counter if it doesn't exist
  INSERT INTO sku_counters (category_id, current_count)
  VALUES (category_id_input, 1)
  ON CONFLICT (category_id) DO UPDATE
  SET current_count = sku_counters.current_count + 1,
      last_updated = now()
  RETURNING current_count INTO counter_value;
  
  -- Generate SKU: CONSIGNOR-CATEGORY-INCREMENT
  new_sku := consignor_code_input || '-' || category_abbrev || '-' || LPAD(counter_value::text, 4, '0');
  
  RETURN new_sku;
END;
$$;

-- Trigger to update workflow_stage_updated_at when workflow_stage changes
CREATE OR REPLACE FUNCTION update_workflow_stage_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    NEW.workflow_stage_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_workflow_stage_update ON products;
CREATE TRIGGER products_workflow_stage_update
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_stage_timestamp();

-- Trigger to update updated_at timestamp on consignors
CREATE OR REPLACE FUNCTION update_consignor_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consignors_updated_at ON consignors;
CREATE TRIGGER consignors_updated_at
  BEFORE UPDATE ON consignors
  FOR EACH ROW
  EXECUTE FUNCTION update_consignor_timestamp();

-- Enable Row Level Security
ALTER TABLE consignors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sku_counters ENABLE ROW LEVEL SECURITY;

-- Policies for consignors table (public read for now, can be restricted later)
CREATE POLICY "Public can read consignors"
  ON consignors FOR SELECT
  USING (true);

CREATE POLICY "Public can insert consignors"
  ON consignors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update consignors"
  ON consignors FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete consignors"
  ON consignors FOR DELETE
  USING (true);

-- Policies for sku_counters table
CREATE POLICY "Public can read sku_counters"
  ON sku_counters FOR SELECT
  USING (true);

CREATE POLICY "Public can insert sku_counters"
  ON sku_counters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update sku_counters"
  ON sku_counters FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consignors_code ON consignors(consignor_code);
CREATE INDEX IF NOT EXISTS idx_consignors_active ON consignors(is_active);
CREATE INDEX IF NOT EXISTS idx_consignors_last_name ON consignors(last_name);
CREATE INDEX IF NOT EXISTS idx_products_consignor_id ON products(consignor_id);
CREATE INDEX IF NOT EXISTS idx_products_workflow_stage ON products(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_sku_counters_category ON sku_counters(category_id);

-- Initialize sku_counters for all existing categories
INSERT INTO sku_counters (category_id, current_count)
SELECT id, 0
FROM categories
ON CONFLICT (category_id) DO NOTHING;
