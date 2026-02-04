-- Migration consolidée : Tables nécessaires pour l'espace agence
-- Date: 2025-02-04
-- Exécutez ce script dans le SQL Editor de Supabase si les tables n'existent pas

-- ============================================
-- 1. Ajouter 'member' à l'enum user_role
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- ============================================
-- 2. Colonne is_gir sur circuits
-- ============================================
ALTER TABLE circuits
  ADD COLUMN IF NOT EXISTS is_gir BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_circuits_is_gir ON circuits(is_gir) WHERE is_gir = true;

COMMENT ON COLUMN circuits.is_gir IS 'Indicates if this circuit is a GIR (Groupe à Itinéraire Réservé) for co-filling with agencies';

-- ============================================
-- 3. Colonne join_partner_id pour demandes de rattachement
-- ============================================
ALTER TABLE partner_registration_requests
ADD COLUMN IF NOT EXISTS join_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_registration_requests_join_partner_id
ON partner_registration_requests(join_partner_id)
WHERE join_partner_id IS NOT NULL;

COMMENT ON COLUMN partner_registration_requests.join_partner_id IS 'ID du partenaire à rejoindre (si demande de rattachement, sinon NULL pour nouvelle inscription)';

-- ============================================
-- 4. Table gir_watchlist (circuits suivis par les agences)
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_gir_watchlist_agency_id ON gir_watchlist(agency_id);
CREATE INDEX IF NOT EXISTS idx_gir_watchlist_circuit_id ON gir_watchlist(circuit_id);

-- RLS pour gir_watchlist
ALTER TABLE gir_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies can manage own watchlist" ON gir_watchlist;
CREATE POLICY "Agencies can manage own watchlist" ON gir_watchlist
  FOR ALL USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. Table notifications (in-app)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. Table notification_preferences
-- ============================================
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

-- RLS pour notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 7. Colonne unread_notifications_count sur profiles
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unread_notifications_count INTEGER DEFAULT 0;

-- ============================================
-- 8. Fonction et trigger pour notification count
-- ============================================
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

DROP TRIGGER IF EXISTS trigger_notification_count ON notifications;
CREATE TRIGGER trigger_notification_count
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_notification_count();

-- ============================================
-- Terminé !
-- ============================================
