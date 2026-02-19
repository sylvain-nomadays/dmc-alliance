-- Add specialties column to partners table
-- This column was referenced in the registration code but never added via migration
ALTER TABLE partners ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

COMMENT ON COLUMN partners.specialties IS 'Spécialités du DMC (culture, aventure, luxe, etc.)';
