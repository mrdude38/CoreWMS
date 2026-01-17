-- Create entry_revisions table
CREATE TABLE IF NOT EXISTS entry_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  invoice_number VARCHAR(100),
  reviewer_id UUID,
  review_time_minutes INTEGER DEFAULT 0,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  num_bultos INTEGER DEFAULT 0,
  num_tarimas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entry_id)
);

-- Create entry_revision_items table
CREATE TABLE IF NOT EXISTS entry_revision_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES entry_revisions(id) ON DELETE CASCADE,
  partida_number INTEGER NOT NULL,
  description TEXT,
  brand VARCHAR(100),
  model VARCHAR(100),
  part_number VARCHAR(100),
  serial_number VARCHAR(100),
  origin VARCHAR(100),
  quantity DECIMAL(10,2) DEFAULT 0,
  unit_of_measure VARCHAR(50),
  weight_kg DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entry_revisions_entry_id ON entry_revisions(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_revision_items_revision_id ON entry_revision_items(revision_id);

-- Enable RLS
ALTER TABLE entry_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_revision_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entry_revisions
CREATE POLICY "Users can view entry revisions" ON entry_revisions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert entry revisions" ON entry_revisions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update entry revisions" ON entry_revisions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete entry revisions" ON entry_revisions
  FOR DELETE USING (true);

-- RLS Policies for entry_revision_items
CREATE POLICY "Users can view revision items" ON entry_revision_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert revision items" ON entry_revision_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update revision items" ON entry_revision_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete revision items" ON entry_revision_items
  FOR DELETE USING (true);

-- Add invoice_url column to entries for storing the uploaded invoice document
ALTER TABLE entries ADD COLUMN IF NOT EXISTS invoice_url TEXT;
