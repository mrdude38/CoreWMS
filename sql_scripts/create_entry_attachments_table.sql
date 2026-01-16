-- Entry attachments table for storing file metadata
-- Files are stored in Vercel Blob storage, the full blob URL is stored in the database
CREATE TABLE IF NOT EXISTS entry_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  blob_url TEXT NOT NULL,  -- Full URL in Vercel Blob storage
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_entry_attachments_entry_id ON entry_attachments(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_attachments_created_at ON entry_attachments(created_at DESC);

-- Enable RLS
ALTER TABLE entry_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entry_attachments
-- Authenticated users can view attachments for entries they have access to
CREATE POLICY "Users can view entry attachments"
  ON entry_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.id = entry_attachments.entry_id
    )
  );

-- Admins, managers, and operators can insert attachments
CREATE POLICY "Staff can insert entry attachments"
  ON entry_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'operator')
    )
  );

-- Admins and managers can delete attachments
CREATE POLICY "Admins and managers can delete entry attachments"
  ON entry_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

COMMENT ON TABLE entry_attachments IS 'File attachments for warehouse entries, stored in Vercel Blob';
COMMENT ON COLUMN entry_attachments.blob_url IS 'Full URL to the file in Vercel Blob storage';
