-- =====================================================
-- THE DMC ALLIANCE - DATABASE SCHEMA
-- =====================================================
-- Ce fichier contient le schema complet de la base de données
-- À exécuter dans Supabase SQL Editor

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- Rôles utilisateurs
CREATE TYPE user_role AS ENUM ('admin', 'partner', 'agency', 'member');

-- Statut des circuits GIR
CREATE TYPE circuit_status AS ENUM ('draft', 'published', 'full', 'completed', 'cancelled');

-- Niveau de difficulté
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'challenging', 'expert');

-- Statut des réservations
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Statut des demandes de devis
CREATE TYPE quote_status AS ENUM ('new', 'in_progress', 'quoted', 'accepted', 'declined');

-- Type de contenu CMS
CREATE TYPE content_type AS ENUM ('page', 'article', 'destination', 'service');

-- Tier partenaire
CREATE TYPE partner_tier AS ENUM ('premium', 'classic');

-- Régions
CREATE TYPE region AS ENUM ('asia', 'africa', 'europe', 'americas', 'middle_east', 'oceania');

-- =====================================================
-- 3. TABLES PRINCIPALES
-- =====================================================

-- -----------------------------------------------------
-- Table: profiles (extension de auth.users)
-- -----------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role user_role DEFAULT 'member',
    phone TEXT,
    avatar_url TEXT,
    locale TEXT DEFAULT 'fr',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: partners (Agences réceptives membres)
-- -----------------------------------------------------
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tier partner_tier DEFAULT 'classic',
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    description_fr TEXT,
    description_en TEXT,
    specialties TEXT[] DEFAULT '{}',
    has_gir BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: destinations
-- -----------------------------------------------------
CREATE TABLE destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    name_fr TEXT NOT NULL,
    name_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    country_code TEXT NOT NULL, -- ISO code
    region region NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: agencies (TO et agences de voyage clientes)
-- -----------------------------------------------------
CREATE TABLE agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    license_number TEXT, -- Numéro d'immatriculation
    address TEXT,
    city TEXT,
    country TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Taux de commission par défaut
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: circuits (GIR co-remplissage)
-- -----------------------------------------------------
CREATE TABLE circuits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
    title_fr TEXT NOT NULL,
    title_en TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description_fr TEXT,
    description_en TEXT,
    itinerary_fr TEXT, -- JSON ou Markdown
    itinerary_en TEXT,
    duration_days INTEGER NOT NULL,
    difficulty difficulty_level DEFAULT 'moderate',
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    price_from DECIMAL(10,2) NOT NULL, -- Prix à partir de
    price_single_room DECIMAL(10,2), -- Supplément single
    places_total INTEGER NOT NULL,
    places_available INTEGER NOT NULL,
    min_participants INTEGER DEFAULT 4,
    max_participants INTEGER DEFAULT 16,
    included_fr TEXT,
    included_en TEXT,
    excluded_fr TEXT,
    excluded_en TEXT,
    image_url TEXT,
    gallery_urls TEXT[] DEFAULT '{}',
    status circuit_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: bookings (Réservations GIR)
-- -----------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circuit_id UUID REFERENCES circuits(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,
    places_booked INTEGER NOT NULL DEFAULT 1,
    room_type TEXT, -- single, double, triple
    special_requests TEXT,
    total_price DECIMAL(10,2),
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(10,2),
    status booking_status DEFAULT 'pending',
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: quote_requests (Demandes de devis)
-- -----------------------------------------------------
CREATE TABLE quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    company_name TEXT,
    trip_type TEXT, -- 'fit', 'group', 'mice', 'incentive'
    travelers_count INTEGER,
    departure_date DATE,
    duration_days INTEGER,
    budget_range TEXT,
    message TEXT,
    status quote_status DEFAULT 'new',
    assigned_to UUID REFERENCES profiles(id),
    notes TEXT, -- Notes internes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: cms_pages (Pages CMS)
-- -----------------------------------------------------
CREATE TABLE cms_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    type content_type DEFAULT 'page',
    title_fr TEXT NOT NULL,
    title_en TEXT,
    content_fr TEXT, -- Rich text (HTML/Markdown)
    content_en TEXT,
    excerpt_fr TEXT,
    excerpt_en TEXT,
    image_url TEXT,
    meta_title_fr TEXT,
    meta_title_en TEXT,
    meta_description_fr TEXT,
    meta_description_en TEXT,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: articles (Blog/Magazine)
-- -----------------------------------------------------
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    title_fr TEXT NOT NULL,
    title_en TEXT,
    content_fr TEXT,
    content_en TEXT,
    excerpt_fr TEXT,
    excerpt_en TEXT,
    image_url TEXT,
    author_id UUID REFERENCES profiles(id),
    destination_id UUID REFERENCES destinations(id),
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: newsletter_subscribers
-- -----------------------------------------------------
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    locale TEXT DEFAULT 'fr',
    interests TEXT[] DEFAULT '{}', -- 'gir', 'destinations', 'offers', 'magazine'
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- -----------------------------------------------------
-- Table: contact_messages
-- -----------------------------------------------------
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table: media (Gestion des fichiers)
-- -----------------------------------------------------
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER,
    url TEXT NOT NULL,
    alt_text TEXT,
    folder TEXT DEFAULT 'general',
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_partners_slug ON partners(slug);
CREATE INDEX idx_partners_tier ON partners(tier);
CREATE INDEX idx_destinations_slug ON destinations(slug);
CREATE INDEX idx_destinations_region ON destinations(region);
CREATE INDEX idx_circuits_status ON circuits(status);
CREATE INDEX idx_circuits_departure ON circuits(departure_date);
CREATE INDEX idx_circuits_destination ON circuits(destination_id);
CREATE INDEX idx_bookings_circuit ON bookings(circuit_id);
CREATE INDEX idx_bookings_agency ON bookings(agency_id);
CREATE INDEX idx_articles_published ON articles(is_published, published_at);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Policies: profiles
-- -----------------------------------------------------
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all profiles"
    ON profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: partners (public read, admin write)
-- -----------------------------------------------------
CREATE POLICY "Anyone can view active partners"
    ON partners FOR SELECT
    USING (is_active = true);

CREATE POLICY "Partners can update their own data"
    ON partners FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage partners"
    ON partners FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: destinations (public read)
-- -----------------------------------------------------
CREATE POLICY "Anyone can view active destinations"
    ON destinations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage destinations"
    ON destinations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: circuits (public read published, partners manage own)
-- -----------------------------------------------------
CREATE POLICY "Anyone can view published circuits"
    ON circuits FOR SELECT
    USING (status = 'published');

CREATE POLICY "Partners can manage their circuits"
    ON circuits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM partners
            WHERE partners.id = circuits.partner_id
            AND partners.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all circuits"
    ON circuits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: bookings
-- -----------------------------------------------------
CREATE POLICY "Agencies can view their bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = bookings.agency_id
            AND agencies.user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM agencies
            WHERE agencies.id = bookings.agency_id
            AND agencies.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view bookings for their circuits"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM circuits
            JOIN partners ON partners.id = circuits.partner_id
            WHERE circuits.id = bookings.circuit_id
            AND partners.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all bookings"
    ON bookings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: articles (public read published)
-- -----------------------------------------------------
CREATE POLICY "Anyone can view published articles"
    ON articles FOR SELECT
    USING (is_published = true);

CREATE POLICY "Admins can manage articles"
    ON articles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: cms_pages (public read published)
-- -----------------------------------------------------
CREATE POLICY "Anyone can view published pages"
    ON cms_pages FOR SELECT
    USING (is_published = true);

CREATE POLICY "Admins can manage pages"
    ON cms_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: contact_messages
-- -----------------------------------------------------
CREATE POLICY "Anyone can create contact messages"
    ON contact_messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view contact messages"
    ON contact_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- -----------------------------------------------------
-- Policies: newsletter_subscribers
-- -----------------------------------------------------
CREATE POLICY "Anyone can subscribe to newsletter"
    ON newsletter_subscribers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can manage subscribers"
    ON newsletter_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 6. FUNCTIONS & TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_destinations_updated_at
    BEFORE UPDATE ON destinations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_circuits_updated_at
    BEFORE UPDATE ON circuits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction pour créer un profil après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction pour mettre à jour les places disponibles après booking
CREATE OR REPLACE FUNCTION update_circuit_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE circuits
        SET places_available = places_available - NEW.places_booked
        WHERE id = NEW.circuit_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
        UPDATE circuits
        SET places_available = places_available - NEW.places_booked
        WHERE id = NEW.circuit_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
        UPDATE circuits
        SET places_available = places_available + OLD.places_booked
        WHERE id = OLD.circuit_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_on_booking
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_circuit_availability();

-- =====================================================
-- 7. SEED DATA (Données initiales)
-- =====================================================

-- Note: À exécuter séparément après avoir créé un utilisateur admin
-- Les données des partenaires seront insérées via l'interface admin ou un script séparé
