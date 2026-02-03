-- =====================================================
-- GIR ADVANCED FEATURES - Commission évolutive & Sync
-- Version simplifiée (sans dépendances vers agencies/bookings)
-- =====================================================

-- Activer l'extension UUID si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE INDEX IF NOT EXISTS idx_commission_tiers_circuit ON commission_tiers(circuit_id);

-- Commentaire de documentation
COMMENT ON TABLE commission_tiers IS 'Paliers de commission évolutifs pour les circuits GIR. Ex: 4 pax = 10%, 5 pax = 12%, etc.';

-- -----------------------------------------------------
-- Table: external_sources (Sources de données externes)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS external_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_type TEXT DEFAULT 'web_scraping',
    selector_config JSONB,
    api_config JSONB,
    sync_frequency TEXT DEFAULT 'daily',
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    last_sync_error TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_sources_circuit ON external_sources(circuit_id);

COMMENT ON TABLE external_sources IS 'Configuration des sources externes pour synchroniser le remplissage des circuits';

-- -----------------------------------------------------
-- Table: circuit_availability_history (Historique remplissage)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS circuit_availability_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    places_available INTEGER NOT NULL,
    places_booked INTEGER NOT NULL,
    source TEXT DEFAULT 'manual',
    synced_from_url TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_history_circuit ON circuit_availability_history(circuit_id, recorded_at DESC);

COMMENT ON TABLE circuit_availability_history IS 'Historique des changements de disponibilité pour traçabilité';

-- -----------------------------------------------------
-- Ajouter colonnes aux circuits existants
-- -----------------------------------------------------
DO $$
BEGIN
    -- Ajouter external_source_url si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'circuits' AND column_name = 'external_source_url') THEN
        ALTER TABLE circuits ADD COLUMN external_source_url TEXT;
    END IF;

    -- Ajouter use_tiered_commission si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'circuits' AND column_name = 'use_tiered_commission') THEN
        ALTER TABLE circuits ADD COLUMN use_tiered_commission BOOLEAN DEFAULT false;
    END IF;

    -- Ajouter base_commission_rate si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'circuits' AND column_name = 'base_commission_rate') THEN
        ALTER TABLE circuits ADD COLUMN base_commission_rate DECIMAL(5,2) DEFAULT 10.00;
    END IF;

    -- Ajouter auto_sync_enabled si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'circuits' AND column_name = 'auto_sync_enabled') THEN
        ALTER TABLE circuits ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Ajouter last_external_sync si n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'circuits' AND column_name = 'last_external_sync') THEN
        ALTER TABLE circuits ADD COLUMN last_external_sync TIMESTAMPTZ;
    END IF;
END $$;

-- -----------------------------------------------------
-- Fonction: Calculer la commission actuelle d'un circuit
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_current_commission(p_circuit_id UUID, p_current_pax INTEGER DEFAULT 0)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_circuit RECORD;
    v_commission DECIMAL(5,2);
BEGIN
    -- Récupérer le circuit
    SELECT * INTO v_circuit FROM circuits WHERE id = p_circuit_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Si pas de commission par paliers, retourner le taux de base
    IF NOT v_circuit.use_tiered_commission THEN
        RETURN COALESCE(v_circuit.base_commission_rate, 10.00);
    END IF;

    -- Trouver le palier correspondant
    SELECT commission_rate INTO v_commission
    FROM commission_tiers
    WHERE circuit_id = p_circuit_id
      AND p_current_pax >= min_participants
      AND (max_participants IS NULL OR p_current_pax <= max_participants)
    ORDER BY min_participants DESC
    LIMIT 1;

    -- Si aucun palier trouvé, utiliser le taux de base
    IF v_commission IS NULL THEN
        RETURN COALESCE(v_circuit.base_commission_rate, 10.00);
    END IF;

    RETURN v_commission;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_current_commission IS 'Calcule la commission actuelle basée sur le nombre de participants';

-- -----------------------------------------------------
-- RLS Policies pour les nouvelles tables
-- -----------------------------------------------------

-- commission_tiers
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
DROP POLICY IF EXISTS "Anyone can view commission tiers" ON commission_tiers;
CREATE POLICY "Anyone can view commission tiers"
    ON commission_tiers FOR SELECT
    USING (true);

-- Politique d'écriture pour tous (admin via service role)
DROP POLICY IF EXISTS "Service role can manage commission tiers" ON commission_tiers;
CREATE POLICY "Service role can manage commission tiers"
    ON commission_tiers FOR ALL
    USING (true);

-- external_sources
ALTER TABLE external_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view external sources" ON external_sources;
CREATE POLICY "Anyone can view external sources"
    ON external_sources FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Service role can manage external sources" ON external_sources;
CREATE POLICY "Service role can manage external sources"
    ON external_sources FOR ALL
    USING (true);

-- circuit_availability_history
ALTER TABLE circuit_availability_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view availability history" ON circuit_availability_history;
CREATE POLICY "Anyone can view availability history"
    ON circuit_availability_history FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Service role can manage availability history" ON circuit_availability_history;
CREATE POLICY "Service role can manage availability history"
    ON circuit_availability_history FOR ALL
    USING (true);

-- -----------------------------------------------------
-- Trigger pour updated_at sur external_sources
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_external_sources_updated_at ON external_sources;
CREATE TRIGGER update_external_sources_updated_at
    BEFORE UPDATE ON external_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
