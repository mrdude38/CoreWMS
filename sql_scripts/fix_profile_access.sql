-- ============================================
-- FIX PROFILE ACCESS ISSUE
-- Temporarily disable RLS to allow profile reading
-- ============================================

-- Step 1: Temporarily disable RLS on user_profiles
-- This will allow authenticated users to read profiles while we debug
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Also disable RLS on roles_permissions
-- The permission checking functions need to read this table
ALTER TABLE roles_permissions DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify the admin user exists
SELECT
  '✅ Admin User Status' as status,
  up.id,
  up.full_name,
  up.role,
  up.is_active,
  au.email,
  au.confirmed_at,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.role = 'admin';

-- Step 4: Show message
DO $$
BEGIN
  RAISE NOTICE '==================================';
  RAISE NOTICE '✅ RLS temporarily disabled';
  RAISE NOTICE '==================================';
  RAISE NOTICE 'You should now be able to login';
  RAISE NOTICE 'After confirming login works, we will re-enable RLS with proper policies';
END $$;
