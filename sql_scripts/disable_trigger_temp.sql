-- ============================================
-- TEMPORARILY DISABLE TRIGGER TO CREATE FIRST USER
-- Execute this in Supabase SQL Editor
-- ============================================

-- Step 1: Disable the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Disable RLS on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Check status
SELECT
  'Trigger disabled - you can now create user via signup page' as status,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as trigger_exists;

-- After creating the user, run the companion script to create the profile
