-- Migration: Add accepted/rejected statuses and partner response tracking to agency_requests
-- Date: 2026-02-12

-- 1. Drop old CHECK constraint and add updated one with accepted/rejected
ALTER TABLE agency_requests DROP CONSTRAINT IF EXISTS agency_requests_status_check;
ALTER TABLE agency_requests ADD CONSTRAINT agency_requests_status_check
  CHECK (status IN ('pending', 'sent', 'responded', 'accepted', 'rejected', 'closed'));

-- 2. Add columns for partner response tracking
ALTER TABLE agency_requests ADD COLUMN IF NOT EXISTS partner_response_message TEXT;
ALTER TABLE agency_requests ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES profiles(id);
ALTER TABLE agency_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 3. RLS: Partners can UPDATE requests for their circuits (to accept/reject)
DROP POLICY IF EXISTS "Partners can update requests for their circuits" ON agency_requests;
CREATE POLICY "Partners can update requests for their circuits"
    ON agency_requests FOR UPDATE
    USING (
        circuit_id IN (
            SELECT c.id FROM circuits c
            JOIN partners p ON c.partner_id = p.id
            WHERE p.owner_id = auth.uid()
               OR p.id IN (
                   SELECT partner_id FROM partner_members
                   WHERE user_id = auth.uid() AND status = 'active'
               )
        )
    )
    WITH CHECK (
        circuit_id IN (
            SELECT c.id FROM circuits c
            JOIN partners p ON c.partner_id = p.id
            WHERE p.owner_id = auth.uid()
               OR p.id IN (
                   SELECT partner_id FROM partner_members
                   WHERE user_id = auth.uid() AND status = 'active'
               )
        )
    );

-- 4. Update partner SELECT policy to include partner_members
DROP POLICY IF EXISTS "Partners can view requests for their circuits" ON agency_requests;
CREATE POLICY "Partners can view requests for their circuits"
    ON agency_requests FOR SELECT
    USING (
        circuit_id IN (
            SELECT c.id FROM circuits c
            JOIN partners p ON c.partner_id = p.id
            WHERE p.owner_id = auth.uid()
               OR p.id IN (
                   SELECT partner_id FROM partner_members
                   WHERE user_id = auth.uid() AND status = 'active'
               )
        )
    );

-- 5. Insert email templates for accept/reject notifications
INSERT INTO email_templates (slug, name, subject_fr, subject_en, body_fr, body_en, variables, is_active)
VALUES
(
    'agency_request_accepted',
    'Demande de réservation acceptée',
    'Votre demande pour {{circuit_title}} a été acceptée !',
    'Your request for {{circuit_title}} has been accepted!',
    E'Bonjour {{contact_name}},\n\nBonne nouvelle ! Votre demande de réservation pour le circuit "{{circuit_title}}" a été acceptée par {{partner_name}}.\n\n{{partner_message}}\n\nVous pouvez suivre votre demande dans votre espace agence.\n\nCordialement,\nDMC Alliance',
    E'Hello {{contact_name}},\n\nGreat news! Your booking request for "{{circuit_title}}" has been accepted by {{partner_name}}.\n\n{{partner_message}}\n\nYou can track your request in your agency portal.\n\nBest regards,\nDMC Alliance',
    '["contact_name", "circuit_title", "partner_name", "partner_message"]',
    true
),
(
    'agency_request_rejected',
    'Demande de réservation refusée',
    'Concernant votre demande pour {{circuit_title}}',
    'Regarding your request for {{circuit_title}}',
    E'Bonjour {{contact_name}},\n\nNous avons le regret de vous informer que votre demande de réservation pour le circuit "{{circuit_title}}" n''a pas pu être acceptée par {{partner_name}}.\n\nMotif : {{partner_message}}\n\nN''hésitez pas à consulter d''autres circuits disponibles dans votre espace agence.\n\nCordialement,\nDMC Alliance',
    E'Hello {{contact_name}},\n\nWe regret to inform you that your booking request for "{{circuit_title}}" could not be accepted by {{partner_name}}.\n\nReason: {{partner_message}}\n\nFeel free to browse other available circuits in your agency portal.\n\nBest regards,\nDMC Alliance',
    '["contact_name", "circuit_title", "partner_name", "partner_message"]',
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
