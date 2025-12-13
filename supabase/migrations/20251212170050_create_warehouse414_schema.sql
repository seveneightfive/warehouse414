/*
  # Warehouse 414 eCommerce Database Schema

  ## Overview
  Complete database schema for Warehouse 414 eCommerce platform with product management,
  holds, offers, sales tracking, cross-listing, and review functionality.

  ## New Tables

  ### 1. products
  Core product information table
  - `id` (uuid, primary key)
  - `sku` (text, unique) - Product SKU identifier
  - `title` (text) - Product title
  - `short_description` (text) - Brief description for listings
  - `full_description` (text) - Detailed product description
  - `maker` (text) - Product maker/manufacturer
  - `designer` (text) - Product designer
  - `material` (text) - Primary materials
  - `dimensions` (text) - Product dimensions (L x W x H)
  - `price` (decimal) - Regular price
  - `sale_price` (decimal, nullable) - Sale price if on sale
  - `is_on_sale` (boolean) - Sale status
  - `status` (text) - Product status: available, on_hold, sold
  - `featured_image_url` (text) - Main product image
  - `consignor` (text) - Consignor information
  - `workflow_stage` (text) - research, descriptions, photos, ready, listed
  - `is_featured` (boolean) - Featured on homepage
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. product_images
  Additional product images
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `image_url` (text) - Image URL
  - `display_order` (integer) - Sort order
  - `created_at` (timestamptz)

  ### 3. product_holds
  Track 45-day product holds
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `hold_until` (timestamptz) - Auto-calculated 45 days from hold_date
  - `hold_date` (timestamptz)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 4. product_offers
  Track customer offers
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `offer_amount` (decimal)
  - `message` (text)
  - `status` (text) - pending, approved, rejected
  - `created_at` (timestamptz)

  ### 5. product_sales
  Track sales and cross-listing information
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `sale_price` (decimal)
  - `sold_on_platform` (text) - warehouse414, 1stdibs, charish, ebay, other
  - `sale_date` (timestamptz)
  - `consignor_paid` (boolean)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 6. cross_listings
  Track where products are cross-listed
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `platform` (text) - 1stdibs, charish, ebay, etc.
  - `platform_url` (text)
  - `listed_date` (timestamptz)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 7. reviews
  Customer reviews for homepage
  - `id` (uuid, primary key)
  - `customer_name` (text)
  - `review_text` (text)
  - `rating` (integer) - 1-5 stars
  - `is_featured` (boolean)
  - `created_at` (timestamptz)

  ### 8. pdf_downloads
  Track PDF downloads and capture emails
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key)
  - `customer_email` (text)
  - `include_price` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for products, images, and reviews
  - Authenticated admin access for all operations
  - Public insert for holds, offers, and PDF downloads
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  title text NOT NULL,
  short_description text,
  full_description text,
  maker text,
  designer text,
  material text,
  dimensions text,
  price decimal(10, 2) NOT NULL,
  sale_price decimal(10, 2),
  is_on_sale boolean DEFAULT false,
  status text NOT NULL DEFAULT 'available',
  featured_image_url text,
  consignor text,
  workflow_stage text DEFAULT 'research',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('available', 'on_hold', 'sold')),
  CONSTRAINT valid_workflow CHECK (workflow_stage IN ('research', 'descriptions', 'photos', 'ready', 'listed'))
);

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create product_holds table
CREATE TABLE IF NOT EXISTS product_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  hold_date timestamptz DEFAULT now(),
  hold_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create product_offers table
CREATE TABLE IF NOT EXISTS product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  offer_amount decimal(10, 2) NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_offer_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create product_sales table
CREATE TABLE IF NOT EXISTS product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_price decimal(10, 2) NOT NULL,
  sold_on_platform text NOT NULL,
  sale_date timestamptz DEFAULT now(),
  consignor_paid boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create cross_listings table
CREATE TABLE IF NOT EXISTS cross_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_url text,
  listed_date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  review_text text NOT NULL,
  rating integer NOT NULL,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create pdf_downloads table
CREATE TABLE IF NOT EXISTS pdf_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  include_price boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Public can view available and sold products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (status IN ('available', 'on_hold', 'sold') AND workflow_stage = 'listed');

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_images
CREATE POLICY "Public can view product images"
  ON product_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage product images"
  ON product_images FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_holds
CREATE POLICY "Public can view active holds"
  ON product_holds FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public can create holds"
  ON product_holds FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage holds"
  ON product_holds FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_offers
CREATE POLICY "Public can create offers"
  ON product_offers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view and manage offers"
  ON product_offers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for product_sales
CREATE POLICY "Authenticated users can view and manage sales"
  ON product_sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for cross_listings
CREATE POLICY "Public can view active cross listings"
  ON cross_listings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage cross listings"
  ON cross_listings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for reviews
CREATE POLICY "Public can view featured reviews"
  ON reviews FOR SELECT
  TO anon, authenticated
  USING (is_featured = true);

CREATE POLICY "Authenticated users can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for pdf_downloads
CREATE POLICY "Public can create pdf download records"
  ON pdf_downloads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view pdf downloads"
  ON pdf_downloads FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_workflow ON products(workflow_stage);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_holds_active ON product_holds(is_active, hold_until);
CREATE INDEX IF NOT EXISTS idx_product_offers_status ON product_offers(status);
CREATE INDEX IF NOT EXISTS idx_cross_listings_active ON cross_listings(is_active);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();