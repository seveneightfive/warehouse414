/*
  # Fix Product Status Constraint to Include 'inventory'

  1. Changes
    - Drop the existing 'valid_status' constraint on products table
    - Add new constraint that includes 'inventory' as a valid status value
    - Valid statuses are now: 'available', 'on_hold', 'sold', 'inventory'

  2. Notes
    - Products with status='inventory' are items in the intake/processing phase
    - This allows proper tracking of items before they go on sale
*/

-- Drop the old constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with 'inventory' included
ALTER TABLE products ADD CONSTRAINT valid_status 
  CHECK (status IN ('available', 'on_hold', 'sold', 'inventory'));
