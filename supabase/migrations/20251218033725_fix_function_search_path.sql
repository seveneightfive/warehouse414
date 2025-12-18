/*
  # Fix Function Search Path Security Issue

  1. Changes
    - Update validate_submission_date_is_wednesday function with immutable search_path
    - This prevents potential security vulnerabilities from search_path manipulation

  2. Security
    - Sets search_path to 'public, pg_temp' to prevent malicious schema injection
*/

-- Recreate validate_submission_date_is_wednesday with immutable search_path
CREATE OR REPLACE FUNCTION validate_submission_date_is_wednesday()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if the submission_date is a Wednesday (3 = Wednesday in PostgreSQL)
  IF EXTRACT(DOW FROM NEW.submission_date) != 3 THEN
    RAISE EXCEPTION 'Submission date must be a Wednesday';
  END IF;

  RETURN NEW;
END;
$$;