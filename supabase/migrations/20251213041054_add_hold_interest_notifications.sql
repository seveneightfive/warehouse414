/*
  # Add hold interest notifications table

  1. New Tables
    - `hold_interest_notifications`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `customer_name` (text)
      - `customer_email` (text)
      - `customer_phone` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `hold_interest_notifications` table
    - Add policy for inserting notifications (public access for form submissions)
    - Add policy for authenticated users to view all notifications (admin access)
*/

CREATE TABLE IF NOT EXISTS hold_interest_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hold_interest_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit hold interest notifications"
  ON hold_interest_notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view hold interest notifications"
  ON hold_interest_notifications
  FOR SELECT
  TO authenticated
  USING (true);