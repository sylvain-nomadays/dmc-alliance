-- =============================================
-- DMC Alliance - Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================
-- PARTNERS POLICIES
-- =============================================

-- Public can view active partners
CREATE POLICY "Public can view active partners"
ON partners FOR SELECT
USING (is_active = true);

-- Admins can do everything on partners
CREATE POLICY "Admins full access to partners"
ON partners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can view and update their own record
CREATE POLICY "Partners can view own record"
ON partners FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Partners can update own record"
ON partners FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- =============================================
-- DESTINATIONS POLICIES
-- =============================================

-- Public can view active destinations
CREATE POLICY "Public can view active destinations"
ON destinations FOR SELECT
USING (is_active = true);

-- Admins can do everything
CREATE POLICY "Admins full access to destinations"
ON destinations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can view and manage destinations linked to them
CREATE POLICY "Partners can view own destinations"
ON destinations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = destinations.partner_id
    AND partners.owner_id = auth.uid()
  )
);

CREATE POLICY "Partners can update own destinations"
ON destinations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = destinations.partner_id
    AND partners.owner_id = auth.uid()
  )
);

-- =============================================
-- CIRCUITS POLICIES
-- =============================================

-- Public can view published circuits
CREATE POLICY "Public can view published circuits"
ON circuits FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins full access to circuits"
ON circuits FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can manage their circuits
CREATE POLICY "Partners can view own circuits"
ON circuits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = circuits.partner_id
    AND partners.owner_id = auth.uid()
  )
);

CREATE POLICY "Partners can insert circuits"
ON circuits FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = circuits.partner_id
    AND partners.owner_id = auth.uid()
  )
);

CREATE POLICY "Partners can update own circuits"
ON circuits FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = circuits.partner_id
    AND partners.owner_id = auth.uid()
  )
);

CREATE POLICY "Partners can delete own circuits"
ON circuits FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = circuits.partner_id
    AND partners.owner_id = auth.uid()
  )
);

-- =============================================
-- CIRCUIT DEPARTURES POLICIES
-- =============================================

-- Public can view departures of published circuits
CREATE POLICY "Public can view departures"
ON circuit_departures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM circuits
    WHERE circuits.id = circuit_departures.circuit_id
    AND circuits.status = 'published'
  )
);

-- Admins can do everything
CREATE POLICY "Admins full access to departures"
ON circuit_departures FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can manage departures of their circuits
CREATE POLICY "Partners can manage own departures"
ON circuit_departures FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM circuits c
    JOIN partners p ON p.id = c.partner_id
    WHERE c.id = circuit_departures.circuit_id
    AND p.owner_id = auth.uid()
  )
);

-- =============================================
-- ARTICLES POLICIES
-- =============================================

-- Public can view published articles
CREATE POLICY "Public can view published articles"
ON articles FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins full access to articles"
ON articles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Authors can view and edit their own articles
CREATE POLICY "Authors can view own articles"
ON articles FOR SELECT
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Authors can update own articles"
ON articles FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

-- =============================================
-- QUOTE REQUESTS POLICIES
-- =============================================

-- Anyone can insert quote requests (contact form)
CREATE POLICY "Anyone can submit quote request"
ON quote_requests FOR INSERT
WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins full access to quotes"
ON quote_requests FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can view quotes assigned to them
CREATE POLICY "Partners can view assigned quotes"
ON quote_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = quote_requests.partner_id
    AND partners.owner_id = auth.uid()
  )
);

-- =============================================
-- CONTACT MESSAGES POLICIES
-- =============================================

-- Anyone can submit contact messages
CREATE POLICY "Anyone can submit contact message"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- Only admins can view and manage messages
CREATE POLICY "Admins full access to messages"
ON contact_messages FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================
-- TEAM MEMBERS POLICIES
-- =============================================

-- Public can view visible team members
CREATE POLICY "Public can view team members"
ON team_members FOR SELECT
USING (
  is_visible = true
  AND EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = team_members.partner_id
    AND partners.is_active = true
  )
);

-- Admins can do everything
CREATE POLICY "Admins full access to team"
ON team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can manage their team
CREATE POLICY "Partners can manage own team"
ON team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = team_members.partner_id
    AND partners.owner_id = auth.uid()
  )
);

-- =============================================
-- TESTIMONIALS POLICIES
-- =============================================

-- Public can view visible testimonials
CREATE POLICY "Public can view testimonials"
ON testimonials FOR SELECT
USING (
  is_visible = true
  AND EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = testimonials.partner_id
    AND partners.is_active = true
  )
);

-- Admins can do everything
CREATE POLICY "Admins full access to testimonials"
ON testimonials FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Partners can manage their testimonials
CREATE POLICY "Partners can manage own testimonials"
ON testimonials FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM partners
    WHERE partners.id = testimonials.partner_id
    AND partners.owner_id = auth.uid()
  )
);

-- =============================================
-- NEWSLETTER SUBSCRIBERS POLICIES
-- =============================================

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers FOR INSERT
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view subscribers"
ON newsletter_subscribers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can manage subscribers
CREATE POLICY "Admins full access to subscribers"
ON newsletter_subscribers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
