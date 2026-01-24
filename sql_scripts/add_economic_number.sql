-- Add economic_number column to load_orders table
-- This column stores an optional economic number for load orders

-- Add the column if it doesn't exist
ALTER TABLE load_orders ADD COLUMN IF NOT EXISTS economic_number TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN load_orders.economic_number IS 'Optional economic number for the load order';
