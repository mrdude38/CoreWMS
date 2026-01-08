-- ============================================
-- CREATE FIRST ADMIN USER
-- Execute this in Supabase SQL Editor
-- ============================================

-- Temporarily disable RLS on user_profiles to create first admin
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create admin user via auth.users (replace with your email and desired password)
-- Note: You'll need to use Supabase's auth.signup function or do this via the Auth API
-- This script will create the profile for an existing auth user

-- Method 1: If you already created a user in the Dashboard but it failed to create profile
-- Replace 'your-user-id-here' with the actual user ID from auth.users
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the most recently created user (assuming that's the one you just tried to create)
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_user_id) THEN
      -- Create the admin profile
      INSERT INTO user_profiles (id, full_name, role, is_active)
      VALUES (
        v_user_id,
        COALESCE(v_user_email, 'System Admin'),
        'admin',
        true
      );

      RAISE NOTICE 'Admin profile created for user: % (ID: %)', v_user_email, v_user_id;
    ELSE
      RAISE NOTICE 'Profile already exists for user: %', v_user_email;
    END IF;
  ELSE
    RAISE NOTICE 'No users found in auth.users. Please create a user first via Authentication -> Users in Dashboard';
  END IF;
END $$;

-- Re-enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the admin was created
SELECT
  up.id,
  up.full_name,
  up.role,
  up.is_active,
  au.email,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin';
