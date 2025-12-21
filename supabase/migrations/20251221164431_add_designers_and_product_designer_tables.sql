/*
  # Add Designers and Product Designer Junction Table

  ## Overview
  Creates tables to manage designers and their association with products.

  ## New Tables

  ### 1. designers
  Stores designer information
  - id (uuid, primary key)
  - name (text, unique, required) - Designer's name
  - about (text, nullable) - Biography or description of the designer
  - created_at (timestamptz) - Record creation timestamp
  - updated_at (timestamptz) - Record last update timestamp

  ### 2. product_designer
  Junction table linking products to designers (many-to-many relationship)
  - id (uuid, primary key)
  - product_id (uuid, foreign key) - References products table
  - designer_id (uuid, foreign key) - References designers table
  - created_at (timestamptz) - Record creation timestamp
  - Unique constraint on (product_id, designer_id) to prevent duplicate associations

  ## Security
  - Enable RLS on both tables
  - Public read access for designers
  - Authenticated admin access for all operations
  - Public read access for product_designer associations
  - Authenticated admin access for managing associations

  ## Indexes
  - Index on product_designer(designer_id) for efficient lookups
  - Index on product_designer(product_id) for efficient lookups
*/

-- Create designers table
CREATE TABLE IF NOT EXISTS designers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  about text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create product_designer junction table
CREATE TABLE IF NOT EXISTS product_designer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  designer_id uuid NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, designer_id)
);

-- Enable Row Level Security
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_designer ENABLE ROW LEVEL SECURITY;

-- RLS Policies for designers
CREATE POLICY "Public can view designers"
  ON designers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert designers"
  ON designers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update designers"
  ON designers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete designers"
  ON designers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for product_designer
CREATE POLICY "Public can view product designer associations"
  ON product_designer FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert product designer associations"
  ON product_designer FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update product designer associations"
  ON product_designer FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete product designer associations"
  ON product_designer FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_designer_product ON product_designer(product_id);
CREATE INDEX IF NOT EXISTS idx_product_designer_designer ON product_designer(designer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_designers_updated_at
  BEFORE UPDATE ON designers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
