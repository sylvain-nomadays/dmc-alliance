-- Migration: Create about page content tables
-- Description: Tables pour stocker tous les contenus éditables de la page "Qui sommes-nous"

-- =====================================================
-- TABLE 1: about_page_settings (textes généraux)
-- =====================================================
CREATE TABLE IF NOT EXISTS about_page_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(50) NOT NULL DEFAULT 'global',

  -- Hero Section
  hero_title_fr TEXT DEFAULT 'Qui sommes-nous',
  hero_title_en TEXT DEFAULT 'About us',
  hero_subtitle_fr TEXT DEFAULT 'The DMC Alliance, c''est l''histoire d''agences locales passionnées qui s''unissent pour mieux vous servir.',
  hero_subtitle_en TEXT DEFAULT 'The DMC Alliance is the story of passionate local agencies uniting to serve you better.',
  hero_image_url TEXT,

  -- History Section
  history_title_fr TEXT DEFAULT 'Notre histoire',
  history_title_en TEXT DEFAULT 'Our story',
  history_content_fr TEXT DEFAULT 'Né de la volonté de partager notre expertise terrain, The DMC Alliance réunit les meilleurs réceptifs indépendants d''Asie, d''Afrique, d''Europe et des Amériques. Notre collectif est né d''un constat simple : les meilleures expériences de voyage sont celles créées par des passionnés qui connaissent intimement leur territoire. Chaque agence membre apporte sa connaissance unique, ses contacts privilégiés et son amour pour sa destination.',
  history_content_en TEXT DEFAULT 'Born from the desire to share our field expertise, The DMC Alliance brings together the best independent DMCs from Asia, Africa, Europe and the Americas. Our collective was born from a simple observation: the best travel experiences are those created by enthusiasts who intimately know their territory. Each member agency brings its unique knowledge, privileged contacts and love for its destination.',

  -- Mission Section
  mission_title_fr TEXT DEFAULT 'Notre mission',
  mission_title_en TEXT DEFAULT 'Our mission',
  mission_content_fr TEXT DEFAULT 'Offrir aux professionnels du voyage un accès privilégié à un réseau d''experts locaux, pour des expériences authentiques et une qualité de service irréprochable. Nous croyons que le voyage de demain sera plus responsable, plus authentique et plus personnalisé. C''est pourquoi nous mettons notre expertise collective au service de vos projets.',
  mission_content_en TEXT DEFAULT 'To offer travel professionals privileged access to a network of local experts, for authentic experiences and impeccable service quality. We believe that tomorrow''s travel will be more responsible, more authentic and more personalized. That''s why we put our collective expertise at the service of your projects.',

  -- Values Section Title
  values_title_fr TEXT DEFAULT 'Nos valeurs',
  values_title_en TEXT DEFAULT 'Our values',

  -- Timeline Section Title
  timeline_title_fr TEXT DEFAULT 'Notre parcours',
  timeline_title_en TEXT DEFAULT 'Our journey',

  -- Team/Partners Section
  team_title_fr TEXT DEFAULT 'Notre réseau de partenaires',
  team_title_en TEXT DEFAULT 'Our partner network',
  team_subtitle_fr TEXT DEFAULT 'Des femmes et des hommes passionnés aux quatre coins du monde.',
  team_subtitle_en TEXT DEFAULT 'Passionate men and women from all corners of the world.',

  -- Representatives Section
  representatives_title_fr TEXT DEFAULT 'Nos représentants commerciaux en Europe',
  representatives_title_en TEXT DEFAULT 'Our commercial representatives in Europe',
  representatives_subtitle_fr TEXT DEFAULT 'Votre point de contact privilégié pour découvrir notre réseau.',
  representatives_subtitle_en TEXT DEFAULT 'Your privileged point of contact to discover our network.',

  -- CTA Section
  cta_title_fr TEXT DEFAULT 'Rejoignez notre aventure',
  cta_title_en TEXT DEFAULT 'Join our adventure',
  cta_subtitle_fr TEXT DEFAULT 'Vous êtes une agence réceptive locale et partagez nos valeurs ? Rejoignez The DMC Alliance.',
  cta_subtitle_en TEXT DEFAULT 'Are you a local DMC and share our values? Join The DMC Alliance.',
  cta_button_fr TEXT DEFAULT 'Devenir partenaire',
  cta_button_en TEXT DEFAULT 'Become a partner',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(section)
);

-- =====================================================
-- TABLE 2: about_page_stats (statistiques)
-- =====================================================
CREATE TABLE IF NOT EXISTS about_page_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key VARCHAR(50) NOT NULL UNIQUE,
  stat_value VARCHAR(20) NOT NULL,
  label_fr VARCHAR(100) NOT NULL,
  label_en VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default stats
INSERT INTO about_page_stats (stat_key, stat_value, label_fr, label_en, display_order) VALUES
  ('destinations', '30+', 'Destinations', 'Destinations', 0),
  ('partners', '20+', 'Agences partenaires', 'Partner agencies', 1),
  ('experience', '150+', 'Années d''expérience cumulée', 'Years of combined experience', 2),
  ('travelers', '50K+', 'Voyageurs/an', 'Travelers/year', 3)
ON CONFLICT (stat_key) DO NOTHING;

-- =====================================================
-- TABLE 3: about_page_values (valeurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS about_page_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_key VARCHAR(50) NOT NULL UNIQUE,
  title_fr VARCHAR(100) NOT NULL,
  title_en VARCHAR(100) NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon_name VARCHAR(50) DEFAULT 'star',
  icon_color VARCHAR(20) DEFAULT 'terracotta',
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values
INSERT INTO about_page_values (value_key, title_fr, title_en, description_fr, description_en, icon_name, icon_color, display_order) VALUES
  ('expertise', 'Expertise terrain', 'Field expertise', 'Chaque destination est opérée par des équipes locales qui vivent et respirent leur pays.', 'Each destination is operated by local teams who live and breathe their country.', 'shield-check', 'terracotta', 0),
  ('collaboration', 'Collaboration', 'Collaboration', 'Nous partageons nos savoirs et mutualisons nos forces pour mieux vous accompagner.', 'We share our knowledge and pool our strengths to better support you.', 'users', 'deep-blue', 1),
  ('quality', 'Qualité', 'Quality', 'Sélection rigoureuse des prestataires, contrôle qualité permanent, amélioration continue.', 'Rigorous selection of providers, permanent quality control, continuous improvement.', 'star', 'sage', 2),
  ('responsibility', 'Responsabilité', 'Responsibility', 'Tourisme durable, impact positif sur les communautés locales, respect de l''environnement.', 'Sustainable tourism, positive impact on local communities, respect for the environment.', 'globe', 'terracotta', 3)
ON CONFLICT (value_key) DO NOTHING;

-- =====================================================
-- TABLE 4: about_page_milestones (timeline)
-- =====================================================
CREATE TABLE IF NOT EXISTS about_page_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year VARCHAR(10) NOT NULL,
  title_fr VARCHAR(100) NOT NULL,
  title_en VARCHAR(100) NOT NULL,
  description_fr TEXT NOT NULL,
  description_en TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default milestones
INSERT INTO about_page_milestones (year, title_fr, title_en, description_fr, description_en, display_order) VALUES
  ('2018', 'Naissance de l''idée', 'Birth of the idea', 'Rencontre entre réceptifs passionnés lors d''un salon professionnel. L''idée d''un collectif naît.', 'Meeting between passionate DMCs at a trade show. The idea of a collective is born.', 0),
  ('2019', 'Création du collectif', 'Creation of the collective', 'Fondation officielle de The DMC Alliance avec 5 agences fondatrices sur 3 continents.', 'Official foundation of The DMC Alliance with 5 founding agencies on 3 continents.', 1),
  ('2021', 'Expansion du réseau', 'Network expansion', 'Le réseau s''agrandit à 15 agences. Lancement des premiers GIR co-remplissage.', 'The network grows to 15 agencies. Launch of the first co-fill GIR tours.', 2),
  ('2024', 'Aujourd''hui', 'Today', '20+ agences locales, 30+ destinations, et une communauté grandissante de professionnels du voyage.', '20+ local agencies, 30+ destinations, and a growing community of travel professionals.', 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- about_page_settings
ALTER TABLE about_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about settings"
  ON about_page_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage about settings"
  ON about_page_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- about_page_stats
ALTER TABLE about_page_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about stats"
  ON about_page_stats FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage about stats"
  ON about_page_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- about_page_values
ALTER TABLE about_page_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about values"
  ON about_page_values FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage about values"
  ON about_page_values FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- about_page_milestones
ALTER TABLE about_page_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about milestones"
  ON about_page_milestones FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage about milestones"
  ON about_page_milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_about_stats_order ON about_page_stats(display_order);
CREATE INDEX IF NOT EXISTS idx_about_values_order ON about_page_values(display_order);
CREATE INDEX IF NOT EXISTS idx_about_milestones_order ON about_page_milestones(display_order);

-- =====================================================
-- TRIGGERS for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_about_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_about_settings_updated_at
  BEFORE UPDATE ON about_page_settings
  FOR EACH ROW EXECUTE FUNCTION update_about_updated_at();

CREATE TRIGGER trigger_about_stats_updated_at
  BEFORE UPDATE ON about_page_stats
  FOR EACH ROW EXECUTE FUNCTION update_about_updated_at();

CREATE TRIGGER trigger_about_values_updated_at
  BEFORE UPDATE ON about_page_values
  FOR EACH ROW EXECUTE FUNCTION update_about_updated_at();

CREATE TRIGGER trigger_about_milestones_updated_at
  BEFORE UPDATE ON about_page_milestones
  FOR EACH ROW EXECUTE FUNCTION update_about_updated_at();

-- Insert default settings row
INSERT INTO about_page_settings (section) VALUES ('global') ON CONFLICT (section) DO NOTHING;
