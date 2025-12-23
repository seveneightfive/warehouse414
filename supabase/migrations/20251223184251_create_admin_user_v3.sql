/*
  # Create Admin User for Warehouse414

  1. New Users
    - Creates admin user with email sales@warehouse414.com
    - Password is set to LoveMy414Dashboard!
    
  2. Security
    - Adds email to admin_whitelist table to grant admin access
    - Sets email as confirmed to allow immediate login
*/

-- Create the admin user with specified credentials
DO $$
DECLARE
  new_user_id uuid;
  user_exists boolean;
BEGIN
  -- Check if user already exists
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'sales@warehouse414.com'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    -- Generate a new user ID
    new_user_id := gen_random_uuid();
    
    -- Insert the user into auth.users table
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'sales@warehouse414.com',
      crypt('LoveMy414Dashboard!', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      'authenticated'
    );

    -- Create identity record with provider_id
    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id::text,
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', 'sales@warehouse414.com'),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- Add to admin whitelist (using ON CONFLICT since this table has a unique constraint on email)
  INSERT INTO public.admin_whitelist (email, is_active, created_at)
  VALUES ('sales@warehouse414.com', true, now())
  ON CONFLICT (email) DO UPDATE SET is_active = true;
  
END $$;