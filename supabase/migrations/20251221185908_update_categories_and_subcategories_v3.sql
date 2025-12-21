/*
  # Update Categories and Subcategories - Comprehensive Reorganization

  ## Overview
  This migration reorganizes the entire category and subcategory structure to match the
  new business requirements. It preserves data safety by keeping categories with existing products.

  ## Changes

  ### 1. Categories to Keep and Update
  - **Seating** - Add 6 new subcategories
  - **Tables** - Add 8 new subcategories
  - **Architectural** - Update to have 1 subcategory (Fireplaces)
  - **Lighting** - Add 2 new subcategories (Fixtures, Lamps)
  - **Curiosities** - KEPT (has 3 existing products, not in new structure but preserved for data safety)

  ### 2. New Categories to Add
  - **Casegoods** - With 9 subcategories
  - **Art & Decor** - With 7 subcategories
  - **Fashion** - With 3 subcategories
  - **Tabletop** - With 1 subcategory

  ### 3. Empty Categories to Remove
  - Cabinets (0 products)
  - Desks (0 products)
  - Industrial (0 products)
  - Mirrors (0 products)
  - Sets (0 products)

  ## Security
  - Maintains existing RLS policies
  - No changes to product data
  - Safe deletion of only empty categories and their subcategories
*/

-- Step 1: Delete subcategories for categories we're going to update
DELETE FROM subcategories 
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE name IN ('Seating', 'Tables', 'Architectural', 'Lighting')
);

-- Step 2: Delete empty categories and their subcategories that are not in the new structure
DELETE FROM subcategories 
WHERE category_id IN (
  SELECT id FROM categories 
  WHERE name IN ('Cabinets', 'Desks', 'Industrial', 'Mirrors', 'Sets')
);

DELETE FROM categories 
WHERE name IN ('Cabinets', 'Desks', 'Industrial', 'Mirrors', 'Sets')
AND id NOT IN (SELECT DISTINCT category_id FROM products WHERE category_id IS NOT NULL);

-- Step 3: Add new categories with all required fields
INSERT INTO categories (name, slug, icon_name, display_order) 
VALUES
  ('Casegoods', 'casegoods', 'Archive', 11),
  ('Art & Decor', 'art-decor', 'Palette', 12),
  ('Fashion', 'fashion', 'Shirt', 13),
  ('Tabletop', 'tabletop', 'UtensilsCrossed', 14)
ON CONFLICT (name) DO NOTHING;

-- Step 4: Add all subcategories with slugs and display_order

-- Seating subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Desk / Office Chair', 'desk-office-chair', id, 1 FROM categories WHERE name = 'Seating'
UNION ALL
SELECT 'Rocking Chair', 'rocking-chair', id, 2 FROM categories WHERE name = 'Seating'
UNION ALL
SELECT 'Accent Chairs', 'accent-chairs', id, 3 FROM categories WHERE name = 'Seating'
UNION ALL
SELECT 'Dining', 'dining', id, 4 FROM categories WHERE name = 'Seating'
UNION ALL
SELECT 'Sofa / Loveseats / Chaise', 'sofa-loveseats-chaise', id, 5 FROM categories WHERE name = 'Seating'
UNION ALL
SELECT 'Stools / Ottomans / Benches', 'stools-ottomans-benches', id, 6 FROM categories WHERE name = 'Seating';

-- Tables subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Conference', 'conference', id, 1 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Console / Sofa', 'console-sofa', id, 2 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Pedestal', 'pedestal', id, 3 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Center', 'center', id, 4 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Coffee / Cocktail', 'coffee-cocktail', id, 5 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Dining', 'dining', id, 6 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'End & Side', 'end-side', id, 7 FROM categories WHERE name = 'Tables'
UNION ALL
SELECT 'Game', 'game', id, 8 FROM categories WHERE name = 'Tables';

-- Casegoods subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Chests', 'chests', id, 1 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Credenzas / Buffets / Dressers', 'credenzas-buffets-dressers', id, 2 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Wardrobes / Armoires / Storage', 'wardrobes-armoires-storage', id, 3 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Bar Cabinets / Cars & Servers', 'bar-cabinets-carts-servers', id, 4 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'China / Display / Bookcases', 'china-display-bookcases', id, 5 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Desks', 'desks', id, 6 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Chests of Drawers / Highboys', 'chests-drawers-highboys', id, 7 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Nightstands', 'nightstands', id, 8 FROM categories WHERE name = 'Casegoods'
UNION ALL
SELECT 'Vanities', 'vanities', id, 9 FROM categories WHERE name = 'Casegoods';

-- Architectural subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Fireplaces', 'fireplaces', id, 1 FROM categories WHERE name = 'Architectural';

-- Art & Decor subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Carpets & Rugs', 'carpets-rugs', id, 1 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT 'Room Dividers / Folding Screens', 'room-dividers-screens', id, 2 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT 'Textiles', 'textiles', id, 3 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT '2D', '2d', id, 4 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT '3D', '3d', id, 5 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT 'Decorative Accents', 'decorative-accents', id, 6 FROM categories WHERE name = 'Art & Decor'
UNION ALL
SELECT 'Mirrors / Wall Decor', 'mirrors-wall-decor', id, 7 FROM categories WHERE name = 'Art & Decor';

-- Fashion subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Clothing', 'clothing', id, 1 FROM categories WHERE name = 'Fashion'
UNION ALL
SELECT 'Hats & Belts', 'hats-belts', id, 2 FROM categories WHERE name = 'Fashion'
UNION ALL
SELECT 'Jewelry', 'jewelry', id, 3 FROM categories WHERE name = 'Fashion';

-- Lighting subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Fixtures', 'fixtures', id, 1 FROM categories WHERE name = 'Lighting'
UNION ALL
SELECT 'Lamps', 'lamps', id, 2 FROM categories WHERE name = 'Lighting';

-- Tabletop subcategories
INSERT INTO subcategories (name, slug, category_id, display_order)
SELECT 'Cookware', 'cookware', id, 1 FROM categories WHERE name = 'Tabletop';
