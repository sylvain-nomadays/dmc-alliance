-- =====================================================
-- HOMEPAGE SETTINGS TABLE
-- =====================================================
-- Stockage des paramètres éditables de la page d'accueil

-- -----------------------------------------------------
-- Table: homepage_settings
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS homepage_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section TEXT NOT NULL UNIQUE, -- 'hero', 'stats', 'services', 'cta', etc.

    -- Hero section
    hero_title_fr TEXT,
    hero_title_en TEXT,
    hero_subtitle_fr TEXT,
    hero_subtitle_en TEXT,
    hero_image_url TEXT,
    hero_video_url TEXT,

    -- Stats section
    stats_destinations INTEGER DEFAULT 70,
    stats_partners INTEGER DEFAULT 35,
    stats_years INTEGER DEFAULT 15,
    stats_travelers INTEGER DEFAULT 25000,

    -- CTA section
    cta_title_fr TEXT,
    cta_title_en TEXT,
    cta_subtitle_fr TEXT,
    cta_subtitle_en TEXT,
    cta_button_text_fr TEXT,
    cta_button_text_en TEXT,
    cta_button_url TEXT,
    cta_background_image TEXT,

    -- Featured content (JSON arrays of IDs)
    featured_destinations TEXT[] DEFAULT '{}',
    featured_partners TEXT[] DEFAULT '{}',
    featured_circuits TEXT[] DEFAULT '{}',

    -- Meta
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_homepage_settings_section ON homepage_settings(section);

-- Enable RLS
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view homepage settings"
    ON homepage_settings FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage homepage settings"
    ON homepage_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_homepage_settings_updated_at
    BEFORE UPDATE ON homepage_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default settings
INSERT INTO homepage_settings (section, stats_destinations, stats_partners, stats_years, stats_travelers)
VALUES ('global', 70, 35, 15, 25000)
ON CONFLICT (section) DO NOTHING;
