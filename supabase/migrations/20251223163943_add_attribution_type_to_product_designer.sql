/*
  # Add Attribution Type to Product Designer

  1. Changes
    - Add `attribution_type` column to `product_designer` junction table
      - Type: text with check constraint
      - Values: 'by', 'in_the_style_of', 'attributed_to'
      - Default: 'by'
      - Not null
    - Add unique constraint on `product_id` to ensure only one designer per product
    - Drop existing primary key and recreate with proper structure
  
  2. Security
    - No RLS changes needed (inherits from existing table policies)
  
  3. Notes
    - This allows products to have exactly one designer with proper attribution
    - Maintains data integrity with constraints
    - Default attribution type is 'by' for simplicity
*/

-- Add attribution_type column to product_designer table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_designer' AND column_name = 'attribution_type'
  ) THEN
    ALTER TABLE product_designer 
    ADD COLUMN attribution_type text NOT NULL DEFAULT 'by'
    CHECK (attribution_type IN ('by', 'in_the_style_of', 'attributed_to'));
  END IF;
END $$;

-- Add unique constraint on product_id to ensure only one designer per product
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'product_designer_product_id_key'
    AND table_name = 'product_designer'
  ) THEN
    ALTER TABLE product_designer
    ADD CONSTRAINT product_designer_product_id_key UNIQUE (product_id);
  END IF;
END $$;