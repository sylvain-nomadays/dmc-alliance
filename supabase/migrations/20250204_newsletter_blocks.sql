-- Migration: Add block-based newsletter support
-- Adds JSONB columns for storing newsletter blocks and template settings

-- Add new columns to newsletter_campaigns
ALTER TABLE newsletter_campaigns
ADD COLUMN IF NOT EXISTS blocks_fr JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS blocks_en JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS template_settings JSONB DEFAULT '{}'::jsonb;

-- Update target_audience to support language segmentation
-- First check if the constraint exists and update the column type
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'newsletter_campaigns_target_audience_check'
    AND table_name = 'newsletter_campaigns'
  ) THEN
    ALTER TABLE newsletter_campaigns DROP CONSTRAINT newsletter_campaigns_target_audience_check;
  END IF;

  -- Add new constraint with expanded options
  ALTER TABLE newsletter_campaigns
  ADD CONSTRAINT newsletter_campaigns_target_audience_check
  CHECK (target_audience IN ('all', 'fr', 'en', 'agencies', 'partners', 'custom'));
EXCEPTION
  WHEN others THEN
    -- If the column doesn't have a constraint, just continue
    NULL;
END $$;

-- Add locale column to newsletter_subscribers if not exists
ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'fr';

-- Create index for locale filtering
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_locale
ON newsletter_subscribers(locale)
WHERE is_active = true;

-- Add comment for documentation
COMMENT ON COLUMN newsletter_campaigns.blocks_fr IS 'JSON array of newsletter blocks for French version';
COMMENT ON COLUMN newsletter_campaigns.blocks_en IS 'JSON array of newsletter blocks for English version';
COMMENT ON COLUMN newsletter_campaigns.template_settings IS 'JSON object with template styling settings';
COMMENT ON COLUMN newsletter_subscribers.locale IS 'Subscriber language preference (fr, en)';
