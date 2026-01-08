-- ============================================
-- PREPARE SYSTEM FOR FIRST USER SIGNUP
-- Execute this in Supabase SQL Editor
-- ============================================

-- Step 1: Temporarily disable RLS on user_profiles
-- This allows the trigger to create the first admin profile without restrictions
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Make sure the trigger exists and handles conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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

  RAISE NOTICE 'Profile created for user: %', NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Step 3: Show current state
SELECT
  'System prepared for signup!' as status,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles;

-- Step 4: Show completion message
DO $$
BEGIN
  RAISE NOTICE '==================================';
  RAISE NOTICE '✅ System ready for user creation';
  RAISE NOTICE '==================================';
  RAISE NOTICE 'RLS temporarily disabled on user_profiles';
  RAISE NOTICE 'Trigger recreated with better error handling';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Create user via signup page';
END $$;
