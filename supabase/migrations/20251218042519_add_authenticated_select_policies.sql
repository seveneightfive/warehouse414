/*
  # Add Authenticated User SELECT Policies

  1. Problem
    - Products are not visible to authenticated users (admins)
    - Only public users can view products due to missing authenticated SELECT policy
    - Admins need to see ALL products regardless of workflow stage or status

  2. Changes
    - Add SELECT policy for authenticated users on products table
    - Verify and add missing authenticated SELECT policies on related tables
    - Authenticated users should have full visibility for management purposes
    - Public users remain restricted to only listed products

  3. Tables Updated
    - products: Add authenticated SELECT policy for all products
    - product_sales: Add authenticated SELECT policy
    - consignors: Add authenticated SELECT policy
    - sales_batches: Add authenticated SELECT policy
    - hold_interest_notifications: Add authenticated SELECT policy
    - pdf_downloads: Add authenticated SELECT policy
    - sku_counters: Add authenticated SELECT policy

  4. Security
    - Public users: Only see products with workflow_stage='listed' and status IN ('available', 'on_hold', 'sold')
    - Authenticated users: See ALL products for management purposes
    - Maintains secure separation between public and admin access
*/

-- =====================================================
-- ADD AUTHENTICATED SELECT POLICY FOR PRODUCTS
-- =====================================================

CREATE POLICY "Authenticated users can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- ADD AUTHENTICATED SELECT POLICIES FOR OTHER TABLES
-- =====================================================

-- Product Sales: Authenticated users need to view all sales data
DROP POLICY IF EXISTS "Authenticated users can view sales" ON product_sales;
CREATE POLICY "Authenticated users can view sales"
  ON product_sales FOR SELECT
  TO authenticated
  USING (true);

-- Consignors: Authenticated users need to view all consignors
DROP POLICY IF EXISTS "Authenticated users can view consignors" ON consignors;
CREATE POLICY "Authenticated users can view consignors"
  ON consignors FOR SELECT
  TO authenticated
  USING (true);

-- Sales Batches: Authenticated users need to view all batches
DROP POLICY IF EXISTS "Authenticated users can view sales batches" ON sales_batches;
CREATE POLICY "Authenticated users can view sales batches"
  ON sales_batches FOR SELECT
  TO authenticated
  USING (true);

-- Hold Interest Notifications: Authenticated users need to view all notifications
DROP POLICY IF EXISTS "Authenticated users can view hold interest notifications" ON hold_interest_notifications;
CREATE POLICY "Authenticated users can view hold interest notifications"
  ON hold_interest_notifications FOR SELECT
  TO authenticated
  USING (true);

-- PDF Downloads: Authenticated users need to view all download records
DROP POLICY IF EXISTS "Authenticated users can view pdf downloads" ON pdf_downloads;
CREATE POLICY "Authenticated users can view pdf downloads"
  ON pdf_downloads FOR SELECT
  TO authenticated
  USING (true);

-- SKU Counters: Authenticated users need to view counters for SKU generation
DROP POLICY IF EXISTS "Authenticated users can view sku counters" ON sku_counters;
CREATE POLICY "Authenticated users can view sku counters"
  ON sku_counters FOR SELECT
  TO authenticated
  USING (true);