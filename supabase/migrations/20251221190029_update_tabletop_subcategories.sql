/*
  # Update Tabletop Subcategories

  ## Overview
  This migration expands the Tabletop category subcategories from 1 to 5 items.

  ## Changes
  
  ### Tabletop Subcategories
  Previously had only:
  - Cookware
  
  Now includes:
  - Cookware
  - Glassware
  - Barware
  - Serveware
  - Tableware

  ## Security
  - Maintains existing RLS policies
  - No changes to product data
  - Safe deletion and recreation of subcategories
*/

-- Step 1: Delete existing Tabletop subcategories
DELETE FROM subcategories 
WHERE category_id IN (
  SELECT id FROM categories WHERE name = 'Tabletop'
);

-- Step 2: Add all Tabletop subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Cookware', 'cookware', id, 1 FROM categories WHERE name = 'Tabletop'
UNION ALL
SELECT 'Glassware', 'glassware', id, 2 FROM categories WHERE name = 'Tabletop'
UNION ALL
SELECT 'Barware', 'barware', id, 3 FROM categories WHERE name = 'Tabletop'
UNION ALL
SELECT 'Serveware', 'serveware', id, 4 FROM categories WHERE name = 'Tabletop'
UNION ALL
SELECT 'Tableware', 'tableware', id, 5 FROM categories WHERE name = 'Tabletop';
