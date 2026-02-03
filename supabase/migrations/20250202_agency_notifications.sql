-- Migration: Agency notifications and GIR tracking system
-- Date: 2025-02-02

-- Table for GIR watchlist (circuits that agencies are following)
CREATE TABLE IF NOT EXISTS gir_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  circuit_id UUID NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,
  notify_on_booking BOOLEAN DEFAULT true,
  notify_on_price_change BOOLEAN DEFAULT true,
  notify_on_availability_change BOOLEAN DEFAULT true,
  notify_on_commission_change BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, circuit_id)
);

-- Table for notifications (in-app)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'booking', 'price_change', 'availability', 'commission', 'newsletter', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject_fr VARCHAR(500) NOT NULL,
  subject_en VARCHAR(500),
  body_fr TEXT NOT NULL,
  body_en TEXT,
  variables JSONB DEFAULT '[]', -- List of available variables like {{agency_name}}, {{circuit_title}}, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES email_templates(id),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for newsletter campaigns
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subject_fr VARCHAR(500) NOT NULL,
  subject_en VARCHAR(500),
  content_fr TEXT NOT NULL,
  content_en TEXT,
  target_audience VARCHAR(50) DEFAULT 'all', -- 'all', 'agencies', 'partners', 'custom'
  target_filters JSONB DEFAULT '{}', -- Additional filters for custom audience
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  stats JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for agency notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_new_gir BOOLEAN DEFAULT true,
  email_booking_confirmation BOOLEAN DEFAULT true,
  email_price_changes BOOLEAN DEFAULT true,
  email_availability_alerts BOOLEAN DEFAULT true,
  email_commission_updates BOOLEAN DEFAULT true,
  email_newsletter BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add commission_tiers to agencies for dynamic commission rates
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS commission_tiers JSONB DEFAULT '[]';
-- Example: [{"min_bookings": 0, "rate": 10}, {"min_bookings": 5, "rate": 12}, {"min_bookings": 10, "rate": 15}]

-- Add notification count to profiles for quick badge display
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unread_notifications_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gir_watchlist_agency_id ON gir_watchlist(agency_id);
CREATE INDEX IF NOT EXISTS idx_gir_watchlist_circuit_id ON gir_watchlist(circuit_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Insert default email templates
INSERT INTO email_templates (slug, name, subject_fr, subject_en, body_fr, body_en, variables) VALUES
(
  'booking_confirmation',
  'Confirmation de réservation',
  'Confirmation de votre réservation - {{circuit_title}}',
  'Booking confirmation - {{circuit_title}}',
  E'Bonjour {{agency_name}},\n\nNous confirmons votre réservation pour le circuit "{{circuit_title}}".\n\nDétails de la réservation :\n- Date de départ : {{departure_date}}\n- Nombre de places : {{places_booked}}\n- Prix total : {{total_price}} €\n- Commission : {{commission_amount}} € ({{commission_rate}}%)\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{agency_name}},\n\nWe confirm your booking for the circuit "{{circuit_title}}".\n\nBooking details:\n- Departure date: {{departure_date}}\n- Number of places: {{places_booked}}\n- Total price: {{total_price}} €\n- Commission: {{commission_amount}} € ({{commission_rate}}%)\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "circuit_title", "departure_date", "places_booked", "total_price", "commission_amount", "commission_rate"]'
),
(
  'new_booking_alert',
  'Alerte nouvelle réservation',
  'Nouvelle réservation sur {{circuit_title}}',
  'New booking on {{circuit_title}}',
  E'Bonjour {{agency_name}},\n\nUne nouvelle réservation a été effectuée sur le circuit "{{circuit_title}}" que vous suivez.\n\nPlaces restantes : {{places_available}} / {{places_total}}\n\nConnectez-vous à votre espace pour plus de détails.\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{agency_name}},\n\nA new booking has been made on the circuit "{{circuit_title}}" you are following.\n\nRemaining places: {{places_available}} / {{places_total}}\n\nLog in to your dashboard for more details.\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "circuit_title", "places_available", "places_total"]'
),
(
  'commission_update',
  'Mise à jour du taux de commission',
  'Votre taux de commission a évolué !',
  'Your commission rate has been updated!',
  E'Bonjour {{agency_name}},\n\nBonne nouvelle ! Suite à vos réservations, votre taux de commission passe de {{old_rate}}% à {{new_rate}}%.\n\nCe nouveau taux s''applique à toutes vos prochaines réservations.\n\nMerci pour votre confiance !\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{agency_name}},\n\nGreat news! Thanks to your bookings, your commission rate is now {{new_rate}}% (was {{old_rate}}%).\n\nThis new rate applies to all your future bookings.\n\nThank you for your trust!\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "old_rate", "new_rate"]'
),
(
  'availability_alert',
  'Alerte disponibilité',
  '{{circuit_title}} - Plus que {{places_available}} places !',
  '{{circuit_title}} - Only {{places_available}} places left!',
  E'Bonjour {{agency_name}},\n\nLe circuit "{{circuit_title}}" que vous suivez n''a plus que {{places_available}} places disponibles sur {{places_total}}.\n\nDate de départ : {{departure_date}}\n\nRéservez vite !\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{agency_name}},\n\nThe circuit "{{circuit_title}}" you are following has only {{places_available}} places left out of {{places_total}}.\n\nDeparture date: {{departure_date}}\n\nBook now!\n\nBest regards,\nThe DMC Alliance Team',
  '["agency_name", "circuit_title", "places_available", "places_total", "departure_date"]'
),
(
  'welcome_agency',
  'Bienvenue agence partenaire',
  'Bienvenue chez DMC Alliance, {{agency_name}} !',
  'Welcome to DMC Alliance, {{agency_name}}!',
  E'Bonjour {{contact_name}},\n\nBienvenue chez DMC Alliance !\n\nVotre compte agence "{{agency_name}}" a été créé avec succès. Vous pouvez maintenant :\n\n- Consulter tous nos circuits GIR\n- Suivre les circuits qui vous intéressent\n- Recevoir des alertes sur les disponibilités\n- Effectuer des réservations et gagner des commissions\n\nVotre taux de commission initial est de {{commission_rate}}%.\n\nConnectez-vous dès maintenant : {{login_url}}\n\nCordialement,\nL''équipe DMC Alliance',
  E'Hello {{contact_name}},\n\nWelcome to DMC Alliance!\n\nYour agency account "{{agency_name}}" has been created successfully. You can now:\n\n- Browse all our GIR circuits\n- Follow circuits you are interested in\n- Receive availability alerts\n- Make bookings and earn commissions\n\nYour initial commission rate is {{commission_rate}}%.\n\nLog in now: {{login_url}}\n\nBest regards,\nThe DMC Alliance Team',
  '["contact_name", "agency_name", "commission_rate", "login_url"]'
)
ON CONFLICT (slug) DO NOTHING;

-- Function to update notification count
CREATE OR REPLACE FUNCTION update_notification_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET unread_notifications_count = unread_notifications_count + 1
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE profiles
    SET unread_notifications_count = GREATEST(0, unread_notifications_count - 1)
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_read = false THEN
    UPDATE profiles
    SET unread_notifications_count = GREATEST(0, unread_notifications_count - 1)
    WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for notification count
DROP TRIGGER IF EXISTS trigger_notification_count ON notifications;
CREATE TRIGGER trigger_notification_count
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_notification_count();

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gir_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Agencies can manage their own watchlist
CREATE POLICY "Agencies can manage own watchlist" ON gir_watchlist
  FOR ALL USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);
