/*
  # Update Public Product Visibility

  ## Changes
  
  Updates the RLS policy for public product access to show products based on status alone, 
  without requiring workflow_stage = 'listed'. This allows products with status 'available', 
  'on_hold', or 'sold' to be visible on the public shop and home pages regardless of their 
  workflow stage.

  ## Reasoning
  
  - The `status` field represents public-facing availability
  - The `workflow_stage` field represents internal workflow progress
  - Products should be visible publicly based on their status, not their internal workflow state
  
  ## Policy Changes
  
  - Drops the old "Public can view listed products" policy
  - Creates a new policy that allows anonymous users to view products with available/on_hold/sold status
  - Admin users maintain full access to all products
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Public can view listed products" ON products;

-- Create new policy that shows products based on status only
CREATE POLICY "Public can view products by status"
  ON products
  FOR SELECT
  TO anon
  USING (
    status IN ('available', 'on_hold', 'sold')
  );
