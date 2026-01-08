-- Create function to auto-generate entry_number
CREATE OR REPLACE FUNCTION generate_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_entry_number TEXT;
BEGIN
  -- Get the next number by counting existing entries
  SELECT COUNT(*) + 1 INTO next_number FROM entries;

  -- Format as ENT-XXXX (e.g., ENT-0001, ENT-0002)
  new_entry_number := 'ENT-' || LPAD(next_number::TEXT, 4, '0');

  -- Assign to the new row
  NEW.entry_number := new_entry_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate entry_number before insert
DROP TRIGGER IF EXISTS trigger_generate_entry_number ON entries;

CREATE TRIGGER trigger_generate_entry_number
  BEFORE INSERT ON entries
  FOR EACH ROW
  WHEN (NEW.entry_number IS NULL)
  EXECUTE FUNCTION generate_entry_number();

-- Test the trigger (optional - uncomment to test)
-- INSERT INTO entries (client_id, supplier_id, entry_date, total_packages, status)
-- VALUES (
--   (SELECT id FROM clients LIMIT 1),
--   (SELECT id FROM suppliers LIMIT 1),
--   CURRENT_DATE,
--   0,
--   'pending'
-- );

-- SELECT entry_number FROM entries ORDER BY created_at DESC LIMIT 5;
