-- ============================================
-- CREATE PROFILE AFTER USER SIGNUP
-- Run this AFTER creating user via signup page
-- ============================================

-- Step 1: Find the user that was just created
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_metadata JSONB;
  v_full_name TEXT;
  v_role TEXT;
BEGIN
  -- Get the most recently created user
  SELECT id, email, raw_user_meta_data
  INTO v_user_id, v_user_email, v_user_metadata
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Extract metadata
    v_full_name := COALESCE(v_user_metadata->>'full_name', v_user_email);
    v_role := COALESCE(v_user_metadata->>'role', 'viewer');

    -- Delete existing profile if any
    DELETE FROM user_profiles WHERE id = v_user_id;

    -- Create the profile
    INSERT INTO user_profiles (id, full_name, role, is_active, created_at, updated_at)
    VALUES (
      v_user_id,
      v_full_name,
      v_role,
      true,
      now(),
      now()
    );

    RAISE NOTICE '✅ Profile created successfully!';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_user_email;
    RAISE NOTICE 'Full Name: %', v_full_name;
    RAISE NOTICE 'Role: %', v_role;
  ELSE
    RAISE NOTICE '❌ No users found. Please create user via signup page first.';
  END IF;
END $$;

-- Step 2: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Recreate the trigger for future users
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Step 4: Verify the admin user
SELECT
  '✅ ADMIN USER CREATED' as status,
  up.id,
  up.full_name,
  up.role,
  up.is_active,
  au.email,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin';
