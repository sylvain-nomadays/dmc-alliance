-- Migration: Add is_gir column to circuits table
-- Date: 2025-02-03
-- Purpose: Distinguish GIR (Groupes à Itinéraire Réservé) circuits from regular circuits

-- Add is_gir column to circuits table
ALTER TABLE circuits
  ADD COLUMN IF NOT EXISTS is_gir BOOLEAN DEFAULT false;

-- Create index for faster queries on GIR circuits
CREATE INDEX IF NOT EXISTS idx_circuits_is_gir ON circuits(is_gir) WHERE is_gir = true;

-- Comment for documentation
COMMENT ON COLUMN circuits.is_gir IS 'Indicates if this circuit is a GIR (Groupe à Itinéraire Réservé) for co-filling with agencies';
