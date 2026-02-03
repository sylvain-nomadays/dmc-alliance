-- Migration: Add services section to homepage_settings
-- Date: 2025-02-03

-- Add services section columns to homepage_settings
ALTER TABLE homepage_settings
  ADD COLUMN IF NOT EXISTS services_title_fr TEXT DEFAULT 'Une solution pour chaque besoin',
  ADD COLUMN IF NOT EXISTS services_title_en TEXT DEFAULT 'A solution for every need',
  ADD COLUMN IF NOT EXISTS services_subtitle_fr TEXT DEFAULT 'Que vous cherchiez du sur-mesure, des voyages de groupe ou des départs garantis, notre réseau vous accompagne.',
  ADD COLUMN IF NOT EXISTS services_subtitle_en TEXT DEFAULT 'Whether you''re looking for tailor-made trips, group travel or guaranteed departures, our network supports you.',
  ADD COLUMN IF NOT EXISTS service_tailor_made JSONB DEFAULT '{
    "title_fr": "Voyages sur-mesure",
    "title_en": "Tailor-made trips",
    "description_fr": "Créez des itinéraires uniques avec nos DMC experts locaux.",
    "description_en": "Create unique itineraries with our local DMC experts.",
    "image_url": "/images/services/tailor-made.jpg",
    "features_fr": ["Conseil personnalisé", "Expertise locale", "Flexibilité totale"],
    "features_en": ["Personalized advice", "Local expertise", "Total flexibility"]
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS service_groups JSONB DEFAULT '{
    "title_fr": "Groupes",
    "title_en": "Group travel",
    "description_fr": "Organisez des voyages de groupe avec un accompagnement dédié.",
    "description_en": "Organize group trips with dedicated support.",
    "image_url": "/images/services/groups.jpg",
    "features_fr": ["Tarifs négociés", "Logistique complète", "Accompagnement"],
    "features_en": ["Negotiated rates", "Complete logistics", "Support"]
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS service_gir JSONB DEFAULT '{
    "title_fr": "GIR - Départs garantis",
    "title_en": "GIR - Guaranteed departures",
    "description_fr": "Rejoignez des départs garantis avec commission attractive.",
    "description_en": "Join guaranteed departures with attractive commission.",
    "image_url": "/images/services/gir.jpg",
    "features_fr": ["Départs confirmés", "Commission attractive", "Sans risque"],
    "features_en": ["Confirmed departures", "Attractive commission", "Risk-free"]
  }'::jsonb;

-- Update default CTA background image path
UPDATE homepage_settings
SET cta_background_image = '/images/cta/collaboration.jpg'
WHERE cta_background_image = '/images/cta-background.jpg' OR cta_background_image IS NULL;
