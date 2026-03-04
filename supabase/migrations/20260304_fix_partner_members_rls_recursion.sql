-- =============================================
-- Fix: infinite recursion in partner_members RLS policies
--
-- Problem: partner_members policy checks partners table,
-- partners policy checks partner_members table = circular dependency.
-- Also partner_members policy self-references partner_members.
--
-- Solution: SECURITY DEFINER functions that bypass RLS when
-- checking partner membership, breaking the recursion chain.
-- =============================================

-- 1. Helper function: get all partner IDs for a user (any role)
CREATE OR REPLACE FUNCTION public.get_user_partner_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT partner_id FROM partner_members
  WHERE user_id = p_user_id AND status = 'active'
  UNION
  SELECT id FROM partners WHERE owner_id = p_user_id;
$$;

-- 2. Helper function: get partner IDs where user is admin or owner
CREATE OR REPLACE FUNCTION public.get_user_admin_partner_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT partner_id FROM partner_members
  WHERE user_id = p_user_id AND role IN ('owner', 'admin') AND status = 'active'
  UNION
  SELECT id FROM partners WHERE owner_id = p_user_id;
$$;

-- =============================================
-- 3. Fix partner_members policies (self-reference + cross-reference)
-- =============================================

DROP POLICY IF EXISTS "Partner owners can manage members" ON partner_members;
CREATE POLICY "Partner owners can manage members"
    ON partner_members FOR ALL
    USING (
        partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
    );

-- Keep existing policies that don't cause recursion:
-- "Members can view own partner membership" (user_id = auth.uid()) — no recursion
-- "Admins can manage all partner members" (checks profiles.role) — no recursion

-- =============================================
-- 4. Fix partners policies
-- =============================================

DROP POLICY IF EXISTS "Partners can view own record" ON partners;
CREATE POLICY "Partners can view own record"
ON partners FOR SELECT
TO authenticated
USING (
    id IN (SELECT public.get_user_partner_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Partners can update own record" ON partners;
CREATE POLICY "Partners can update own record"
ON partners FOR UPDATE
TO authenticated
USING (
    id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

-- =============================================
-- 5. Fix destinations policies
-- =============================================

DROP POLICY IF EXISTS "Partners can view own destinations" ON destinations;
CREATE POLICY "Partners can view own destinations"
ON destinations FOR SELECT
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Partners can update own destinations" ON destinations;
CREATE POLICY "Partners can update own destinations"
ON destinations FOR UPDATE
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

-- =============================================
-- 6. Fix circuits policies
-- =============================================

DROP POLICY IF EXISTS "Partners can view own circuits" ON circuits;
CREATE POLICY "Partners can view own circuits"
ON circuits FOR SELECT
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Partners can insert circuits" ON circuits;
CREATE POLICY "Partners can insert circuits"
ON circuits FOR INSERT
TO authenticated
WITH CHECK (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Partners can update own circuits" ON circuits;
CREATE POLICY "Partners can update own circuits"
ON circuits FOR UPDATE
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

DROP POLICY IF EXISTS "Partners can delete own circuits" ON circuits;
CREATE POLICY "Partners can delete own circuits"
ON circuits FOR DELETE
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

-- =============================================
-- 7. Fix circuit_departures policy (the one causing Dominique's error)
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own circuit departures" ON circuit_departures;
CREATE POLICY "Partners can manage own circuit departures"
ON circuit_departures FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM circuits c
        WHERE c.id = circuit_departures.circuit_id
        AND c.partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
    )
);

-- =============================================
-- 8. Fix quote_requests policy
-- =============================================

DROP POLICY IF EXISTS "Partners can view own quote requests" ON quote_requests;
CREATE POLICY "Partners can view own quote requests"
ON quote_requests FOR SELECT
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
);

-- =============================================
-- 9. Fix team_members policy
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own team members" ON team_members;
CREATE POLICY "Partners can manage own team members"
ON team_members FOR ALL
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

-- =============================================
-- 10. Fix testimonials policy
-- =============================================

DROP POLICY IF EXISTS "Partners can manage own testimonials" ON testimonials;
CREATE POLICY "Partners can manage own testimonials"
ON testimonials FOR ALL
TO authenticated
USING (
    partner_id IN (SELECT public.get_user_admin_partner_ids(auth.uid()))
);

-- =============================================
-- 11. Fix agency_requests policies (same pattern)
-- =============================================

DROP POLICY IF EXISTS "Partners can update requests for their circuits" ON agency_requests;
CREATE POLICY "Partners can update requests for their circuits"
    ON agency_requests FOR UPDATE
    USING (
        circuit_id IN (
            SELECT c.id FROM circuits c
            WHERE c.partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
        )
    )
    WITH CHECK (
        circuit_id IN (
            SELECT c.id FROM circuits c
            WHERE c.partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Partners can view requests for their circuits" ON agency_requests;
CREATE POLICY "Partners can view requests for their circuits"
    ON agency_requests FOR SELECT
    USING (
        circuit_id IN (
            SELECT c.id FROM circuits c
            WHERE c.partner_id IN (SELECT public.get_user_partner_ids(auth.uid()))
        )
    );
