-- Add inspection fields to entries table
ALTER TABLE entries
ADD COLUMN IF NOT EXISTS has_invoice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_revision BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_classification BOOLEAN DEFAULT FALSE;

-- Create index for filtering by inspection status
CREATE INDEX IF NOT EXISTS idx_entries_inspection_status
ON entries(has_invoice, has_revision, has_classification);

COMMENT ON COLUMN entries.has_invoice IS 'Whether the entry has an associated invoice';
COMMENT ON COLUMN entries.has_revision IS 'Whether the entry has been revised';
COMMENT ON COLUMN entries.has_classification IS 'Whether the entry has been classified';
