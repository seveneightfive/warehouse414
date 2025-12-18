/*
  # Set Default Workflow Status for Existing Products

  1. Changes
    - Update all existing products that have NULL workflow_status to 'active'
    - This ensures compatibility with the new sales batch workflow system

  2. Notes
    - Only affects existing products
    - New products automatically get workflow_status='active' from column default
*/

-- Update all existing products with NULL workflow_status
UPDATE products
SET workflow_status = 'active'
WHERE workflow_status IS NULL;

-- Ensure the column has a proper default for future inserts
ALTER TABLE products 
  ALTER COLUMN workflow_status SET DEFAULT 'active';

-- Make sure workflow_status is never null going forward
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' 
    AND column_name = 'workflow_status'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE products 
      ALTER COLUMN workflow_status SET NOT NULL;
  END IF;
END $$;