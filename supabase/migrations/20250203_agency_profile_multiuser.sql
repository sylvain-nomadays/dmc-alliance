-- =============================================
-- DMC Alliance - Agency Profile & Multi-User Support
-- Amélioration profil agence et support multi-utilisateurs
-- =============================================

-- =============================================
-- 1. MODIFICATION TABLE: agencies
-- Ajout des champs profil (logo, description, spécialités, etc.)
-- =============================================

-- Logo de l'agence
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Description et spécialités
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS specialties TEXT[]; -- Ex: ['tourisme_groupe', 'luxe', 'aventure']
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS looking_for TEXT[]; -- Ce que l'agence recherche ex: ['circuits_asie', 'gir_afrique']

-- Informations complémentaires
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS contact_name TEXT; -- Nom du contact principal
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS social_linkedin TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS social_facebook TEXT;

-- Profil complété ?
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- =============================================
-- 2. TABLE: agency_members
-- Gestion des membres d'une même agence (multi-utilisateurs)
-- =============================================

CREATE TABLE IF NOT EXISTS agency_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_status ON agency_members(status);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_agency_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agency_member_updated ON agency_members;
CREATE TRIGGER trigger_agency_member_updated
    BEFORE UPDATE ON agency_members
    FOR EACH ROW
    EXECUTE FUNCTION update_agency_member_timestamp();

-- =============================================
-- 3. TABLE: agency_join_requests
-- Demandes pour rejoindre une agence existante
-- =============================================

CREATE TABLE IF NOT EXISTS agency_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_agency_join_requests_agency ON agency_join_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_join_requests_user ON agency_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_join_requests_status ON agency_join_requests(status);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_agency_join_request_updated ON agency_join_requests;
CREATE TRIGGER trigger_agency_join_request_updated
    BEFORE UPDATE ON agency_join_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_agency_member_timestamp();

-- =============================================
-- 4. ROW LEVEL SECURITY
-- =============================================

-- RLS pour agency_members
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;

-- Les propriétaires d'agence peuvent gérer les membres
DROP POLICY IF EXISTS "Agency owners can manage members" ON agency_members;
CREATE POLICY "Agency owners can manage members"
    ON agency_members FOR ALL
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE user_id = auth.uid()
        )
        OR
        agency_id IN (
            SELECT agency_id FROM agency_members
            WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
        )
    );

-- Les membres peuvent voir leurs propres enregistrements
DROP POLICY IF EXISTS "Members can view own membership" ON agency_members;
CREATE POLICY "Members can view own membership"
    ON agency_members FOR SELECT
    USING (user_id = auth.uid());

-- Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage all members" ON agency_members;
CREATE POLICY "Admins can manage all members"
    ON agency_members FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS pour agency_join_requests
ALTER TABLE agency_join_requests ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent créer et voir leurs propres demandes
DROP POLICY IF EXISTS "Users can manage own join requests" ON agency_join_requests;
CREATE POLICY "Users can manage own join requests"
    ON agency_join_requests FOR ALL
    USING (user_id = auth.uid());

-- Les propriétaires d'agence peuvent voir et gérer les demandes
DROP POLICY IF EXISTS "Agency owners can manage join requests" ON agency_join_requests;
CREATE POLICY "Agency owners can manage join requests"
    ON agency_join_requests FOR ALL
    USING (
        agency_id IN (
            SELECT id FROM agencies WHERE user_id = auth.uid()
        )
        OR
        agency_id IN (
            SELECT agency_id FROM agency_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage all join requests" ON agency_join_requests;
CREATE POLICY "Admins can manage all join requests"
    ON agency_join_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 5. EMAIL TEMPLATES
-- =============================================

INSERT INTO email_templates (slug, name, subject_fr, subject_en, body_fr, body_en, variables, is_active)
VALUES
(
    'agency_join_request',
    'Demande de rejoindre une agence',
    'Nouvelle demande pour rejoindre {{agency_name}}',
    'New request to join {{agency_name}}',
    E'Bonjour,\n\nUn collaborateur souhaite rejoindre votre agence sur DMC Alliance.\n\n**Informations du demandeur :**\n- Nom : {{user_name}}\n- Email : {{user_email}}\n- Message : {{message}}\n\nConnectez-vous à votre espace pour accepter ou refuser cette demande :\n{{dashboard_url}}\n\nCordialement,\nL''équipe DMC Alliance',
    E'Hello,\n\nA colleague wants to join your agency on DMC Alliance.\n\n**Requester information:**\n- Name: {{user_name}}\n- Email: {{user_email}}\n- Message: {{message}}\n\nLog in to your space to accept or reject this request:\n{{dashboard_url}}\n\nBest regards,\nThe DMC Alliance Team',
    '["agency_name", "user_name", "user_email", "message", "dashboard_url"]',
    true
),
(
    'agency_join_approved',
    'Demande acceptée',
    'Bienvenue chez {{agency_name}} !',
    'Welcome to {{agency_name}}!',
    E'Bonjour {{user_name}},\n\nVotre demande pour rejoindre {{agency_name}} a été acceptée !\n\nVous avez maintenant accès à l''espace professionnel de l''agence sur DMC Alliance.\n\nConnectez-vous ici : {{login_url}}\n\nCordialement,\nL''équipe DMC Alliance',
    E'Hello {{user_name}},\n\nYour request to join {{agency_name}} has been approved!\n\nYou now have access to the agency''s professional space on DMC Alliance.\n\nLog in here: {{login_url}}\n\nBest regards,\nThe DMC Alliance Team',
    '["user_name", "agency_name", "login_url"]',
    true
),
(
    'agency_join_rejected',
    'Demande refusée',
    'Concernant votre demande pour {{agency_name}}',
    'Regarding your request for {{agency_name}}',
    E'Bonjour {{user_name}},\n\nVotre demande pour rejoindre {{agency_name}} n''a pas été acceptée.\n\nSi vous pensez qu''il s''agit d''une erreur, veuillez contacter directement l''agence ou nous écrire.\n\nCordialement,\nL''équipe DMC Alliance',
    E'Hello {{user_name}},\n\nYour request to join {{agency_name}} has not been accepted.\n\nIf you believe this is an error, please contact the agency directly or reach out to us.\n\nBest regards,\nThe DMC Alliance Team',
    '["user_name", "agency_name"]',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    subject_fr = EXCLUDED.subject_fr,
    subject_en = EXCLUDED.subject_en,
    body_fr = EXCLUDED.body_fr,
    body_en = EXCLUDED.body_en,
    variables = EXCLUDED.variables,
    is_active = EXCLUDED.is_active;

-- =============================================
-- 6. MIGRATION: Ajouter les propriétaires existants à agency_members
-- =============================================

-- Pour chaque agence existante qui a un user_id, créer un membre "owner"
INSERT INTO agency_members (agency_id, user_id, role, status, joined_at)
SELECT id, user_id, 'owner', 'active', created_at
FROM agencies
WHERE user_id IS NOT NULL
ON CONFLICT (agency_id, user_id) DO NOTHING;

-- =============================================
-- 7. COMMENTAIRES
-- =============================================

COMMENT ON TABLE agency_members IS 'Membres d''une agence - permet à plusieurs utilisateurs de partager le même compte agence';
COMMENT ON TABLE agency_join_requests IS 'Demandes pour rejoindre une agence existante';

COMMENT ON COLUMN agencies.logo_url IS 'URL du logo de l''agence';
COMMENT ON COLUMN agencies.description IS 'Description de l''agence';
COMMENT ON COLUMN agencies.specialties IS 'Spécialités de l''agence (tourisme groupe, luxe, aventure, etc.)';
COMMENT ON COLUMN agencies.looking_for IS 'Ce que l''agence recherche (destinations, types de circuits)';
COMMENT ON COLUMN agencies.profile_completed IS 'Indique si le profil a été complété';

COMMENT ON COLUMN agency_members.role IS 'owner = propriétaire, admin = peut gérer membres, member = accès standard';
COMMENT ON COLUMN agency_members.status IS 'pending = invitation en attente, active = membre actif, inactive = désactivé';
