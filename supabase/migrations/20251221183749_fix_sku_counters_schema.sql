/*
  # Fix SKU Counters Table Schema

  1. Changes
    - Drop existing sku_counters table with global per-category counters
    - Create new sku_counters table with per-consignor-per-category counters
    - New columns: consignor_code (text), category_id (uuid), counter (integer)
    - Unique constraint on (consignor_code, category_id) combination
    - This matches the generate_sku function requirements

  2. Security
    - Enable RLS on new sku_counters table
    - Add policies for authenticated users to manage counters

  3. Notes
    - The new structure allows separate SKU sequences for each consignor per category
    - Previous SKU counts will be reset since this is a breaking schema change
*/

-- Drop existing sku_counters table
DROP TABLE IF EXISTS sku_counters CASCADE;

-- Create new sku_counters table with correct schema
CREATE TABLE IF NOT EXISTS sku_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consignor_code text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  counter integer DEFAULT 0 NOT NULL,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(consignor_code, category_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sku_counters_consignor_category 
ON sku_counters(consignor_code, category_id);

-- Enable Row Level Security
ALTER TABLE sku_counters ENABLE ROW LEVEL SECURITY;

-- Policies for sku_counters table
CREATE POLICY "Authenticated users can view sku_counters"
  ON sku_counters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sku_counters"
  ON sku_counters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sku_counters"
  ON sku_counters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
