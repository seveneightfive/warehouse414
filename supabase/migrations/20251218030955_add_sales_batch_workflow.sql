/*
  # Add Sales Batch Workflow System

  1. New Tables
    - `sales_batches`
      - `id` (uuid, primary key)
      - `title` (text) - e.g., "MCM Scandinavian Modern Week"
      - `submission_date` (date) - Must be a Wednesday
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to Products Table
    - Add `sales_batch_id` (uuid, nullable) - Links product to a sales batch
    - Add `prep_due_date` (date, nullable) - Preparation due date (28 days before submission)
    - Add `photo_due_date` (date, nullable) - Photo due date (21 days before submission)
    - Add `edit_due_date` (date, nullable) - Edit due date (14 days before submission)
    - Add `submission_due_date` (date, nullable) - Submission date itself
    - Add `workflow_status` (text) - Values: 'active', 'complete'
    - Update `status` to include 'inventory' value
    - Update `workflow_stage` to include new stages: 'preparation', 'photo', 'edit', 'for_submission', 'scheduled'

  3. Security
    - Enable RLS on `sales_batches` table
    - Add policies for authenticated users to manage sales batches
    - Authenticated users can view all sales batches

  4. Notes
    - Products with status='inventory' are available for scheduling into batches
    - When assigned to batch, workflow_stage becomes 'scheduled'
    - Due dates are auto-calculated based on submission_date
    - Manual workflow stage changes are still allowed
    - When approved from 'for_submission', workflow_status='complete' and status='available'
*/

-- =====================================================
-- 1. CREATE SALES_BATCHES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sales_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  submission_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_sales_batches_updated_at ON sales_batches;
CREATE TRIGGER update_sales_batches_updated_at
  BEFORE UPDATE ON sales_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for submission_date
CREATE INDEX IF NOT EXISTS idx_sales_batches_submission_date
ON sales_batches(submission_date);

-- =====================================================
-- 2. UPDATE PRODUCTS TABLE
-- =====================================================

-- Add new columns for sales batch workflow
DO $$
BEGIN
  -- Add sales_batch_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sales_batch_id'
  ) THEN
    ALTER TABLE products ADD COLUMN sales_batch_id uuid REFERENCES sales_batches(id) ON DELETE SET NULL;
  END IF;

  -- Add prep_due_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'prep_due_date'
  ) THEN
    ALTER TABLE products ADD COLUMN prep_due_date date;
  END IF;

  -- Add photo_due_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'photo_due_date'
  ) THEN
    ALTER TABLE products ADD COLUMN photo_due_date date;
  END IF;

  -- Add edit_due_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'edit_due_date'
  ) THEN
    ALTER TABLE products ADD COLUMN edit_due_date date;
  END IF;

  -- Add submission_due_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'submission_due_date'
  ) THEN
    ALTER TABLE products ADD COLUMN submission_due_date date;
  END IF;

  -- Add workflow_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE products ADD COLUMN workflow_status text DEFAULT 'active';
  END IF;
END $$;

-- Add index for sales_batch_id
CREATE INDEX IF NOT EXISTS idx_products_sales_batch_id
ON products(sales_batch_id);

-- Add index for workflow_status
CREATE INDEX IF NOT EXISTS idx_products_workflow_status
ON products(workflow_status);

-- =====================================================
-- 3. RLS POLICIES FOR SALES_BATCHES
-- =====================================================

ALTER TABLE sales_batches ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all sales batches
DROP POLICY IF EXISTS "Authenticated users can view sales batches" ON sales_batches;
CREATE POLICY "Authenticated users can view sales batches"
  ON sales_batches FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert sales batches
DROP POLICY IF EXISTS "Authenticated users can insert sales batches" ON sales_batches;
CREATE POLICY "Authenticated users can insert sales batches"
  ON sales_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update sales batches
DROP POLICY IF EXISTS "Authenticated users can update sales batches" ON sales_batches;
CREATE POLICY "Authenticated users can update sales batches"
  ON sales_batches FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete sales batches
DROP POLICY IF EXISTS "Authenticated users can delete sales batches" ON sales_batches;
CREATE POLICY "Authenticated users can delete sales batches"
  ON sales_batches FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 4. HELPER FUNCTION TO CALCULATE DUE DATES
-- =====================================================

-- Function to calculate and set due dates based on submission date
CREATE OR REPLACE FUNCTION calculate_workflow_due_dates(
  batch_id_input uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  submission_date_var date;
BEGIN
  -- Get the submission date from the sales batch
  SELECT submission_date INTO submission_date_var
  FROM sales_batches
  WHERE id = batch_id_input;

  IF submission_date_var IS NULL THEN
    RAISE EXCEPTION 'Sales batch not found';
  END IF;

  -- Update all products in this batch with calculated due dates
  UPDATE products
  SET
    prep_due_date = submission_date_var - INTERVAL '28 days',
    photo_due_date = submission_date_var - INTERVAL '21 days',
    edit_due_date = submission_date_var - INTERVAL '14 days',
    submission_due_date = submission_date_var
  WHERE sales_batch_id = batch_id_input;
END;
$$;

-- =====================================================
-- 5. VALIDATION FUNCTION FOR WEDNESDAY CHECK
-- =====================================================

-- Function to validate that submission_date is a Wednesday
CREATE OR REPLACE FUNCTION validate_submission_date_is_wednesday()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the submission_date is a Wednesday (3 = Wednesday in PostgreSQL)
  IF EXTRACT(DOW FROM NEW.submission_date) != 3 THEN
    RAISE EXCEPTION 'Submission date must be a Wednesday';
  END IF;

  RETURN NEW;
END;
$$;

-- Add trigger to validate submission_date
DROP TRIGGER IF EXISTS validate_submission_date_wednesday ON sales_batches;
CREATE TRIGGER validate_submission_date_wednesday
  BEFORE INSERT OR UPDATE ON sales_batches
  FOR EACH ROW
  EXECUTE FUNCTION validate_submission_date_is_wednesday();