-- Table pour suivre l'intérêt des agences pour les destinations et partenaires
CREATE TABLE IF NOT EXISTS agency_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('destination', 'partner')),
  entity_slug TEXT NOT NULL,
  entity_name TEXT, -- Pour affichage sans jointure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, entity_type, entity_slug)
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_agency_interests_agency_id ON agency_interests(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_interests_entity ON agency_interests(entity_type, entity_slug);

-- RLS Policies
ALTER TABLE agency_interests ENABLE ROW LEVEL SECURITY;

-- Les agences peuvent voir leurs propres intérêts
CREATE POLICY "Agencies can view own interests" ON agency_interests
  FOR SELECT USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Les agences peuvent ajouter leurs propres intérêts
CREATE POLICY "Agencies can insert own interests" ON agency_interests
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Les agences peuvent supprimer leurs propres intérêts
CREATE POLICY "Agencies can delete own interests" ON agency_interests
  FOR DELETE USING (
    agency_id IN (
      SELECT id FROM agencies WHERE user_id = auth.uid()
    )
  );

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all interests" ON agency_interests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
