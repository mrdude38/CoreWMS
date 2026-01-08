-- ============================================
-- DIAGNOSE PROFILE ISSUE
-- Check what's happening with the user profile
-- ============================================

-- Step 1: Check if user exists in auth.users
SELECT
  'Users in auth.users' as check_name,
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Check if profile exists in user_profiles
SELECT
  'Profiles in user_profiles' as check_name,
  id,
  full_name,
  role,
  is_active,
  created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Step 3: Check RLS status
SELECT
  'RLS Status' as check_name,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('user_profiles', 'roles_permissions')
ORDER BY tablename;

-- Step 4: Check existing policies on user_profiles
SELECT
  'Policies on user_profiles' as check_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
