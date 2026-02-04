-- Migration: Add footer logo column to site_settings
-- Date: 2025-02-05

-- Add column for footer logo (white version for dark background)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS site_footer_logo_url TEXT;
