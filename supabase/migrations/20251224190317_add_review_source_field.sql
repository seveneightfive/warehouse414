/*
  # Add review_source field to reviews table

  1. Changes
    - Add `review_source` column to `reviews` table
      - Text field to store the platform or source name (e.g., "1stDibs Customer", "Chairish Customer")
      - Nullable to support existing reviews without breaking them
      - Defaults to customer_name for backward compatibility
  
  2. Notes
    - Existing reviews will have NULL review_source initially
    - The customer_name field is retained for backward compatibility but won't be displayed
    - The rating field remains in the database but won't be displayed in the UI
*/

-- Add review_source column to reviews table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'review_source'
  ) THEN
    ALTER TABLE reviews ADD COLUMN review_source text;
  END IF;
END $$;
