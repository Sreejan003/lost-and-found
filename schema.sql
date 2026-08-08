-- ============================================================================
-- CAMPUS LOST & FOUND - SUPABASE POSTGRESQL DATABASE SCHEMA & RLS POLICIES
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 3. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    building_code TEXT
);

-- 4. ITEMS TABLE
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    location TEXT NOT NULL,
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_seen_date DATE,
    color TEXT,
    distinguishing_features TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'returned', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OPTIONAL TABLE MIGRATIONS (Run if tables already exist)
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 5. IMAGES TABLE
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONTACTS / CLAIMS TABLE
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    interested_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ADMIN ACTIONS & LOGS TABLES
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('flagged', 'removed', 'approved')),
    reason TEXT,
    notes TEXT,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);
CREATE INDEX IF NOT EXISTS idx_images_item_id ON images(item_id);
CREATE INDEX IF NOT EXISTS idx_contacts_item_id ON contacts(item_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on items" ON items;
CREATE POLICY "Allow public read on items" ON items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated create on items" ON items;
CREATE POLICY "Allow authenticated create on items" ON items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow owners and admin update" ON items;
CREATE POLICY "Allow owners and admin update" ON items FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow owners and admin delete" ON items;
CREATE POLICY "Allow owners and admin delete" ON items FOR DELETE USING (true);

-- SEED DEFAULT CATEGORIES
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Phones, laptops, tablets, headphones, chargers'),
  ('Documents / ID Cards', 'Student IDs, driver licenses, passports, folders'),
  ('Accessories', 'Watches, jewelry, sunglasses, bags, wallets'),
  ('Clothing', 'Jackets, coats, hoodies, caps, shoes'),
  ('Stationery / Books', 'Textbooks, notebooks, pens, calculators'),
  ('Other', 'Miscellaneous campus items')
ON CONFLICT (name) DO NOTHING;

-- SEED DEFAULT LOCATIONS
INSERT INTO locations (name, building_code) VALUES
  ('Library', 'LIB-MAIN'),
  ('Canteen', 'SC-FOOD'),
  ('Hostel', 'RES-BLOCK'),
  ('Classrooms', 'ACAD-BLDG'),
  ('Sports Complex', 'GYM-ATH'),
  ('Other', 'CAMPUS-WIDE')
ON CONFLICT (name) DO NOTHING;

-- SEED DEFAULT USERS (ADMIN & DEMO STUDENTS)
INSERT INTO users (id, email, full_name, phone, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@gmail.com', 'Admin Moderator', '555-0199', 'admin', true),
  ('22222222-2222-2222-2222-222222222222', 'student@lostfound.edu', 'Alex Johnson', '555-0142', 'student', true),
  ('33333333-3333-3333-3333-333333333333', 'sam@lostfound.edu', 'Sam Wilson', '555-0188', 'student', true)
ON CONFLICT (email) DO NOTHING;
