/*
  # Add Purchase Price and New Workflow Stages

  1. New Columns
    - `purchase_price` (decimal, optional) - Cost/purchase price of inventory items

  2. Updated Constraints
    - Add 'received' and 'scheduled' to workflow_stage CHECK constraint

  3. Important Notes
    - purchase_price is optional and nullable
    - New workflow stages support inventory intake ("received") and scheduling ("scheduled")
    - These complement existing stages: research, descriptions, photos, ready, listed, preparation, photo, edit, for_submission
*/

-- Add purchase_price column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'purchase_price'
  ) THEN
    ALTER TABLE products ADD COLUMN purchase_price decimal(10, 2);
  END IF;
END $$;

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'products' AND constraint_name = 'valid_workflow'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT valid_workflow;
  END IF;
END $$;

-- Add new constraint with all workflow stages
ALTER TABLE products 
ADD CONSTRAINT valid_workflow CHECK (
  workflow_stage IN (
    'research', 
    'descriptions', 
    'photos', 
    'ready', 
    'listed', 
    'preparation', 
    'photo', 
    'edit', 
    'for_submission', 
    'received',
    'scheduled'
  )
);
