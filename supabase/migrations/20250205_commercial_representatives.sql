-- Migration: Create commercial_representatives table
-- Description: Table pour stocker les représentants commerciaux en Europe

CREATE TABLE IF NOT EXISTS commercial_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  photo_url TEXT,
  linkedin_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  bio_fr TEXT,
  bio_en TEXT,
  region VARCHAR(50) DEFAULT 'Europe',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE commercial_representatives ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active representatives
CREATE POLICY "Public can view active representatives"
  ON commercial_representatives FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all representatives
CREATE POLICY "Admins can manage representatives"
  ON commercial_representatives FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_commercial_representatives_order ON commercial_representatives(display_order);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_commercial_representatives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commercial_representatives_updated_at
  BEFORE UPDATE ON commercial_representatives
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_representatives_updated_at();
