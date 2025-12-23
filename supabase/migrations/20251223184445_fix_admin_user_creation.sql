/*
  # Fix Admin User Creation

  1. Changes
    - Removes the manually created admin user that's causing authentication errors
    - The admin whitelist entry remains active for when user signs up properly
    
  2. Notes
    - User should sign up normally through the application
    - Email sales@warehouse414.com is already whitelisted for admin access
*/

-- Delete the manually created user and associated identity
DO $$
DECLARE
  user_id_to_delete uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO user_id_to_delete
  FROM auth.users
  WHERE email = 'sales@warehouse414.com';
  
  IF user_id_to_delete IS NOT NULL THEN
    -- Delete identity first (foreign key constraint)
    DELETE FROM auth.identities
    WHERE user_id = user_id_to_delete;
    
    -- Delete the user
    DELETE FROM auth.users
    WHERE id = user_id_to_delete;
  END IF;
  
  -- Ensure email is in admin whitelist (should already be there)
  INSERT INTO public.admin_whitelist (email, is_active, created_at)
  VALUES ('sales@warehouse414.com', true, now())
  ON CONFLICT (email) DO UPDATE SET is_active = true;
END $$;