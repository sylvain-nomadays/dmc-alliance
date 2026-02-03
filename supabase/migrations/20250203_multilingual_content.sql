-- Migration: Add multilingual support (6 languages) to content tables
-- Reference language: French (fr)
-- Target languages: English (en), German (de), Dutch (nl), Spanish (es), Italian (it)
-- Date: 2025-02-03

-- ============================================
-- DESTINATIONS TABLE
-- ============================================

-- Add missing language columns to destinations
ALTER TABLE destinations
  ADD COLUMN IF NOT EXISTS name_de VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name_nl VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name_es VARCHAR(255),
  ADD COLUMN IF NOT EXISTS name_it VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_nl TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS description_it TEXT,
  ADD COLUMN IF NOT EXISTS highlights_en TEXT[], -- Array of highlights
  ADD COLUMN IF NOT EXISTS highlights_de TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_nl TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_es TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_it TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_fr TEXT[],
  ADD COLUMN IF NOT EXISTS best_time_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS best_time_de VARCHAR(255),
  ADD COLUMN IF NOT EXISTS best_time_nl VARCHAR(255),
  ADD COLUMN IF NOT EXISTS best_time_es VARCHAR(255),
  ADD COLUMN IF NOT EXISTS best_time_it VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ideal_duration_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ideal_duration_de VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ideal_duration_nl VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ideal_duration_es VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ideal_duration_it VARCHAR(255),
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- Rename name to name_fr if not already done
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destinations' AND column_name = 'name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'destinations' AND column_name = 'name_fr') THEN
    ALTER TABLE destinations RENAME COLUMN name TO name_fr;
  END IF;
END $$;

-- ============================================
-- ARTICLES TABLE
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS title_de VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_nl VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_es VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_it VARCHAR(500),
  ADD COLUMN IF NOT EXISTS excerpt_de TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_nl TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_es TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_it TEXT,
  ADD COLUMN IF NOT EXISTS content_de TEXT,
  ADD COLUMN IF NOT EXISTS content_nl TEXT,
  ADD COLUMN IF NOT EXISTS content_es TEXT,
  ADD COLUMN IF NOT EXISTS content_it TEXT,
  ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_title_de VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_title_nl VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_title_es VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_title_it VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meta_description_en TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_de TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_nl TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_es TEXT,
  ADD COLUMN IF NOT EXISTS meta_description_it TEXT,
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- ============================================
-- CIRCUITS TABLE
-- ============================================

ALTER TABLE circuits
  ADD COLUMN IF NOT EXISTS title_en VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_de VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_nl VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_es VARCHAR(500),
  ADD COLUMN IF NOT EXISTS title_it VARCHAR(500),
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_nl TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS description_it TEXT,
  ADD COLUMN IF NOT EXISTS highlights_en TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_de TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_nl TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_es TEXT[],
  ADD COLUMN IF NOT EXISTS highlights_it TEXT[],
  ADD COLUMN IF NOT EXISTS included_en TEXT[],
  ADD COLUMN IF NOT EXISTS included_de TEXT[],
  ADD COLUMN IF NOT EXISTS included_nl TEXT[],
  ADD COLUMN IF NOT EXISTS included_es TEXT[],
  ADD COLUMN IF NOT EXISTS included_it TEXT[],
  ADD COLUMN IF NOT EXISTS not_included_en TEXT[],
  ADD COLUMN IF NOT EXISTS not_included_de TEXT[],
  ADD COLUMN IF NOT EXISTS not_included_nl TEXT[],
  ADD COLUMN IF NOT EXISTS not_included_es TEXT[],
  ADD COLUMN IF NOT EXISTS not_included_it TEXT[],
  ADD COLUMN IF NOT EXISTS itinerary_en JSONB,
  ADD COLUMN IF NOT EXISTS itinerary_de JSONB,
  ADD COLUMN IF NOT EXISTS itinerary_nl JSONB,
  ADD COLUMN IF NOT EXISTS itinerary_es JSONB,
  ADD COLUMN IF NOT EXISTS itinerary_it JSONB,
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- ============================================
-- PARTNERS TABLE
-- ============================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS description_de TEXT,
  ADD COLUMN IF NOT EXISTS description_nl TEXT,
  ADD COLUMN IF NOT EXISTS description_es TEXT,
  ADD COLUMN IF NOT EXISTS description_it TEXT,
  ADD COLUMN IF NOT EXISTS expertise_en TEXT[],
  ADD COLUMN IF NOT EXISTS expertise_de TEXT[],
  ADD COLUMN IF NOT EXISTS expertise_nl TEXT[],
  ADD COLUMN IF NOT EXISTS expertise_es TEXT[],
  ADD COLUMN IF NOT EXISTS expertise_it TEXT[],
  ADD COLUMN IF NOT EXISTS expertise_fr TEXT[],
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- ============================================
-- EMAIL TEMPLATES TABLE (already exists)
-- ============================================

ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS subject_de VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_nl VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_es VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_it VARCHAR(500),
  ADD COLUMN IF NOT EXISTS body_de TEXT,
  ADD COLUMN IF NOT EXISTS body_nl TEXT,
  ADD COLUMN IF NOT EXISTS body_es TEXT,
  ADD COLUMN IF NOT EXISTS body_it TEXT,
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- ============================================
-- NEWSLETTER CAMPAIGNS TABLE
-- ============================================

ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS subject_de VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_nl VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_es VARCHAR(500),
  ADD COLUMN IF NOT EXISTS subject_it VARCHAR(500),
  ADD COLUMN IF NOT EXISTS content_de TEXT,
  ADD COLUMN IF NOT EXISTS content_nl TEXT,
  ADD COLUMN IF NOT EXISTS content_es TEXT,
  ADD COLUMN IF NOT EXISTS content_it TEXT,
  ADD COLUMN IF NOT EXISTS translations_updated_at TIMESTAMPTZ;

-- ============================================
-- TRANSLATION JOBS TABLE (for tracking async translations)
-- ============================================

CREATE TABLE IF NOT EXISTS translation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- 'destination', 'article', 'circuit', etc.
  content_id UUID NOT NULL,
  source_locale VARCHAR(5) DEFAULT 'fr',
  target_locales TEXT[] NOT NULL, -- ['en', 'de', 'nl', 'es', 'it']
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- 0-100
  results JSONB DEFAULT '[]',
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_translation_jobs_content ON translation_jobs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status);

-- ============================================
-- HELPER FUNCTION: Get content in specific locale with fallback
-- ============================================

CREATE OR REPLACE FUNCTION get_localized_text(
  content_fr TEXT,
  content_en TEXT,
  content_de TEXT,
  content_nl TEXT,
  content_es TEXT,
  content_it TEXT,
  target_locale VARCHAR(5)
) RETURNS TEXT AS $$
BEGIN
  CASE target_locale
    WHEN 'fr' THEN RETURN COALESCE(content_fr, content_en, content_fr);
    WHEN 'en' THEN RETURN COALESCE(content_en, content_fr);
    WHEN 'de' THEN RETURN COALESCE(content_de, content_en, content_fr);
    WHEN 'nl' THEN RETURN COALESCE(content_nl, content_en, content_fr);
    WHEN 'es' THEN RETURN COALESCE(content_es, content_en, content_fr);
    WHEN 'it' THEN RETURN COALESCE(content_it, content_en, content_fr);
    ELSE RETURN COALESCE(content_fr, content_en);
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN destinations.translations_updated_at IS 'Timestamp when translations were last auto-generated';
COMMENT ON COLUMN articles.translations_updated_at IS 'Timestamp when translations were last auto-generated';
COMMENT ON COLUMN circuits.translations_updated_at IS 'Timestamp when translations were last auto-generated';
COMMENT ON TABLE translation_jobs IS 'Tracks async translation jobs for content';
