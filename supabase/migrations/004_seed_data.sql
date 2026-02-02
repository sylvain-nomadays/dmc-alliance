-- =============================================
-- DMC Alliance - Seed Data (Demo)
-- =============================================

-- NOTE: Run this after creating an admin user via Supabase Auth
-- Then update their role to 'admin' manually or use the query below

-- =============================================
-- SAMPLE PARTNERS
-- =============================================

INSERT INTO partners (slug, name, country, region, tier, description_fr, description_en, has_gir, is_active, email, website)
VALUES
  (
    'horseback-adventure',
    'Horseback Adventure Mongolia',
    'Mongolie',
    'asia',
    'premium',
    'Spécialiste du voyage équestre et de l''aventure en Mongolie depuis 2005. Nous proposons des circuits authentiques au cœur des steppes, en immersion avec les nomades.',
    'Specialist in horseback riding and adventure travel in Mongolia since 2005. We offer authentic tours in the heart of the steppes, immersed with nomads.',
    true,
    true,
    'contact@horseback-adventure.com',
    'https://www.voyage-mongolie.com'
  ),
  (
    'kyrgyzwhat',
    'Kyrgyz''What?',
    'Kirghizistan',
    'asia',
    'premium',
    'Agence locale passionnée par les montagnes du Kirghizistan. Randonnées, treks, yourtes et aventures au cœur de l''Asie Centrale.',
    'Local agency passionate about the mountains of Kyrgyzstan. Hikes, treks, yurts and adventures in the heart of Central Asia.',
    true,
    true,
    'contact@kyrgyzwhat.com',
    'https://voyagekirghizistan.com'
  ),
  (
    'galago-expeditions',
    'Galago Expeditions',
    'Kenya',
    'africa',
    'premium',
    'Expert des safaris au Kenya et en Tanzanie. Observation de la Grande Migration, lodges de charme et expériences exclusives.',
    'Expert in safaris in Kenya and Tanzania. Great Migration observation, charming lodges and exclusive experiences.',
    true,
    true,
    'contact@galago-expeditions.com',
    'https://galago-expeditions.com'
  ),
  (
    'sawa-discovery',
    'Sawa Discovery',
    'Madagascar',
    'africa',
    'standard',
    'Découvrez Madagascar autrement avec notre équipe locale. Parcs nationaux, plages paradisiaques et rencontres authentiques.',
    'Discover Madagascar differently with our local team. National parks, paradise beaches and authentic encounters.',
    true,
    true,
    'contact@sawa-discovery.com',
    'https://sawa-discovery.com'
  ),
  (
    'morpho-evasions',
    'Morpho Evasions',
    'Costa Rica',
    'americas',
    'standard',
    'Spécialiste de l''écotourisme au Costa Rica, Panama et Colombie. Nature luxuriante, biodiversité exceptionnelle et communautés locales.',
    'Ecotourism specialist in Costa Rica, Panama and Colombia. Lush nature, exceptional biodiversity and local communities.',
    false,
    true,
    'contact@morpho-evasions.com',
    'https://morpho-evasions.com'
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SAMPLE DESTINATIONS
-- =============================================

INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'mongolie',
  'Mongolie',
  'Mongolia',
  'Mongolie',
  'asia',
  'Terre des steppes infinies et des cavaliers nomades. La Mongolie offre une expérience de voyage unique, entre traditions millénaires et paysages grandioses.',
  'Land of endless steppes and nomadic horsemen. Mongolia offers a unique travel experience, between age-old traditions and grandiose landscapes.',
  true,
  id,
  ARRAY['Steppes infinies et désert de Gobi', 'Rencontres avec les nomades', 'Nuits en yourte traditionnelle', 'Randonnées équestres'],
  'Juin - Septembre',
  '12-15 jours'
FROM partners WHERE slug = 'horseback-adventure'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'kirghizistan',
  'Kirghizistan',
  'Kyrgyzstan',
  'Kirghizistan',
  'asia',
  'Joyau méconnu de l''Asie Centrale, le Kirghizistan séduit par ses montagnes majestueuses, ses lacs d''altitude et sa culture nomade préservée.',
  'Hidden gem of Central Asia, Kyrgyzstan captivates with its majestic mountains, high-altitude lakes and preserved nomadic culture.',
  true,
  id,
  ARRAY['Lacs de montagne cristallins', 'Trek au cœur des Tian Shan', 'Yourtes et hospitalité kirghize', 'Jeux équestres traditionnels'],
  'Juin - Septembre',
  '10-14 jours'
FROM partners WHERE slug = 'kyrgyzwhat'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'kenya',
  'Kenya',
  'Kenya',
  'Kenya',
  'africa',
  'Berceau du safari, le Kenya offre une faune exceptionnelle, des paysages variés et des rencontres culturelles inoubliables avec les Masaï.',
  'Cradle of safari, Kenya offers exceptional wildlife, varied landscapes and unforgettable cultural encounters with the Maasai.',
  true,
  id,
  ARRAY['Grande Migration au Masai Mara', 'Safari dans les parcs nationaux', 'Rencontre avec les Masaï', 'Plages de l''océan Indien'],
  'Juillet - Octobre (migration)',
  '10-14 jours'
FROM partners WHERE slug = 'galago-expeditions'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'madagascar',
  'Madagascar',
  'Madagascar',
  'Madagascar',
  'africa',
  'Île-continent unique au monde, Madagascar abrite une biodiversité exceptionnelle, des paysages époustouflants et une culture riche.',
  'A unique island-continent, Madagascar is home to exceptional biodiversity, breathtaking landscapes and a rich culture.',
  true,
  id,
  ARRAY['Lémuriens et faune endémique', 'Allée des Baobabs', 'Parcs nationaux uniques', 'Plages paradisiaques de Nosy Be'],
  'Avril - Novembre',
  '12-18 jours'
FROM partners WHERE slug = 'sawa-discovery'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'costa-rica',
  'Costa Rica',
  'Costa Rica',
  'Costa Rica',
  'americas',
  'Paradis de l''écotourisme, le Costa Rica offre une nature luxuriante, une biodiversité incroyable et un engagement fort pour l''environnement.',
  'Paradise of ecotourism, Costa Rica offers lush nature, incredible biodiversity and a strong commitment to the environment.',
  true,
  id,
  ARRAY['Volcans et forêts tropicales', 'Biodiversité exceptionnelle', 'Plages des deux côtes', 'Eco-lodges durables'],
  'Décembre - Avril',
  '10-14 jours'
FROM partners WHERE slug = 'morpho-evasions'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SAMPLE CIRCUITS (GIR)
-- =============================================

INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate,
  included_fr, not_included_fr
)
SELECT
  'entre-steppe-et-desert',
  'Entre Steppe et Désert',
  'Mongolie authentique en 15 jours',
  'Un voyage complet à travers la Mongolie, des steppes verdoyantes au désert de Gobi, en passant par les montagnes de l''Altaï.',
  'A complete journey through Mongolia, from green steppes to the Gobi Desert, through the Altai mountains.',
  3490.00,
  15,
  4,
  12,
  d.id,
  p.id,
  'published',
  12.00,
  ARRAY['Vols internationaux', 'Tous les transferts', 'Pension complète', 'Guide francophone', 'Hébergement en yourte et hôtel', 'Activités mentionnées'],
  ARRAY['Assurance voyage', 'Visa', 'Boissons', 'Pourboires', 'Dépenses personnelles']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'mongolie'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate,
  included_fr, not_included_fr
)
SELECT
  'merveilles-de-kirghizie',
  'Merveilles de Kirghizie',
  'Trek et yourtes en 12 jours',
  'Découverte des plus beaux sites du Kirghizistan : lac Issyk-Kul, vallées de montagne et nuits sous yourte chez l''habitant.',
  'Discovery of the most beautiful sites of Kyrgyzstan: Lake Issyk-Kul, mountain valleys and nights in yurts with locals.',
  2290.00,
  12,
  4,
  10,
  d.id,
  p.id,
  'published',
  10.00,
  ARRAY['Vols internationaux', 'Tous les transferts', 'Pension complète', 'Guide francophone', 'Hébergement varié', 'Activités mentionnées'],
  ARRAY['Assurance voyage', 'Boissons', 'Pourboires', 'Dépenses personnelles']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'kirghizistan'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate,
  included_fr, not_included_fr
)
SELECT
  'grande-migration-masai-mara',
  'Grande Migration au Masai Mara',
  'Safari exclusif en 10 jours',
  'Assistez au plus grand spectacle animalier de la planète : la Grande Migration des gnous et zèbres dans le Masai Mara.',
  'Witness the greatest wildlife spectacle on the planet: the Great Migration of wildebeest and zebras in the Masai Mara.',
  4890.00,
  10,
  2,
  8,
  d.id,
  p.id,
  'published',
  15.00,
  ARRAY['Vols internationaux', 'Safari en 4x4 privatif', 'Pension complète', 'Guide francophone', 'Lodges de charme', 'Frais de parc'],
  ARRAY['Assurance voyage', 'Visa Kenya', 'Boissons', 'Pourboires']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'kenya'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SAMPLE DEPARTURES
-- =============================================

-- Mongolie departures 2024
INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
SELECT
  id,
  '2024-06-15',
  '2024-06-29',
  12,
  8,
  'available',
  true
FROM circuits WHERE slug = 'entre-steppe-et-desert'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
SELECT
  id,
  '2024-07-13',
  '2024-07-27',
  12,
  4,
  'available',
  false
FROM circuits WHERE slug = 'entre-steppe-et-desert'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
SELECT
  id,
  '2024-08-17',
  '2024-08-31',
  12,
  10,
  'almost_full',
  true
FROM circuits WHERE slug = 'entre-steppe-et-desert'
ON CONFLICT DO NOTHING;

-- Kenya departures 2024
INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
SELECT
  id,
  '2024-07-20',
  '2024-07-29',
  8,
  6,
  'almost_full',
  true
FROM circuits WHERE slug = 'grande-migration-masai-mara'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
SELECT
  id,
  '2024-08-10',
  '2024-08-19',
  8,
  2,
  'available',
  false
FROM circuits WHERE slug = 'grande-migration-masai-mara'
ON CONFLICT DO NOTHING;

-- =============================================
-- SAMPLE ARTICLES
-- =============================================

INSERT INTO articles (
  slug, title, title_en, excerpt, excerpt_en, category, status, is_featured,
  author_name, author_role, read_time, tags
)
VALUES
  (
    'mongolie-destination-tendance-2024',
    'Mongolie : la destination tendance de 2024',
    'Mongolia: the trending destination of 2024',
    'Découvrez pourquoi la Mongolie attire de plus en plus de voyageurs en quête d''authenticité.',
    'Discover why Mongolia is attracting more and more travelers seeking authenticity.',
    'destinations',
    'published',
    true,
    'Arnaud Delacroix',
    'Fondateur, Horseback Adventure',
    8,
    ARRAY['mongolie', 'asie', 'tendances']
  ),
  (
    'gir-co-remplissage-guide-complet',
    'GIR Co-remplissage : le guide complet pour les agences',
    'GIR Co-fill: the complete guide for agencies',
    'Tout ce que vous devez savoir sur le système GIR : fonctionnement, avantages et commissions.',
    'Everything you need to know about the GIR system: how it works, benefits, and commissions.',
    'tips',
    'published',
    true,
    'Marie Dupont',
    'Directrice commerciale',
    12,
    ARRAY['gir', 'b2b', 'guide']
  ),
  (
    'grande-migration-kenya-tanzanie',
    'Grande Migration : Kenya ou Tanzanie ?',
    'Great Migration: Kenya or Tanzania?',
    'Comparatif détaillé pour aider vos clients à choisir la meilleure option.',
    'Detailed comparison to help your clients choose the best option.',
    'destinations',
    'published',
    false,
    'Pierre Martin',
    'Expert Afrique',
    10,
    ARRAY['kenya', 'tanzanie', 'safari']
  )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- UPDATE published_at for published articles
-- =============================================

UPDATE articles
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;

UPDATE circuits
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;
