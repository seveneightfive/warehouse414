/*
  # Create Admin Whitelist System

  1. New Tables
    - `admin_whitelist`
      - `id` (uuid, primary key)
      - `email` (text, unique) - Email address of authorized admin
      - `created_at` (timestamptz) - When the admin was added
      - `created_by` (uuid) - Who added this admin (nullable for initial setup)
      - `is_active` (boolean) - Whether this admin is currently active

  2. Security
    - Enable RLS on `admin_whitelist` table
    - Only authenticated users can read the whitelist (to check their own access)
    - Only existing admins can add new admins to the whitelist

  3. Initial Data
    - Add seveneightfive@gmail.com as the first admin for testing

  4. Helper Function
    - `is_admin(user_email text)` - Returns true if the email is in the admin whitelist
*/

-- Create admin whitelist table
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read the whitelist (to check if they're admins)
CREATE POLICY "Authenticated users can read admin whitelist"
  ON admin_whitelist
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert new admins
CREATE POLICY "Admins can add new admins"
  ON admin_whitelist
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = auth.jwt()->>'email'
      AND is_active = true
    )
  );

-- Policy: Only admins can update whitelist
CREATE POLICY "Admins can update whitelist"
  ON admin_whitelist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_whitelist
      WHERE email = auth.jwt()->>'email'
      AND is_active = true
    )
  );

-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_whitelist
    WHERE email = user_email
    AND is_active = true
  );
$$;

-- Add the first admin for testing
INSERT INTO admin_whitelist (email, is_active)
VALUES ('seveneightfive@gmail.com', true)
ON CONFLICT (email) DO NOTHING;
