-- Update load_orders schema to support multiple entries per order
-- Execute this script in Supabase SQL Editor

-- Create load_order_items table to store multiple entries per load order
CREATE TABLE IF NOT EXISTS load_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_order_id UUID REFERENCES load_orders(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id),
  packages_quantity INTEGER NOT NULL DEFAULT 0,
  is_partial BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_load_order_items_load_order_id ON load_order_items(load_order_id);
CREATE INDEX IF NOT EXISTS idx_load_order_items_entry_id ON load_order_items(entry_id);

-- Remove entry_id from load_orders if it exists (we'll use load_order_items instead)
ALTER TABLE load_orders DROP COLUMN IF EXISTS entry_id;

-- Disable RLS on new table
ALTER TABLE load_order_items DISABLE ROW LEVEL SECURITY;

SELECT 'Load orders schema updated successfully!' as status;
