-- =============================================
-- DMC Alliance - Registration & Agency Portal
-- Tables et templates pour l'inscription et l'espace agence
-- =============================================

-- =============================================
-- 1. TABLE: partner_registration_requests
-- Demandes d'inscription DMC en attente de validation
-- =============================================

CREATE TABLE IF NOT EXISTS partner_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    partner_name TEXT NOT NULL,
    partner_slug TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    website TEXT,
    description TEXT,
    destinations TEXT[], -- Liste des destinations couvertes
    specialties TEXT[], -- Spécialités (culture, aventure, etc.)
    has_gir BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_partner_requests_status ON partner_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_user ON partner_registration_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_requests_created ON partner_registration_requests(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_partner_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_request_updated ON partner_registration_requests;
CREATE TRIGGER trigger_partner_request_updated
    BEFORE UPDATE ON partner_registration_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_request_timestamp();

-- =============================================
-- 2. TABLE: agency_destination_interests
-- Destinations qui intéressent chaque agence
-- =============================================

CREATE TABLE IF NOT EXISTS agency_destination_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, destination_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_interests_agency ON agency_destination_interests(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_interests_destination ON agency_destination_interests(destination_id);

-- =============================================
-- 3. TABLE: agency_requests
-- Demandes d'information ou de réservation
-- =============================================

CREATE TABLE IF NOT EXISTS agency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    circuit_id UUID NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,
    departure_id UUID REFERENCES circuit_departures(id) ON DELETE SET NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('info', 'booking')),
    travelers_count INTEGER,
    message TEXT,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'responded', 'closed')),
    partner_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_requests_agency ON agency_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_requests_circuit ON agency_requests(circuit_id);
CREATE INDEX IF NOT EXISTS idx_agency_requests_status ON agency_requests(status);
CREATE INDEX IF NOT EXISTS idx_agency_requests_created ON agency_requests(created_at DESC);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_agency_request_updated ON agency_requests;
CREATE TRIGGER trigger_agency_request_updated
    BEFORE UPDATE ON agency_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_request_timestamp();

-- =============================================
-- 4. MODIFICATION TABLE: profiles
-- Ajout colonnes pour gestion partenaires en attente
-- =============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_partner_approval BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_request_id UUID REFERENCES partner_registration_requests(id);

-- =============================================
-- 5. MODIFICATION TABLE: agencies
-- S'assurer que user_id existe pour lier à profiles
-- =============================================

ALTER TABLE agencies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS registration_number TEXT; -- Numéro d'immatriculation
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_agencies_user ON agencies(user_id);

-- =============================================
-- 6. ROW LEVEL SECURITY
-- =============================================

-- RLS pour partner_registration_requests
ALTER TABLE partner_registration_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own partner requests" ON partner_registration_requests;
CREATE POLICY "Users can view own partner requests"
    ON partner_registration_requests FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create partner requests" ON partner_registration_requests;
CREATE POLICY "Users can create partner requests"
    ON partner_registration_requests FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all partner requests" ON partner_registration_requests;
CREATE POLICY "Admins can manage all partner requests"
    ON partner_registration_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS pour agency_destination_interests
ALTER TABLE agency_destination_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies can manage own interests" ON agency_destination_interests;
CREATE POLICY "Agencies can manage own interests"
    ON agency_destination_interests FOR ALL
    USING (
        agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can view all interests" ON agency_destination_interests;
CREATE POLICY "Admins can view all interests"
    ON agency_destination_interests FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS pour agency_requests
ALTER TABLE agency_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies can manage own requests" ON agency_requests;
CREATE POLICY "Agencies can manage own requests"
    ON agency_requests FOR ALL
    USING (
        agency_id IN (SELECT id FROM agencies WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Partners can view requests for their circuits" ON agency_requests;
CREATE POLICY "Partners can view requests for their circuits"
    ON agency_requests FOR SELECT
    USING (
        circuit_id IN (
            SELECT c.id FROM circuits c
            JOIN partners p ON c.partner_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage all requests" ON agency_requests;
CREATE POLICY "Admins can manage all requests"
    ON agency_requests FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 7. TEMPLATES EMAIL
-- =============================================

INSERT INTO email_templates (slug, name, subject_fr, subject_en, body_fr, body_en, variables, is_active)
VALUES
(
    'new_partner_request',
    'Nouvelle demande partenaire DMC',
    'Nouvelle demande d''inscription DMC : {{partner_name}}',
    'New DMC registration request: {{partner_name}}',
    E'Bonjour,\n\nUne nouvelle demande d''inscription DMC a été soumise.\n\n**Informations de la demande :**\n- Nom : {{partner_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Site web : {{website}}\n- Destinations : {{destinations}}\n\nConnectez-vous à l''administration pour examiner cette demande :\n{{admin_url}}\n\nCordialement,\nLe système DMC Alliance',
    E'Hello,\n\nA new DMC registration request has been submitted.\n\n**Request details:**\n- Name: {{partner_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Website: {{website}}\n- Destinations: {{destinations}}\n\nLog in to the admin panel to review this request:\n{{admin_url}}\n\nBest regards,\nThe DMC Alliance System',
    '["partner_name", "contact_name", "contact_email", "website", "destinations", "admin_url"]',
    true
),
(
    'partner_request_approved',
    'Demande partenaire approuvée',
    'Bienvenue chez DMC Alliance, {{partner_name}} !',
    'Welcome to DMC Alliance, {{partner_name}}!',
    E'Bonjour {{contact_name}},\n\nFélicitations ! Votre demande d''adhésion à DMC Alliance a été approuvée.\n\nVotre agence réceptive "{{partner_name}}" est maintenant active sur notre plateforme.\n\nVous pouvez dès à présent accéder à votre espace administration pour :\n- Ajouter vos destinations\n- Créer et gérer vos circuits GIR\n- Suivre les réservations\n\nConnectez-vous ici : {{login_url}}\n\nCordialement,\nL''équipe DMC Alliance',
    E'Hello {{contact_name}},\n\nCongratulations! Your DMC Alliance membership request has been approved.\n\nYour receptive agency "{{partner_name}}" is now active on our platform.\n\nYou can now access your admin space to:\n- Add your destinations\n- Create and manage your GIR circuits\n- Track bookings\n\nLog in here: {{login_url}}\n\nBest regards,\nThe DMC Alliance Team',
    '["contact_name", "partner_name", "login_url"]',
    true
),
(
    'partner_request_rejected',
    'Demande partenaire non retenue',
    'Concernant votre demande DMC Alliance',
    'Regarding your DMC Alliance application',
    E'Bonjour {{contact_name}},\n\nNous avons examiné votre demande d''adhésion à DMC Alliance pour "{{partner_name}}".\n\nMalheureusement, nous ne pouvons pas donner suite à votre demande pour le moment.\n\n{{admin_notes}}\n\nN''hésitez pas à nous contacter pour plus d''informations.\n\nCordialement,\nL''équipe DMC Alliance',
    E'Hello {{contact_name}},\n\nWe have reviewed your DMC Alliance membership application for "{{partner_name}}".\n\nUnfortunately, we cannot proceed with your request at this time.\n\n{{admin_notes}}\n\nFeel free to contact us for more information.\n\nBest regards,\nThe DMC Alliance Team',
    '["contact_name", "partner_name", "admin_notes"]',
    true
),
(
    'agency_info_request',
    'Demande d''information agence',
    'Demande d''information pour {{circuit_title}}',
    'Information request for {{circuit_title}}',
    E'Bonjour,\n\nUne agence de voyage souhaite obtenir des informations sur votre circuit.\n\n**Circuit concerné :**\n{{circuit_title}}\n\n**Agence :**\n- {{agency_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Téléphone : {{contact_phone}}\n\n**Message :**\n{{message}}\n\nMerci de répondre directement à {{contact_email}}.\n\nCordialement,\nDMC Alliance',
    E'Hello,\n\nA travel agency would like information about your circuit.\n\n**Circuit:**\n{{circuit_title}}\n\n**Agency:**\n- {{agency_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n\n**Message:**\n{{message}}\n\nPlease reply directly to {{contact_email}}.\n\nBest regards,\nDMC Alliance',
    '["circuit_title", "agency_name", "contact_name", "contact_email", "contact_phone", "message"]',
    true
),
(
    'agency_booking_request',
    'Demande de réservation agence',
    'Demande de réservation pour {{circuit_title}} - {{travelers_count}} voyageurs',
    'Booking request for {{circuit_title}} - {{travelers_count}} travelers',
    E'Bonjour,\n\nUne agence de voyage souhaite effectuer une réservation sur votre circuit.\n\n**Circuit concerné :**\n{{circuit_title}}\n\n**Départ :**\n{{departure_date}}\n\n**Nombre de voyageurs :**\n{{travelers_count}}\n\n**Agence :**\n- {{agency_name}}\n- Contact : {{contact_name}}\n- Email : {{contact_email}}\n- Téléphone : {{contact_phone}}\n\n**Message :**\n{{message}}\n\nMerci de répondre directement à {{contact_email}} pour finaliser cette réservation.\n\nCordialement,\nDMC Alliance',
    E'Hello,\n\nA travel agency would like to make a booking on your circuit.\n\n**Circuit:**\n{{circuit_title}}\n\n**Departure:**\n{{departure_date}}\n\n**Number of travelers:**\n{{travelers_count}}\n\n**Agency:**\n- {{agency_name}}\n- Contact: {{contact_name}}\n- Email: {{contact_email}}\n- Phone: {{contact_phone}}\n\n**Message:**\n{{message}}\n\nPlease reply directly to {{contact_email}} to finalize this booking.\n\nBest regards,\nDMC Alliance',
    '["circuit_title", "departure_date", "travelers_count", "agency_name", "contact_name", "contact_email", "contact_phone", "message"]',
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
-- 8. COMMENTAIRES
-- =============================================

COMMENT ON TABLE partner_registration_requests IS 'Demandes d''inscription des DMC en attente de validation admin';
COMMENT ON TABLE agency_destination_interests IS 'Destinations qui intéressent chaque agence pour les notifications ciblées';
COMMENT ON TABLE agency_requests IS 'Demandes d''information ou de réservation des agences vers les partenaires';

COMMENT ON COLUMN partner_registration_requests.status IS 'pending = en attente, approved = approuvée, rejected = refusée';
COMMENT ON COLUMN agency_requests.request_type IS 'info = demande d''information, booking = demande de réservation';
COMMENT ON COLUMN agency_requests.status IS 'pending = en attente, sent = email envoyé, responded = répondu, closed = clôturé';
