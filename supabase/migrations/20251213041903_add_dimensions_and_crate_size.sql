/*
  # Add dimensions and crate size fields to products

  1. Changes
    - Add `dimensions` column (text) to products table for detailed dimension listings
    - Add `crate_size` column (text) to products table for shipping crate information
  
  2. Notes
    - dimensions field allows for multi-line detailed measurements
    - crate_size field follows format: Length: X Width: Y Height: Z Weight: W
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'dimensions'
  ) THEN
    ALTER TABLE products ADD COLUMN dimensions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'crate_size'
  ) THEN
    ALTER TABLE products ADD COLUMN crate_size text;
  END IF;
END $$;