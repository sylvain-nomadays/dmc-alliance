-- =============================================
-- DMC Alliance - Initial Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'partner', 'agency', 'user');

-- Partner tiers
CREATE TYPE partner_tier AS ENUM ('premium', 'standard', 'basic');

-- Content status
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');

-- Region types
CREATE TYPE region_type AS ENUM ('asia', 'africa', 'europe', 'americas', 'middle-east', 'oceania');

-- Article categories
CREATE TYPE article_category AS ENUM ('destinations', 'trends', 'tips', 'partners', 'gir');

-- Quote request status
CREATE TYPE quote_status AS ENUM ('new', 'pending', 'replied', 'converted', 'closed');

-- =============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- PARTNERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,

  -- Location
  country TEXT NOT NULL,
  city TEXT,
  region region_type NOT NULL DEFAULT 'asia',

  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,

  -- Content (multilingual)
  description_fr TEXT,
  description_en TEXT,
  story_fr TEXT,
  story_en TEXT,
  mission_fr TEXT,
  mission_en TEXT,

  -- Contact
  email TEXT,
  phone TEXT,
  website TEXT,

  -- Social
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,

  -- Business info
  tier partner_tier NOT NULL DEFAULT 'standard',
  founded_year INTEGER,
  team_size INTEGER,
  languages TEXT[], -- Array of language codes
  certifications TEXT[],

  -- B2B Services
  b2b_services JSONB DEFAULT '[]'::jsonb,
  commission_rate DECIMAL(5,2),

  -- Settings
  has_gir BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Owner (linked to profiles)
  owner_id UUID REFERENCES profiles(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_slug ON partners(slug);
CREATE INDEX idx_partners_region ON partners(region);
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_partners_is_active ON partners(is_active);

-- =============================================
-- DESTINATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,

  -- Names (multilingual)
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,

  -- Location
  country TEXT NOT NULL,
  region region_type NOT NULL DEFAULT 'asia',

  -- Content (multilingual)
  description_fr TEXT,
  description_en TEXT,
  highlights TEXT[], -- Array of highlight points

  -- Media
  image_url TEXT,
  gallery_urls TEXT[],
  video_url TEXT, -- Webinar video

  -- Travel info
  best_time TEXT, -- e.g., "Mai - Septembre"
  ideal_duration TEXT, -- e.g., "12-15 jours"

  -- B2B info
  selling_points_fr TEXT[],
  selling_points_en TEXT[],
  ideal_clientele_fr TEXT[],
  ideal_clientele_en TEXT[],

  -- Relations
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_region ON destinations(region);
CREATE INDEX idx_destinations_partner ON destinations(partner_id);
CREATE INDEX idx_destinations_is_active ON destinations(is_active);

-- =============================================
-- CIRCUITS TABLE (GIR)
-- =============================================

CREATE TABLE IF NOT EXISTS circuits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,

  -- Basic info
  title TEXT NOT NULL,
  subtitle TEXT,

  -- Content (multilingual)
  description_fr TEXT,
  description_en TEXT,
  highlights_fr TEXT[],
  highlights_en TEXT[],

  -- Itinerary (stored as JSONB)
  itinerary JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ day: 1, title_fr, title_en, description_fr, description_en, meals: { breakfast, lunch, dinner }, accommodation }]

  -- Pricing
  price_from DECIMAL(10,2) NOT NULL,
  price_single_supplement DECIMAL(10,2),
  commission_rate DECIMAL(5,2) DEFAULT 10.00,

  -- Details
  duration_days INTEGER NOT NULL,
  group_size_min INTEGER DEFAULT 2,
  group_size_max INTEGER DEFAULT 16,
  difficulty_level INTEGER DEFAULT 2, -- 1-5

  -- Inclusions
  included_fr TEXT[],
  included_en TEXT[],
  not_included_fr TEXT[],
  not_included_en TEXT[],

  -- Media
  image_url TEXT,
  gallery_urls TEXT[],

  -- Relations
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Status
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_circuits_slug ON circuits(slug);
CREATE INDEX idx_circuits_destination ON circuits(destination_id);
CREATE INDEX idx_circuits_partner ON circuits(partner_id);
CREATE INDEX idx_circuits_status ON circuits(status);

-- =============================================
-- CIRCUIT DEPARTURES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS circuit_departures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circuit_id UUID NOT NULL REFERENCES circuits(id) ON DELETE CASCADE,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Pricing (can override circuit defaults)
  price DECIMAL(10,2),
  price_single_supplement DECIMAL(10,2),

  -- Availability
  total_seats INTEGER NOT NULL DEFAULT 16,
  booked_seats INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'available', -- available, almost_full, full, cancelled
  is_guaranteed BOOLEAN DEFAULT false,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departures_circuit ON circuit_departures(circuit_id);
CREATE INDEX idx_departures_date ON circuit_departures(start_date);
CREATE INDEX idx_departures_status ON circuit_departures(status);

-- =============================================
-- ARTICLES TABLE (Magazine)
-- =============================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,

  -- Content
  title TEXT NOT NULL,
  title_en TEXT,
  excerpt TEXT,
  excerpt_en TEXT,
  content TEXT, -- HTML or Markdown
  content_en TEXT,

  -- Media
  image_url TEXT,

  -- Categorization
  category article_category NOT NULL DEFAULT 'destinations',
  tags TEXT[],

  -- Author
  author_id UUID REFERENCES profiles(id),
  author_name TEXT,
  author_role TEXT,
  author_avatar TEXT,

  -- Reading
  read_time INTEGER DEFAULT 5, -- minutes

  -- Relations
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Status
  status content_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);

-- =============================================
-- QUOTE REQUESTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Request details
  subject TEXT NOT NULL DEFAULT 'quote',
  message TEXT NOT NULL,

  -- Travel details
  destination TEXT,
  travel_dates TEXT,
  group_size INTEGER,
  budget_range TEXT,

  -- Relations
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  circuit_id UUID REFERENCES circuits(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,

  -- Status
  status quote_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),

  -- Notes (internal)
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replied_at TIMESTAMPTZ
);

CREATE INDEX idx_quotes_status ON quote_requests(status);
CREATE INDEX idx_quotes_created ON quote_requests(created_at DESC);
CREATE INDEX idx_quotes_partner ON quote_requests(partner_id);

-- =============================================
-- CONTACT MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,

  -- Message
  subject TEXT,
  message TEXT NOT NULL,

  -- Status
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_read ON contact_messages(is_read);
CREATE INDEX idx_messages_created ON contact_messages(created_at DESC);

-- =============================================
-- TEAM MEMBERS TABLE (for partners)
-- =============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Info
  name TEXT NOT NULL,
  role_fr TEXT,
  role_en TEXT,
  bio_fr TEXT,
  bio_en TEXT,

  -- Media
  photo_url TEXT,

  -- Social
  linkedin_url TEXT,

  -- Settings
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_partner ON team_members(partner_id);

-- =============================================
-- TESTIMONIALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Content
  content_fr TEXT NOT NULL,
  content_en TEXT,

  -- Author
  author_name TEXT NOT NULL,
  author_company TEXT,
  author_role TEXT,

  -- Settings
  is_visible BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_testimonials_partner ON testimonials(partner_id);

-- =============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,

  -- Info
  name TEXT,
  company TEXT,

  -- Preferences
  locale TEXT DEFAULT 'fr',
  interests TEXT[],

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON newsletter_subscribers(is_active);

-- =============================================
-- UPDATE TIMESTAMP TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_circuits_updated_at BEFORE UPDATE ON circuits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_departures_updated_at BEFORE UPDATE ON circuit_departures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quote_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
