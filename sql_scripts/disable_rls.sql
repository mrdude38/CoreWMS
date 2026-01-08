-- Disable Row Level Security temporarily for development
-- This allows all operations without authentication

-- Disable RLS on all tables
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE carriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE load_orders DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('clients', 'suppliers', 'carriers', 'package_types', 'users', 'entries', 'load_orders')
ORDER BY tablename;
