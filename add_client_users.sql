-- Migration: Add Client Users Support
-- Description: Adds client_id to user_profiles and updates role constraint to include 'client' role
-- This allows users to be assigned to specific clients and see only their client's data

-- Step 1: Add client_id column to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Step 2: Add index for performance
CREATE INDEX idx_user_profiles_client_id ON user_profiles(client_id);

-- Step 3: Update role constraint to include 'client'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'client'));

-- Step 4: Add comment
COMMENT ON COLUMN user_profiles.client_id IS 'Client assignment for client role users. NULL for internal staff roles.';

-- Step 5: Update RLS Policies for entries
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read entries" ON entries;
DROP POLICY IF EXISTS "Authenticated users can read entries" ON entries;

-- New policy for entries: Internal roles see all, clients see only their client's entries
CREATE POLICY "Users can read entries based on role" ON entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        -- Internal roles see everything
        up.role IN ('admin', 'manager', 'operator', 'viewer')
        -- Clients see only their client's entries
        OR (up.role = 'client' AND entries.client_id = up.client_id)
      )
    )
  );

-- Step 6: Update RLS Policies for load_orders
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read load_orders" ON load_orders;
DROP POLICY IF EXISTS "Authenticated users can read load_orders" ON load_orders;

-- New policy for load_orders: Same pattern as entries
CREATE POLICY "Users can read load_orders based on role" ON load_orders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        -- Internal roles see everything
        up.role IN ('admin', 'manager', 'operator', 'viewer')
        -- Clients see only their client's load orders
        OR (up.role = 'client' AND load_orders.client_id = up.client_id)
      )
    )
  );

-- Step 7: Policy for creating load orders (clients can create for their own client)
CREATE POLICY "Clients can create load orders for their client" ON load_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND (
        -- Internal roles can create for any client
        up.role IN ('admin', 'manager', 'operator')
        -- Clients can only create for their assigned client
        OR (up.role = 'client' AND load_orders.client_id = up.client_id)
      )
    )
  );

-- Step 8: Update roles_permissions table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles_permissions') THEN
    -- Update constraint
    ALTER TABLE roles_permissions DROP CONSTRAINT IF EXISTS roles_permissions_role_check;
    ALTER TABLE roles_permissions ADD CONSTRAINT roles_permissions_role_check
      CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'client'));

    -- Insert client permissions
    INSERT INTO roles_permissions (role, resource, can_create, can_read, can_update, can_delete)
    VALUES
      ('client', 'catalogs', false, true, false, false),
      ('client', 'entries', false, true, false, false),
      ('client', 'load_orders', true, true, false, false),
      ('client', 'users', false, false, false, false),
      ('client', 'reports', false, true, false, false)
    ON CONFLICT (role, resource) DO UPDATE SET
      can_create = EXCLUDED.can_create,
      can_read = EXCLUDED.can_read,
      can_update = EXCLUDED.can_update,
      can_delete = EXCLUDED.can_delete;
  END IF;
END $$;

-- Verification queries (commented out - uncomment to run checks)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_profiles' AND column_name = 'client_id';

-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'user_profiles'::regclass AND conname LIKE '%role%';
