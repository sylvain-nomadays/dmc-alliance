-- Migration: Seed GIR circuits with departures
-- Date: 2025-02-04
-- Purpose: Add test data for GIR circuits display in agency portal

-- 1. Marquer certains circuits existants comme GIR
UPDATE circuits
SET is_gir = true
WHERE slug IN (
  'vietnam-essentiel',
  'japon-authentique',
  'thailande-du-nord',
  'bali-authentique',
  'sri-lanka-decouverte'
) AND is_gir = false;

-- 2. Si aucun circuit n'existe, en créer quelques-uns
-- D'abord vérifier qu'on a des destinations
DO $$
DECLARE
    vietnam_dest_id UUID;
    japan_dest_id UUID;
    thailand_dest_id UUID;
    circuit_vietnam_id UUID;
    circuit_japan_id UUID;
    circuit_thailand_id UUID;
BEGIN
    -- Récupérer les IDs des destinations
    SELECT id INTO vietnam_dest_id FROM destinations WHERE slug = 'vietnam' LIMIT 1;
    SELECT id INTO japan_dest_id FROM destinations WHERE slug = 'japon' LIMIT 1;
    SELECT id INTO thailand_dest_id FROM destinations WHERE slug = 'thailande' LIMIT 1;

    -- Créer des circuits GIR s'ils n'existent pas
    IF NOT EXISTS (SELECT 1 FROM circuits WHERE is_gir = true LIMIT 1) THEN
        -- Circuit Vietnam
        INSERT INTO circuits (
            slug, title, subtitle, description_fr, description_en,
            price_from, duration_days, group_size_min, group_size_max,
            destination_id, status, commission_rate, is_featured, is_gir
        ) VALUES (
            'gir-vietnam-essentiel-2025',
            'Vietnam Essentiel - Départ Garanti',
            'Du Nord au Sud, 15 jours inoubliables',
            'Découvrez les incontournables du Vietnam avec ce circuit à départ garanti. De Hanoi à Ho Chi Minh en passant par la baie d''Ha Long et Hoi An.',
            'Discover the must-sees of Vietnam with this guaranteed departure circuit. From Hanoi to Ho Chi Minh via Ha Long Bay and Hoi An.',
            2450.00, 15, 6, 16,
            vietnam_dest_id, 'published', 12.00, true, true
        ) RETURNING id INTO circuit_vietnam_id;

        -- Circuit Japon
        INSERT INTO circuits (
            slug, title, subtitle, description_fr, description_en,
            price_from, duration_days, group_size_min, group_size_max,
            destination_id, status, commission_rate, is_featured, is_gir
        ) VALUES (
            'gir-japon-traditionnel-2025',
            'Japon Traditionnel - Départ Garanti',
            'Tokyo, Kyoto et les Alpes Japonaises',
            'Un voyage au cœur du Japon traditionnel. Temples millénaires, jardins zen et ryokans authentiques.',
            'A journey to the heart of traditional Japan. Ancient temples, zen gardens and authentic ryokans.',
            3890.00, 12, 6, 14,
            japan_dest_id, 'published', 10.00, true, true
        ) RETURNING id INTO circuit_japan_id;

        -- Circuit Thaïlande
        INSERT INTO circuits (
            slug, title, subtitle, description_fr, description_en,
            price_from, duration_days, group_size_min, group_size_max,
            destination_id, status, commission_rate, is_featured, is_gir
        ) VALUES (
            'gir-thailande-nord-2025',
            'Thaïlande du Nord - Départ Garanti',
            'Chiang Mai et le Triangle d''Or',
            'Explorez le nord authentique de la Thaïlande : temples dorés, villages ethniques et nature luxuriante.',
            'Explore the authentic north of Thailand: golden temples, ethnic villages and lush nature.',
            1850.00, 10, 6, 16,
            thailand_dest_id, 'published', 15.00, false, true
        ) RETURNING id INTO circuit_thailand_id;

        -- Ajouter des départs pour chaque circuit
        IF circuit_vietnam_id IS NOT NULL THEN
            INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed, price)
            VALUES
                (circuit_vietnam_id, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '45 days', 16, 6, 'open', true, 2450.00),
                (circuit_vietnam_id, CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '75 days', 16, 2, 'open', false, 2490.00),
                (circuit_vietnam_id, CURRENT_DATE + INTERVAL '90 days', CURRENT_DATE + INTERVAL '105 days', 16, 0, 'open', false, 2390.00);
        END IF;

        IF circuit_japan_id IS NOT NULL THEN
            INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed, price)
            VALUES
                (circuit_japan_id, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '57 days', 14, 8, 'open', true, 3890.00),
                (circuit_japan_id, CURRENT_DATE + INTERVAL '75 days', CURRENT_DATE + INTERVAL '87 days', 14, 4, 'open', false, 3950.00);
        END IF;

        IF circuit_thailand_id IS NOT NULL THEN
            INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed, price)
            VALUES
                (circuit_thailand_id, CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '30 days', 16, 10, 'open', true, 1850.00),
                (circuit_thailand_id, CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE + INTERVAL '60 days', 16, 3, 'open', false, 1790.00);
        END IF;
    ELSE
        -- Si des circuits GIR existent déjà, ajouter des départs s'il n'y en a pas
        FOR circuit_vietnam_id IN SELECT id FROM circuits WHERE is_gir = true LOOP
            IF NOT EXISTS (
                SELECT 1 FROM circuit_departures
                WHERE circuit_id = circuit_vietnam_id
                AND start_date >= CURRENT_DATE
                AND status = 'open'
            ) THEN
                INSERT INTO circuit_departures (circuit_id, start_date, end_date, total_seats, booked_seats, status, is_guaranteed)
                VALUES
                    (circuit_vietnam_id, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '45 days', 16, 4, 'open', true),
                    (circuit_vietnam_id, CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '75 days', 16, 0, 'open', false);
            END IF;
        END LOOP;
    END IF;
END $$;

-- 3. Afficher un résumé
DO $$
DECLARE
    gir_count INTEGER;
    departure_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO gir_count FROM circuits WHERE is_gir = true;
    SELECT COUNT(*) INTO departure_count FROM circuit_departures WHERE status = 'open' AND start_date >= CURRENT_DATE;

    RAISE NOTICE 'GIR circuits: %, Open departures: %', gir_count, departure_count;
END $$;
