-- ============================================
-- COREWMS AUTHENTICATION & AUTHORIZATION
-- Complete Migration Script
-- Execute in Supabase SQL Editor
-- ============================================

-- STEP 1: Rename existing users table to warehouse_operators
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users RENAME TO warehouse_operators;
        RAISE NOTICE 'Table users renamed to warehouse_operators';
    END IF;
END $$;

-- STEP 2: Create user_profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- STEP 3: Create roles_permissions table
CREATE TABLE IF NOT EXISTS roles_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
  resource TEXT NOT NULL,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, resource)
);

-- STEP 4: Insert default permissions
INSERT INTO roles_permissions (role, resource, can_create, can_read, can_update, can_delete) VALUES
-- Admin: Full access
('admin', 'catalogs', true, true, true, true),
('admin', 'entries', true, true, true, true),
('admin', 'load_orders', true, true, true, true),
('admin', 'users', true, true, true, true),
('admin', 'reports', true, true, true, true),

-- Manager: Manage warehouse, approve exits, view reports
('manager', 'catalogs', true, true, true, false),
('manager', 'entries', true, true, true, false),
('manager', 'load_orders', true, true, true, true),
('manager', 'users', false, true, false, false),
('manager', 'reports', false, true, false, false),

-- Operator: Create entries, view assigned orders, mark exits
('operator', 'catalogs', false, true, false, false),
('operator', 'entries', true, true, true, false),
('operator', 'load_orders', false, true, true, false),
('operator', 'users', false, false, false, false),
('operator', 'reports', false, true, false, false),

-- Viewer: Read-only access
('viewer', 'catalogs', false, true, false, false),
('viewer', 'entries', false, true, false, false),
('viewer', 'load_orders', false, true, false, false),
('viewer', 'users', false, false, false, false),
('viewer', 'reports', false, true, false, false)
ON CONFLICT (role, resource) DO NOTHING;

-- STEP 5: Create helper functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_has_permission(
  p_resource TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  has_perm BOOLEAN;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  IF user_role IS NULL THEN RETURN false; END IF;

  CASE p_action
    WHEN 'create' THEN SELECT can_create INTO has_perm FROM roles_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'read' THEN SELECT can_read INTO has_perm FROM roles_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'update' THEN SELECT can_update INTO has_perm FROM roles_permissions WHERE role = user_role AND resource = p_resource;
    WHEN 'delete' THEN SELECT can_delete INTO has_perm FROM roles_permissions WHERE role = user_role AND resource = p_resource;
    ELSE RETURN false;
  END CASE;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Create trigger to auto-create user profiles on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- STEP 7: Update foreign key constraints for entries
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'entries_received_by_fkey') THEN
        ALTER TABLE entries DROP CONSTRAINT entries_received_by_fkey;
    END IF;

    ALTER TABLE entries
      ADD CONSTRAINT entries_received_by_fkey
        FOREIGN KEY (received_by)
        REFERENCES warehouse_operators(id);
END $$;

-- STEP 8: Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles_permissions ENABLE ROW LEVEL SECURITY;

-- STEP 9: Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can create profiles" ON user_profiles;
CREATE POLICY "Admins can create profiles"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- STEP 10: Create RLS policies for catalogs (clients, suppliers, carriers, package_types)
-- All authenticated users can read, but only those with permission can modify
DROP POLICY IF EXISTS "Authenticated users can read clients" ON clients;
CREATE POLICY "Authenticated users can read clients" ON clients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users with permission can create clients" ON clients;
CREATE POLICY "Users with permission can create clients" ON clients FOR INSERT TO authenticated WITH CHECK (user_has_permission('catalogs', 'create'));
DROP POLICY IF EXISTS "Users with permission can update clients" ON clients;
CREATE POLICY "Users with permission can update clients" ON clients FOR UPDATE TO authenticated USING (user_has_permission('catalogs', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete clients" ON clients;
CREATE POLICY "Users with permission can delete clients" ON clients FOR DELETE TO authenticated USING (user_has_permission('catalogs', 'delete'));

DROP POLICY IF EXISTS "Authenticated users can read suppliers" ON suppliers;
CREATE POLICY "Authenticated users can read suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users with permission can create suppliers" ON suppliers;
CREATE POLICY "Users with permission can create suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (user_has_permission('catalogs', 'create'));
DROP POLICY IF EXISTS "Users with permission can update suppliers" ON suppliers;
CREATE POLICY "Users with permission can update suppliers" ON suppliers FOR UPDATE TO authenticated USING (user_has_permission('catalogs', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete suppliers" ON suppliers;
CREATE POLICY "Users with permission can delete suppliers" ON suppliers FOR DELETE TO authenticated USING (user_has_permission('catalogs', 'delete'));

DROP POLICY IF EXISTS "Authenticated users can read carriers" ON carriers;
CREATE POLICY "Authenticated users can read carriers" ON carriers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users with permission can create carriers" ON carriers;
CREATE POLICY "Users with permission can create carriers" ON carriers FOR INSERT TO authenticated WITH CHECK (user_has_permission('catalogs', 'create'));
DROP POLICY IF EXISTS "Users with permission can update carriers" ON carriers;
CREATE POLICY "Users with permission can update carriers" ON carriers FOR UPDATE TO authenticated USING (user_has_permission('catalogs', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete carriers" ON carriers;
CREATE POLICY "Users with permission can delete carriers" ON carriers FOR DELETE TO authenticated USING (user_has_permission('catalogs', 'delete'));

DROP POLICY IF EXISTS "Authenticated users can read package_types" ON package_types;
CREATE POLICY "Authenticated users can read package_types" ON package_types FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users with permission can create package_types" ON package_types;
CREATE POLICY "Users with permission can create package_types" ON package_types FOR INSERT TO authenticated WITH CHECK (user_has_permission('catalogs', 'create'));
DROP POLICY IF EXISTS "Users with permission can update package_types" ON package_types;
CREATE POLICY "Users with permission can update package_types" ON package_types FOR UPDATE TO authenticated USING (user_has_permission('catalogs', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete package_types" ON package_types;
CREATE POLICY "Users with permission can delete package_types" ON package_types FOR DELETE TO authenticated USING (user_has_permission('catalogs', 'delete'));

-- STEP 11: Create RLS policies for entries
DROP POLICY IF EXISTS "Authenticated users can read entries" ON entries;
CREATE POLICY "Authenticated users can read entries" ON entries FOR SELECT TO authenticated USING (user_has_permission('entries', 'read'));
DROP POLICY IF EXISTS "Users with permission can create entries" ON entries;
CREATE POLICY "Users with permission can create entries" ON entries FOR INSERT TO authenticated WITH CHECK (user_has_permission('entries', 'create'));
DROP POLICY IF EXISTS "Users with permission can update entries" ON entries;
CREATE POLICY "Users with permission can update entries" ON entries FOR UPDATE TO authenticated USING (user_has_permission('entries', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete entries" ON entries;
CREATE POLICY "Users with permission can delete entries" ON entries FOR DELETE TO authenticated USING (user_has_permission('entries', 'delete'));

-- STEP 12: Create RLS policies for load_orders and load_order_items
DROP POLICY IF EXISTS "Authenticated users can read load_orders" ON load_orders;
CREATE POLICY "Authenticated users can read load_orders" ON load_orders FOR SELECT TO authenticated USING (user_has_permission('load_orders', 'read'));
DROP POLICY IF EXISTS "Users with permission can create load_orders" ON load_orders;
CREATE POLICY "Users with permission can create load_orders" ON load_orders FOR INSERT TO authenticated WITH CHECK (user_has_permission('load_orders', 'create'));
DROP POLICY IF EXISTS "Users with permission can update load_orders" ON load_orders;
CREATE POLICY "Users with permission can update load_orders" ON load_orders FOR UPDATE TO authenticated USING (user_has_permission('load_orders', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete load_orders" ON load_orders;
CREATE POLICY "Users with permission can delete load_orders" ON load_orders FOR DELETE TO authenticated USING (user_has_permission('load_orders', 'delete'));

DROP POLICY IF EXISTS "Authenticated users can read load_order_items" ON load_order_items;
CREATE POLICY "Authenticated users can read load_order_items" ON load_order_items FOR SELECT TO authenticated USING (user_has_permission('load_orders', 'read'));
DROP POLICY IF EXISTS "Users with permission can create load_order_items" ON load_order_items;
CREATE POLICY "Users with permission can create load_order_items" ON load_order_items FOR INSERT TO authenticated WITH CHECK (user_has_permission('load_orders', 'create'));
DROP POLICY IF EXISTS "Users with permission can update load_order_items" ON load_order_items;
CREATE POLICY "Users with permission can update load_order_items" ON load_order_items FOR UPDATE TO authenticated USING (user_has_permission('load_orders', 'update'));
DROP POLICY IF EXISTS "Users with permission can delete load_order_items" ON load_order_items;
CREATE POLICY "Users with permission can delete load_order_items" ON load_order_items FOR DELETE TO authenticated USING (user_has_permission('load_orders', 'delete'));

-- STEP 13: Create RLS policies for warehouse_operators
DROP POLICY IF EXISTS "Authenticated users can read warehouse_operators" ON warehouse_operators;
CREATE POLICY "Authenticated users can read warehouse_operators" ON warehouse_operators FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins can manage warehouse_operators" ON warehouse_operators;
CREATE POLICY "Admins can manage warehouse_operators" ON warehouse_operators FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- STEP 14: Create RLS policies for roles_permissions
DROP POLICY IF EXISTS "Authenticated users can read permissions" ON roles_permissions;
CREATE POLICY "Authenticated users can read permissions" ON roles_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins can modify permissions" ON roles_permissions;
CREATE POLICY "Only admins can modify permissions" ON roles_permissions FOR ALL TO authenticated USING (get_user_role() = 'admin');

-- Migration completed
SELECT
  'Authentication system enabled successfully!' as status,
  COUNT(*) FILTER (WHERE table_name = 'user_profiles') as user_profiles_created,
  COUNT(*) FILTER (WHERE table_name = 'roles_permissions') as roles_permissions_created,
  COUNT(*) FILTER (WHERE table_name = 'warehouse_operators') as warehouse_operators_renamed
FROM information_schema.tables
WHERE table_name IN ('user_profiles', 'roles_permissions', 'warehouse_operators');
