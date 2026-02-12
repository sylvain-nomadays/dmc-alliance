-- =============================================
-- DMC Alliance - Partner/DMC Multi-User Support
-- Permet à plusieurs utilisateurs de partager le même compte DMC
-- Basé sur le modèle agency_members / agency_join_requests
-- =============================================

-- =============================================
-- 1. TABLE: partner_members
-- Gestion des membres d'un même partenaire DMC (multi-utilisateurs)
-- =============================================

CREATE TABLE IF NOT EXISTS partner_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(partner_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_partner_members_partner ON partner_members(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_members_user ON partner_members(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_members_status ON partner_members(status);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_partner_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partner_member_updated ON partner_members;
CREATE TRIGGER trigger_partner_member_updated
    BEFORE UPDATE ON partner_members
    FOR EACH ROW
    EXECUTE FUNCTION update_partner_member_timestamp();

-- =============================================
-- 2. ROW LEVEL SECURITY pour partner_members
-- =============================================

ALTER TABLE partner_members ENABLE ROW LEVEL SECURITY;

-- Les propriétaires du partenaire peuvent gérer les membres
DROP POLICY IF EXISTS "Partner owners can manage members" ON partner_members;
CREATE POLICY "Partner owners can manage members"
    ON partner_members FOR ALL
    USING (
        partner_id IN (
            SELECT id FROM partners WHERE owner_id = auth.uid()
        )
        OR
        partner_id IN (
            SELECT partner_id FROM partner_members
            WHERE user_id = auth.uid() AND role = 'owner' AND status = 'active'
        )
    );

-- Les membres peuvent voir leur propre membership
DROP POLICY IF EXISTS "Members can view own partner membership" ON partner_members;
CREATE POLICY "Members can view own partner membership"
    ON partner_members FOR SELECT
    USING (user_id = auth.uid());

-- Admins peuvent tout gérer
DROP POLICY IF EXISTS "Admins can manage all partner members" ON partner_members;
CREATE POLICY "Admins can manage all partner members"
    ON partner_members FOR ALL
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =============================================
-- 3. MAJ RLS sur partners : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can view own record" ON partners;
CREATE POLICY "Partners can view own record"
ON partners FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid()
    OR
    id IN (
        SELECT partner_id FROM partner_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

DROP POLICY IF EXISTS "Partners can update own record" ON partners;
CREATE POLICY "Partners can update own record"
ON partners FOR UPDATE
TO authenticated
USING (
    owner_id = auth.uid()
    OR
    id IN (
        SELECT partner_id FROM partner_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
);

-- =============================================
-- 4. MAJ RLS sur destinations : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can view own destinations" ON destinations;
CREATE POLICY "Partners can view own destinations"
ON destinations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = destinations.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
);

DROP POLICY IF EXISTS "Partners can update own destinations" ON destinations;
CREATE POLICY "Partners can update own destinations"
ON destinations FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = destinations.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 5. MAJ RLS sur circuits : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can view own circuits" ON circuits;
CREATE POLICY "Partners can view own circuits"
ON circuits FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = circuits.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
);

DROP POLICY IF EXISTS "Partners can insert circuits" ON circuits;
CREATE POLICY "Partners can insert circuits"
ON circuits FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = circuits.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

DROP POLICY IF EXISTS "Partners can update own circuits" ON circuits;
CREATE POLICY "Partners can update own circuits"
ON circuits FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = circuits.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

DROP POLICY IF EXISTS "Partners can delete own circuits" ON circuits;
CREATE POLICY "Partners can delete own circuits"
ON circuits FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = circuits.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 6. MAJ RLS sur circuit_departures : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own circuit departures" ON circuit_departures;
CREATE POLICY "Partners can manage own circuit departures"
ON circuit_departures FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM circuits c
        JOIN partners p ON p.id = c.partner_id
        WHERE c.id = circuit_departures.circuit_id
        AND (
            p.owner_id = auth.uid()
            OR p.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 7. MAJ RLS sur quote_requests : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can view own quote requests" ON quote_requests;
CREATE POLICY "Partners can view own quote requests"
ON quote_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = quote_requests.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 8. MAJ RLS sur team_members : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own team members" ON team_members;
CREATE POLICY "Partners can manage own team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = team_members.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 9. MAJ RLS sur testimonials : ajouter check partner_members
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own testimonials" ON testimonials;
CREATE POLICY "Partners can manage own testimonials"
ON testimonials FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM partners
        WHERE partners.id = testimonials.partner_id
        AND (
            partners.owner_id = auth.uid()
            OR partners.id IN (
                SELECT partner_id FROM partner_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
            )
        )
    )
);

-- =============================================
-- 10. SEED: Ajouter les propriétaires existants à partner_members
-- =============================================

INSERT INTO partner_members (partner_id, user_id, role, status, joined_at)
SELECT id, owner_id, 'owner', 'active', created_at
FROM partners
WHERE owner_id IS NOT NULL
ON CONFLICT (partner_id, user_id) DO NOTHING;

-- =============================================
-- 11. COMMENTAIRES
-- =============================================

COMMENT ON TABLE partner_members IS 'Membres d''un partenaire DMC - permet à plusieurs utilisateurs de partager le même compte DMC';
COMMENT ON COLUMN partner_members.role IS 'owner = propriétaire, admin = peut gérer membres, member = accès standard';
COMMENT ON COLUMN partner_members.status IS 'pending = en attente, active = membre actif, inactive = désactivé';
