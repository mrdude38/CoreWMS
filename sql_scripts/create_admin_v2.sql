-- ============================================
-- CREATE FIRST ADMIN USER - Version 2
-- Execute this in Supabase SQL Editor
-- ============================================

-- Step 1: Temporarily disable the trigger to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Temporarily disable RLS on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Check if there are any users in auth.users
DO $$
DECLARE
  v_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM auth.users;
  RAISE NOTICE 'Total users in auth.users: %', v_user_count;
END $$;

-- Step 4: List all users in auth.users (to see what we have)
SELECT id, email, created_at, confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Step 5: Create admin profile for the most recent user
-- If you see your user in the list above, this will create the profile
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get the most recently created user
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Delete existing profile if any (in case it was created incorrectly)
    DELETE FROM user_profiles WHERE id = v_user_id;

    -- Create the admin profile
    INSERT INTO user_profiles (id, full_name, role, is_active, created_at, updated_at)
    VALUES (
      v_user_id,
      COALESCE(v_user_email, 'System Admin'),
      'admin',
      true,
      now(),
      now()
    );

    RAISE NOTICE '✅ Admin profile created successfully!';
    RAISE NOTICE 'Email: %', v_user_email;
    RAISE NOTICE 'User ID: %', v_user_id;
  ELSE
    RAISE NOTICE '❌ No users found in auth.users';
    RAISE NOTICE 'You need to create a user first in Authentication -> Users in Supabase Dashboard';
  END IF;
END $$;

-- Step 6: Re-enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate the trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Step 8: Verify the admin user was created correctly
SELECT
  '✅ VERIFICATION' as status,
  up.id,
  up.full_name,
  up.role,
  up.is_active,
  au.email,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin';

-- Final message
DO $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_admin_count
  FROM user_profiles
  WHERE role = 'admin';

  IF v_admin_count > 0 THEN
    RAISE NOTICE '==================================';
    RAISE NOTICE '✅ SUCCESS! Admin user created!';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'You can now login at http://localhost:3000';
  ELSE
    RAISE NOTICE '==================================';
    RAISE NOTICE '❌ FAILED - No admin user found';
    RAISE NOTICE '==================================';
    RAISE NOTICE 'Please check the messages above';
  END IF;
END $$;
