-- =====================================================
-- GIR ADVANCED FEATURES - Commission évolutive & Sync
-- =====================================================

-- -----------------------------------------------------
-- Table: commission_tiers (Paliers de commission)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    min_participants INTEGER NOT NULL,
    max_participants INTEGER, -- NULL = pas de limite supérieure
    commission_rate DECIMAL(5,2) NOT NULL, -- Pourcentage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_commission_tiers_circuit ON commission_tiers(circuit_id);

-- Commentaire de documentation
COMMENT ON TABLE commission_tiers IS 'Paliers de commission évolutifs pour les circuits GIR. Ex: 4 pax = 10%, 5 pax = 12%, etc.';

-- -----------------------------------------------------
-- Table: external_sources (Sources de données externes)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS external_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL, -- URL de la page source
    source_type TEXT DEFAULT 'web_scraping', -- 'web_scraping', 'api', 'manual'
    selector_config JSONB, -- Configuration des sélecteurs CSS/XPath
    api_config JSONB, -- Configuration API (endpoint, auth, etc.)
    sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT, -- 'success', 'error', 'pending'
    last_sync_error TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_external_sources_circuit ON external_sources(circuit_id);

COMMENT ON TABLE external_sources IS 'Configuration des sources externes pour synchroniser le remplissage des circuits';

-- -----------------------------------------------------
-- Table: circuit_availability_history (Historique remplissage)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS circuit_availability_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    places_available INTEGER NOT NULL,
    places_booked INTEGER NOT NULL,
    source TEXT DEFAULT 'manual', -- 'manual', 'booking', 'sync'
    synced_from_url TEXT, -- Si sync externe
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_availability_history_circuit ON circuit_availability_history(circuit_id, recorded_at DESC);

COMMENT ON TABLE circuit_availability_history IS 'Historique des changements de disponibilité pour traçabilité';

-- -----------------------------------------------------
-- Table: agency_notifications (Notifications aux agences)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS agency_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'commission_update', 'places_low', 'circuit_full', 'departure_reminder', 'new_booking'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Données additionnelles (commission, places, etc.)
    is_read BOOLEAN DEFAULT false,
    is_sent_email BOOLEAN DEFAULT false,
    sent_email_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_agency ON agency_notifications(agency_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_circuit ON agency_notifications(circuit_id);

COMMENT ON TABLE agency_notifications IS 'Notifications envoyées aux agences (commission, remplissage, etc.)';

-- -----------------------------------------------------
-- Table: agency_circuit_subscriptions (Abonnements aux circuits)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS agency_circuit_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    notify_on_availability BOOLEAN DEFAULT true,
    notify_on_commission_change BOOLEAN DEFAULT true,
    notify_on_departure_reminder BOOLEAN DEFAULT true,
    reminder_days_before INTEGER DEFAULT 30, -- Jours avant départ pour rappel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, circuit_id)
);

CREATE INDEX idx_subscriptions_agency ON agency_circuit_subscriptions(agency_id);
CREATE INDEX idx_subscriptions_circuit ON agency_circuit_subscriptions(circuit_id);

COMMENT ON TABLE agency_circuit_subscriptions IS 'Abonnements des agences aux notifications de circuits';

-- -----------------------------------------------------
-- Ajouter colonnes aux circuits existants
-- -----------------------------------------------------
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS external_source_url TEXT;
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS use_tiered_commission BOOLEAN DEFAULT false;
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS base_commission_rate DECIMAL(5,2) DEFAULT 10.00;
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE circuits ADD COLUMN IF NOT EXISTS last_external_sync TIMESTAMPTZ;

-- -----------------------------------------------------
-- Fonction: Calculer la commission actuelle d'un circuit
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_current_commission(p_circuit_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_circuit RECORD;
    v_current_pax INTEGER;
    v_commission DECIMAL(5,2);
BEGIN
    -- Récupérer le circuit
    SELECT * INTO v_circuit FROM circuits WHERE id = p_circuit_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Si pas de commission par paliers, retourner le taux de base
    IF NOT v_circuit.use_tiered_commission THEN
        RETURN v_circuit.base_commission_rate;
    END IF;

    -- Calculer le nombre de pax actuels (confirmés)
    SELECT COALESCE(SUM(places_booked), 0) INTO v_current_pax
    FROM bookings
    WHERE circuit_id = p_circuit_id AND status = 'confirmed';

    -- Trouver le palier correspondant
    SELECT commission_rate INTO v_commission
    FROM commission_tiers
    WHERE circuit_id = p_circuit_id
      AND v_current_pax >= min_participants
      AND (max_participants IS NULL OR v_current_pax <= max_participants)
    ORDER BY min_participants DESC
    LIMIT 1;

    -- Si aucun palier trouvé, utiliser le taux de base
    IF v_commission IS NULL THEN
        RETURN v_circuit.base_commission_rate;
    END IF;

    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_current_commission IS 'Calcule la commission actuelle basée sur le nombre de participants confirmés';

-- -----------------------------------------------------
-- Fonction: Récupérer les infos complètes d'un circuit avec commission
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION get_circuit_with_commission(p_circuit_id UUID)
RETURNS TABLE (
    circuit_id UUID,
    title_fr TEXT,
    departure_date DATE,
    places_total INTEGER,
    places_available INTEGER,
    current_pax INTEGER,
    current_commission DECIMAL(5,2),
    next_tier_pax INTEGER,
    next_tier_commission DECIMAL(5,2)
) AS $$
DECLARE
    v_current_pax INTEGER;
    v_current_commission DECIMAL(5,2);
BEGIN
    -- Calculer pax actuels
    SELECT COALESCE(SUM(b.places_booked), 0) INTO v_current_pax
    FROM bookings b
    WHERE b.circuit_id = p_circuit_id AND b.status = 'confirmed';

    -- Calculer commission actuelle
    v_current_commission := calculate_current_commission(p_circuit_id);

    RETURN QUERY
    SELECT
        c.id,
        c.title_fr,
        c.departure_date,
        c.places_total,
        c.places_available,
        v_current_pax,
        v_current_commission,
        -- Prochain palier
        (
            SELECT ct.min_participants
            FROM commission_tiers ct
            WHERE ct.circuit_id = p_circuit_id
              AND ct.min_participants > v_current_pax
            ORDER BY ct.min_participants ASC
            LIMIT 1
        ),
        (
            SELECT ct.commission_rate
            FROM commission_tiers ct
            WHERE ct.circuit_id = p_circuit_id
              AND ct.min_participants > v_current_pax
            ORDER BY ct.min_participants ASC
            LIMIT 1
        )
    FROM circuits c
    WHERE c.id = p_circuit_id;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Trigger: Notifier les agences lors d'un changement de commission
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION notify_commission_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_commission DECIMAL(5,2);
    v_new_commission DECIMAL(5,2);
    v_circuit RECORD;
    v_agency RECORD;
BEGIN
    -- Ne s'applique qu'aux bookings confirmés
    IF NEW.status != 'confirmed' THEN
        RETURN NEW;
    END IF;

    -- Récupérer le circuit
    SELECT * INTO v_circuit FROM circuits WHERE id = NEW.circuit_id;

    -- Calculer la nouvelle commission
    v_new_commission := calculate_current_commission(NEW.circuit_id);

    -- Pour chaque agence abonnée au circuit, créer une notification
    FOR v_agency IN
        SELECT DISTINCT a.id, a.name, s.notify_on_commission_change
        FROM agencies a
        JOIN agency_circuit_subscriptions s ON s.agency_id = a.id
        WHERE s.circuit_id = NEW.circuit_id
          AND s.notify_on_commission_change = true
    LOOP
        INSERT INTO agency_notifications (
            agency_id, circuit_id, booking_id, type, title, message, data
        ) VALUES (
            v_agency.id,
            NEW.circuit_id,
            NEW.id,
            'commission_update',
            'Commission mise à jour - ' || v_circuit.title_fr,
            'La commission pour le circuit "' || v_circuit.title_fr || '" est maintenant de ' || v_new_commission || '%',
            jsonb_build_object(
                'new_commission', v_new_commission,
                'circuit_title', v_circuit.title_fr,
                'departure_date', v_circuit.departure_date
            )
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_commission_change ON bookings;
CREATE TRIGGER trigger_notify_commission_change
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed')
    EXECUTE FUNCTION notify_commission_change();

-- -----------------------------------------------------
-- Trigger: Enregistrer l'historique de disponibilité
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION record_availability_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.places_available != NEW.places_available THEN
        INSERT INTO circuit_availability_history (
            circuit_id, places_available, places_booked, source
        ) VALUES (
            NEW.id,
            NEW.places_available,
            NEW.places_total - NEW.places_available,
            'booking'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_record_availability ON circuits;
CREATE TRIGGER trigger_record_availability
    AFTER UPDATE ON circuits
    FOR EACH ROW
    EXECUTE FUNCTION record_availability_change();

-- -----------------------------------------------------
-- RLS Policies pour les nouvelles tables
-- -----------------------------------------------------

-- commission_tiers
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view commission tiers"
    ON commission_tiers FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage commission tiers"
    ON commission_tiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- external_sources
ALTER TABLE external_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage external sources"
    ON external_sources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- agency_notifications
ALTER TABLE agency_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their notifications"
    ON agency_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = agency_notifications.agency_id
            AND agencies.user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can update their notifications"
    ON agency_notifications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = agency_notifications.agency_id
            AND agencies.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all notifications"
    ON agency_notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- agency_circuit_subscriptions
ALTER TABLE agency_circuit_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can manage their subscriptions"
    ON agency_circuit_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = agency_circuit_subscriptions.agency_id
            AND agencies.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all subscriptions"
    ON agency_circuit_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- circuit_availability_history
ALTER TABLE circuit_availability_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability history"
    ON circuit_availability_history FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage availability history"
    ON circuit_availability_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Triggers updated_at
-- -----------------------------------------------------
CREATE TRIGGER update_external_sources_updated_at
    BEFORE UPDATE ON external_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
