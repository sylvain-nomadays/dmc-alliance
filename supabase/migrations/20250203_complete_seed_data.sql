-- =============================================
-- DMC Alliance - Complete Seed Data
-- Ajout des partenaires et destinations manquants
-- =============================================

-- =============================================
-- ADDITIONAL PARTNERS
-- =============================================

-- Azimuth Adventure Travel (Indonésie)
INSERT INTO partners (slug, name, country, region, tier, description_fr, description_en, has_gir, is_active, email, website)
VALUES (
  'azimuth-adventure',
  'Azimuth Adventure Travel',
  'Indonésie',
  'asia',
  'premium',
  'Spécialiste de l''aventure en Indonésie, de Bali à la Papouasie. Volcans, plongée, culture et rencontres authentiques.',
  'Adventure specialist in Indonesia, from Bali to Papua. Volcanoes, diving, culture and authentic encounters.',
  true,
  true,
  'contact@azimuth-adventure.com',
  'https://azimuth-adventure.com'
)
ON CONFLICT (slug) DO NOTHING;

-- Détours Opérator (Madagascar, Mauritanie, Algérie)
INSERT INTO partners (slug, name, country, region, tier, description_fr, description_en, has_gir, is_active, email, website)
VALUES (
  'detours-operator',
  'Détours Opérator',
  'Madagascar',
  'africa',
  'premium',
  'Expert du voyage hors des sentiers battus à Madagascar, en Mauritanie et en Algérie. Aventure, désert et cultures ancestrales.',
  'Expert in off-the-beaten-track travel in Madagascar, Mauritania and Algeria. Adventure, desert and ancestral cultures.',
  true,
  true,
  'contact@detours-operator.com',
  'https://detours-operator.com'
)
ON CONFLICT (slug) DO NOTHING;

-- Pasión Andina (Pérou)
INSERT INTO partners (slug, name, country, region, tier, description_fr, description_en, has_gir, is_active, email, website)
VALUES (
  'pasion-andina',
  'Pasión Andina',
  'Pérou',
  'americas',
  'premium',
  'Agence locale passionnée par le Pérou. Du Machu Picchu à l''Amazonie, découvrez l''âme andine avec nos guides experts.',
  'Local agency passionate about Peru. From Machu Picchu to the Amazon, discover the Andean soul with our expert guides.',
  true,
  true,
  'contact@pasion-andina.com',
  'https://pasion-andina.com'
)
ON CONFLICT (slug) DO NOTHING;

-- Sawa Discovery Thaïlande (si différent de Madagascar)
INSERT INTO partners (slug, name, country, region, tier, description_fr, description_en, has_gir, is_active, email, website)
VALUES (
  'sawa-discovery-thailand',
  'Sawa Discovery Thailand',
  'Thaïlande',
  'asia',
  'standard',
  'Découvrez la Thaïlande autrement : temples bouddhistes, plages paradisiaques, cuisine raffinée et rencontres authentiques avec les locaux.',
  'Discover Thailand differently: Buddhist temples, paradise beaches, refined cuisine and authentic encounters with locals.',
  true,
  true,
  'thailand@sawa-discovery.com',
  'https://sawa-discovery.com/thailand'
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- ADDITIONAL DESTINATIONS
-- =============================================

-- Tanzanie
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'tanzanie',
  'Tanzanie',
  'Tanzania',
  'Tanzanie',
  'africa',
  'Du Serengeti au Kilimandjaro, la Tanzanie offre des paysages spectaculaires et une faune exceptionnelle. Safari inoubliable garanti.',
  'From the Serengeti to Kilimanjaro, Tanzania offers spectacular landscapes and exceptional wildlife. Unforgettable safari guaranteed.',
  true,
  id,
  ARRAY['Grande Migration au Serengeti', 'Ascension du Kilimandjaro', 'Cratère du Ngorongoro', 'Zanzibar et ses plages'],
  'Juin - Octobre',
  '10-14 jours'
FROM partners WHERE slug = 'galago-expeditions'
ON CONFLICT (slug) DO NOTHING;

-- Thaïlande
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'thailande',
  'Thaïlande',
  'Thailand',
  'Thaïlande',
  'asia',
  'Le pays du sourire vous accueille avec ses temples dorés, ses plages de rêve, sa cuisine exquise et son art de vivre unique.',
  'The Land of Smiles welcomes you with its golden temples, dream beaches, exquisite cuisine and unique way of life.',
  true,
  id,
  ARRAY['Temples de Bangkok et Chiang Mai', 'Plages du Sud (Krabi, Phuket)', 'Cuisine thaïlandaise', 'Tribus des montagnes du Nord'],
  'Novembre - Février',
  '10-15 jours'
FROM partners WHERE slug = 'sawa-discovery-thailand'
ON CONFLICT (slug) DO NOTHING;

-- Indonésie
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'indonesie',
  'Indonésie',
  'Indonesia',
  'Indonésie',
  'asia',
  'Archipel aux mille îles, l''Indonésie fascine par sa diversité : temples de Java, rizières de Bali, dragons de Komodo et forêts de Bornéo.',
  'Archipelago of a thousand islands, Indonesia fascinates with its diversity: temples of Java, rice terraces of Bali, Komodo dragons and forests of Borneo.',
  true,
  id,
  ARRAY['Temples de Borobudur et Prambanan', 'Rizières en terrasses de Bali', 'Dragons de Komodo', 'Orangs-outans de Bornéo'],
  'Mai - Septembre',
  '12-18 jours'
FROM partners WHERE slug = 'azimuth-adventure'
ON CONFLICT (slug) DO NOTHING;

-- Pérou
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'perou',
  'Pérou',
  'Peru',
  'Pérou',
  'americas',
  'Des mystères du Machu Picchu aux lignes de Nazca, le Pérou dévoile une civilisation fascinante et des paysages à couper le souffle.',
  'From the mysteries of Machu Picchu to the Nazca lines, Peru reveals a fascinating civilization and breathtaking landscapes.',
  true,
  id,
  ARRAY['Machu Picchu', 'Lac Titicaca', 'Lignes de Nazca', 'Amazonie péruvienne', 'Cusco et la Vallée Sacrée'],
  'Mai - Septembre',
  '12-16 jours'
FROM partners WHERE slug = 'pasion-andina'
ON CONFLICT (slug) DO NOTHING;

-- Ouganda (pour Galago Expeditions)
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'ouganda',
  'Ouganda',
  'Uganda',
  'Ouganda',
  'africa',
  'La perle de l''Afrique offre une expérience unique : gorilles des montagnes, chimpanzés, savanes et le mythique Nil.',
  'The Pearl of Africa offers a unique experience: mountain gorillas, chimpanzees, savannas and the legendary Nile.',
  true,
  id,
  ARRAY['Gorilles des montagnes de Bwindi', 'Chimpanzés de Kibale', 'Safari à Queen Elizabeth NP', 'Source du Nil'],
  'Juin - Septembre, Décembre - Février',
  '10-14 jours'
FROM partners WHERE slug = 'galago-expeditions'
ON CONFLICT (slug) DO NOTHING;

-- Mauritanie (pour Détours Opérator)
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'mauritanie',
  'Mauritanie',
  'Mauritania',
  'Mauritanie',
  'africa',
  'Déserts infinis, cités anciennes et caravanes : la Mauritanie est une destination d''aventure pour les voyageurs en quête d''absolu.',
  'Endless deserts, ancient cities and caravans: Mauritania is an adventure destination for travelers seeking the absolute.',
  true,
  id,
  ARRAY['Désert de l''Adrar', 'Cités anciennes de Chinguetti et Ouadane', 'Train du désert', 'Banc d''Arguin'],
  'Novembre - Mars',
  '8-12 jours'
FROM partners WHERE slug = 'detours-operator'
ON CONFLICT (slug) DO NOTHING;

-- Algérie (pour Détours Opérator)
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'algerie',
  'Algérie',
  'Algeria',
  'Algérie',
  'africa',
  'Le plus grand pays d''Afrique recèle des trésors : le Sahara, les montagnes du Hoggar, la Casbah d''Alger et des sites romains exceptionnels.',
  'The largest country in Africa holds treasures: the Sahara, the Hoggar mountains, the Casbah of Algiers and exceptional Roman sites.',
  true,
  id,
  ARRAY['Tassili n''Ajjer et art rupestre', 'Montagnes du Hoggar', 'Casbah d''Alger (UNESCO)', 'Sites romains de Tipaza et Djemila'],
  'Octobre - Avril',
  '10-15 jours'
FROM partners WHERE slug = 'detours-operator'
ON CONFLICT (slug) DO NOTHING;

-- Panama (pour Morpho Evasions)
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'panama',
  'Panama',
  'Panama',
  'Panama',
  'americas',
  'Entre deux océans, le Panama offre une nature préservée, des communautés indigènes et le mythique canal qui relie les Amériques.',
  'Between two oceans, Panama offers preserved nature, indigenous communities and the legendary canal that connects the Americas.',
  true,
  id,
  ARRAY['Canal de Panama', 'Archipel de San Blas', 'Forêt tropicale de Darién', 'Bocas del Toro'],
  'Décembre - Avril',
  '10-14 jours'
FROM partners WHERE slug = 'morpho-evasions'
ON CONFLICT (slug) DO NOTHING;

-- Colombie (pour Morpho Evasions)
INSERT INTO destinations (slug, name, name_en, country, region, description_fr, description_en, is_active, partner_id, highlights, best_time, ideal_duration)
SELECT
  'colombie',
  'Colombie',
  'Colombia',
  'Colombie',
  'americas',
  'La Colombie séduit par sa diversité : Caraïbes, Andes, Amazonie, villes coloniales et une culture vibrante.',
  'Colombia seduces with its diversity: Caribbean, Andes, Amazon, colonial cities and a vibrant culture.',
  true,
  id,
  ARRAY['Carthagène des Indes', 'Vallée de Cocora', 'Cité perdue (Ciudad Perdida)', 'Café colombien', 'Bogota et Medellín'],
  'Décembre - Mars, Juillet - Août',
  '12-18 jours'
FROM partners WHERE slug = 'morpho-evasions'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- ADDITIONAL CIRCUITS (GIR)
-- =============================================

-- Circuit Tanzanie
INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate, is_featured,
  included_fr, not_included_fr
)
SELECT
  'serengeti-migration-safari',
  'Safari Grande Migration',
  'Serengeti & Ngorongoro en 12 jours',
  'Vivez l''expérience ultime du safari africain : la Grande Migration au Serengeti et le cratère du Ngorongoro, avec lodges de charme.',
  'Experience the ultimate African safari: the Great Migration in the Serengeti and the Ngorongoro Crater, with charming lodges.',
  5290.00,
  12,
  4,
  10,
  d.id,
  p.id,
  'published',
  12.00,
  true,
  ARRAY['Vols internationaux', 'Safari en 4x4 privatif', 'Pension complète', 'Guide francophone', 'Lodges et camps de charme', 'Frais de parcs'],
  ARRAY['Assurance voyage', 'Visa Tanzanie', 'Boissons', 'Pourboires']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'tanzanie'
ON CONFLICT (slug) DO NOTHING;

-- Circuit Indonésie
INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate, is_featured,
  included_fr, not_included_fr
)
SELECT
  'java-bali-komodo',
  'Java, Bali & Komodo',
  'L''essentiel de l''Indonésie en 15 jours',
  'Des temples millénaires de Java aux dragons de Komodo en passant par les rizières de Bali : un voyage complet au cœur de l''archipel.',
  'From the ancient temples of Java to the Komodo dragons via the rice terraces of Bali: a complete journey to the heart of the archipelago.',
  3890.00,
  15,
  4,
  12,
  d.id,
  p.id,
  'published',
  10.00,
  true,
  ARRAY['Vols internationaux', 'Tous les transferts', 'Pension complète', 'Guide francophone', 'Hôtels charme et boutique', 'Activités mentionnées'],
  ARRAY['Assurance voyage', 'Visa si requis', 'Boissons', 'Pourboires']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'indonesie'
ON CONFLICT (slug) DO NOTHING;

-- Circuit Pérou
INSERT INTO circuits (
  slug, title, subtitle, description_fr, description_en,
  price_from, duration_days, group_size_min, group_size_max,
  destination_id, partner_id, status, commission_rate, is_featured,
  included_fr, not_included_fr
)
SELECT
  'tresors-du-perou',
  'Trésors du Pérou',
  'Du Machu Picchu au lac Titicaca en 14 jours',
  'Découverte complète du Pérou : Lima, Cusco, Machu Picchu, Vallée Sacrée et lac Titicaca avec immersion dans la culture andine.',
  'Complete discovery of Peru: Lima, Cusco, Machu Picchu, Sacred Valley and Lake Titicaca with immersion in Andean culture.',
  3690.00,
  14,
  4,
  12,
  d.id,
  p.id,
  'published',
  12.00,
  true,
  ARRAY['Vols internationaux', 'Tous les transferts', 'Petit-déjeuner et certains repas', 'Guide francophone', 'Hôtels charme', 'Entrées aux sites'],
  ARRAY['Assurance voyage', 'Repas non mentionnés', 'Boissons', 'Pourboires']
FROM destinations d
JOIN partners p ON d.partner_id = p.id
WHERE d.slug = 'perou'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- DEPARTURES FOR NEW CIRCUITS (2025-2026)
-- =============================================

-- Départs Tanzanie
INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-07-15', '2025-07-26', 10, 4, 'open', 5290.00, true
FROM circuits WHERE slug = 'serengeti-migration-safari'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-08-12', '2025-08-23', 10, 2, 'open', 5290.00, false
FROM circuits WHERE slug = 'serengeti-migration-safari'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-09-10', '2025-09-21', 10, 0, 'open', 4990.00, false
FROM circuits WHERE slug = 'serengeti-migration-safari'
ON CONFLICT DO NOTHING;

-- Départs Indonésie
INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-06-01', '2025-06-15', 12, 6, 'open', 3890.00, true
FROM circuits WHERE slug = 'java-bali-komodo'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-07-20', '2025-08-03', 12, 3, 'open', 3890.00, false
FROM circuits WHERE slug = 'java-bali-komodo'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-09-15', '2025-09-29', 12, 0, 'open', 3690.00, false
FROM circuits WHERE slug = 'java-bali-komodo'
ON CONFLICT DO NOTHING;

-- Départs Pérou
INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-05-10', '2025-05-23', 12, 5, 'open', 3690.00, true
FROM circuits WHERE slug = 'tresors-du-perou'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-06-15', '2025-06-28', 12, 2, 'open', 3690.00, false
FROM circuits WHERE slug = 'tresors-du-perou'
ON CONFLICT DO NOTHING;

INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, price, is_guaranteed)
SELECT id, '2025-08-01', '2025-08-14', 12, 0, 'open', 3490.00, false
FROM circuits WHERE slug = 'tresors-du-perou'
ON CONFLICT DO NOTHING;

-- =============================================
-- UPDATE published_at for new circuits
-- =============================================

UPDATE circuits
SET published_at = created_at
WHERE status = 'published' AND published_at IS NULL;

-- Mark new circuits as featured
UPDATE circuits
SET is_featured = true
WHERE slug IN ('serengeti-migration-safari', 'java-bali-komodo', 'tresors-du-perou');
