/*
  # Fix generate_sku Function to Work with Categories Table

  1. Changes
    - Update generate_sku function to generate category code from name
    - Remove dependency on non-existent "code" column in categories table
    - Generate 3-letter uppercase abbreviation from category name

  2. Notes
    - Function now generates category abbreviation dynamically
    - Matches original implementation before security fixes
    - Works with current database schema
*/

CREATE OR REPLACE FUNCTION generate_sku(
  consignor_code_input text,
  category_id_input uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  category_name text;
  category_code text;
  current_counter integer;
  new_sku text;
BEGIN
  -- Get category name and generate 3-letter code
  SELECT name INTO category_name
  FROM categories
  WHERE id = category_id_input;

  IF category_name IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;

  -- Generate 3-letter category code (uppercase)
  category_code := UPPER(LEFT(REGEXP_REPLACE(category_name, '[^a-zA-Z]', '', 'g'), 3));

  -- Insert or update counter for this consignor-category combination
  INSERT INTO sku_counters (consignor_code, category_id, counter)
  VALUES (consignor_code_input, category_id_input, 1)
  ON CONFLICT (consignor_code, category_id)
  DO UPDATE SET 
    counter = sku_counters.counter + 1,
    last_updated = now()
  RETURNING counter INTO current_counter;

  -- Generate SKU: CONSIGNORCODE-CATEGORYCODE-INCREMENT
  new_sku := consignor_code_input || '-' || category_code || '-' || LPAD(current_counter::text, 4, '0');

  RETURN new_sku;
END;
$$;
