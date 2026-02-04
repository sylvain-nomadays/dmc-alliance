-- Migration: Add contact info and social links to site_settings
-- Date: 2025-02-05

-- Contact information
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_address_fr TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_address_en TEXT;

-- Social links
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_youtube TEXT;
