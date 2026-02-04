-- Migration: Site settings for logo, favicon and metadata
-- Date: 2025-02-04

-- Table for site-wide settings
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE DEFAULT 'global',
  site_logo_url TEXT,
  site_logo_dark_url TEXT,
  site_favicon_url TEXT,
  site_favicon_dark_url TEXT,
  site_title_fr TEXT DEFAULT 'The DMC Alliance',
  site_title_en TEXT DEFAULT 'The DMC Alliance',
  site_description_fr TEXT,
  site_description_en TEXT,
  site_og_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings (for public pages)
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Only admins can manage site settings
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_site_settings_section ON site_settings(section);

-- Insert default settings if not exists
INSERT INTO site_settings (section, site_title_fr, site_title_en)
VALUES ('global', 'The DMC Alliance', 'The DMC Alliance')
ON CONFLICT (section) DO NOTHING;
