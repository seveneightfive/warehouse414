/*
  # Fix Products RLS Policy for Public Visibility

  1. Problem
    - The RLS policy created in fix_security_issues migration removed critical filters
    - Original policy: status IN ('available', 'on_hold', 'sold') AND workflow_stage = 'listed'
    - Broken policy: status IN ('available', 'sold') - missing 'on_hold' and workflow_stage check
    - This caused products with workflow_stage='listed' to not appear on the public site

  2. Changes
    - Drop the incorrect RLS policy for product SELECT
    - Recreate the policy with correct filters:
      * Include all three statuses: 'available', 'on_hold', and 'sold'
      * Require workflow_stage = 'listed' to only show products ready for public viewing
    - This restores the original intended behavior

  3. Security
    - Maintains secure access: only products marked as 'listed' in workflow are public
    - Products in other workflow stages (research, descriptions, photos, ready) remain hidden
    - Authenticated users still have full access to manage all products
*/

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Anyone can view available and sold products" ON products;

-- Recreate with correct filters
CREATE POLICY "Anyone can view listed products"
  ON products FOR SELECT
  USING (status IN ('available', 'on_hold', 'sold') AND workflow_stage = 'listed');