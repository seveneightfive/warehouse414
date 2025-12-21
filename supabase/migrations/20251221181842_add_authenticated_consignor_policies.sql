/*
  # Add Authenticated User Policies for Consignors

  1. Problem
    - Authenticated users can only SELECT consignors
    - They cannot INSERT, UPDATE, or DELETE consignors
    - The Add Consignor form in inventory management fails for logged-in users

  2. Changes
    - Add INSERT policy for authenticated users on consignors table
    - Add UPDATE policy for authenticated users on consignors table
    - Add DELETE policy for authenticated users on consignors table

  3. Security
    - Authenticated users (admins) should have full CRUD access to consignors
    - Public users maintain their existing access
*/

-- Add INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert consignors"
  ON consignors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update consignors"
  ON consignors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete consignors"
  ON consignors FOR DELETE
  TO authenticated
  USING (true);
