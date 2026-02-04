-- Migration: Ajouter colonne join_partner_id pour les demandes de rattachement
-- Date: 2025-02-04

-- 1. Ajouter 'member' à l'enum user_role si elle n'existe pas
-- IMPORTANT: Exécuter cette commande manuellement dans Supabase si vous obtenez une erreur
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- 2. Ajouter la colonne join_partner_id à partner_registration_requests
-- Cette colonne est utilisée quand quelqu'un veut rejoindre un partenaire existant
ALTER TABLE partner_registration_requests
ADD COLUMN IF NOT EXISTS join_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- 3. Créer un index pour les recherches par join_partner_id
CREATE INDEX IF NOT EXISTS idx_partner_registration_requests_join_partner_id
ON partner_registration_requests(join_partner_id)
WHERE join_partner_id IS NOT NULL;

-- 4. Commentaire sur la colonne
COMMENT ON COLUMN partner_registration_requests.join_partner_id IS 'ID du partenaire à rejoindre (si demande de rattachement, sinon NULL pour nouvelle inscription)';
