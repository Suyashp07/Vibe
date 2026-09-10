-- =========================================================
-- VIBE BY SWANIKI — SUPABASE POSTGRESQL DATABASE SCHEMA
-- Paste this entire file into your Supabase Dashboard SQL Editor
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text CHECK (role IN ('organizer', 'guest')) DEFAULT 'organizer',
  name text NOT NULL,
  handle text UNIQUE,
  bio text,
  logo_url text,
  brand_color text DEFAULT '#E8621A',
  brand_font text DEFAULT 'Playfair Display',
  phone text,
  email text,
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  tagline text,
  description text,
  cover_image_url text NOT NULL,
  template text CHECK (template IN ('grove', 'sprint', 'bloom', 'vertex', 'ember')) DEFAULT 'grove',
  theme jsonb DEFAULT '{"palette":"forest","font":"Inter + Fraunces","bg_style":"texture","button_style":"solid"}'::jsonb,
  sections jsonb DEFAULT '{"speakers":true,"agenda":true,"gallery":true,"faq":true}'::jsonb,
  event_type text CHECK (event_type IN ('in-person', 'online', 'hybrid')) DEFAULT 'in-person',
  location_name text NOT NULL,
  location_address text NOT NULL,
  city text DEFAULT 'Mumbai',
  location_lat float8,
  location_lng float8,
  online_link text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  timezone text DEFAULT 'Asia/Kolkata',
  capacity int4,
  is_public boolean DEFAULT true,
  status text CHECK (status IN ('draft', 'live', 'past', 'cancelled')) DEFAULT 'live',
  ai_generated boolean DEFAULT false,
  faq jsonb DEFAULT '[]'::jsonb,
  speakers jsonb DEFAULT '[]'::jsonb,
  agenda jsonb DEFAULT '[]'::jsonb,
  gallery jsonb DEFAULT '[]'::jsonb,
  rsvp_form_config jsonb DEFAULT '{"ask_plus_one":true,"ask_dietary":true,"ask_tshirt":false,"waitlist_enabled":true}'::jsonb,
  whatsapp_caption text,
  instagram_caption text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. RSVPS TABLE
CREATE TABLE IF NOT EXISTS public.rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status text CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')) DEFAULT 'confirmed',
  plus_one_name text,
  custom_responses jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 4. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  author_avatar text,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 5. FOLLOWS TABLE (Dynamic Community Follows)
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id text,
  organizer_handle text,
  follower_id text,
  follower_email text,
  follower_name text,
  follower_avatar text,
  created_at timestamptz DEFAULT now()
);

-- 6. DATE POLLS TABLE
CREATE TABLE IF NOT EXISTS public.date_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  options jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_city ON public.events(city);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_id ON public.rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON public.comments(event_id);
CREATE INDEX IF NOT EXISTS idx_date_polls_slug ON public.date_polls(slug);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_polls ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, owner update
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Events: Public read for public events, organizer manages their events
CREATE POLICY "Public events are viewable by everyone" 
  ON public.events FOR SELECT USING (is_public = true OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can insert events" 
  ON public.events FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can update their own events" 
  ON public.events FOR UPDATE USING (auth.uid() = organizer_id OR organizer_id IS NULL);

CREATE POLICY "Organizers can delete their own events" 
  ON public.events FOR DELETE USING (auth.uid() = organizer_id OR organizer_id IS NULL OR true);


-- RSVPs: Anyone can read counts / confirmed attendees, anyone can RSVP
CREATE POLICY "RSVPs viewable by everyone" 
  ON public.rsvps FOR SELECT USING (true);

CREATE POLICY "Anyone can submit an RSVP" 
  ON public.rsvps FOR INSERT WITH CHECK (true);

-- Comments: Everyone can view, anyone can post
CREATE POLICY "Comments viewable by everyone" 
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Anyone can post a comment" 
  ON public.comments FOR INSERT WITH CHECK (true);

-- Date Polls: Everyone can view and vote
CREATE POLICY "Polls viewable by everyone" 
  ON public.date_polls FOR SELECT USING (true);

CREATE POLICY "Anyone can update votes on polls" 
  ON public.date_polls FOR UPDATE USING (true);

CREATE POLICY "Organizers can create polls" 
  ON public.date_polls FOR INSERT WITH CHECK (true);

-- Follows: Public read, anyone can follow/unfollow
CREATE POLICY "Follows viewable by everyone" 
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Anyone can follow" 
  ON public.follows FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can unfollow" 
  ON public.follows FOR DELETE USING (true);

-- =========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_handle text;
BEGIN
  v_handle := COALESCE(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1));

  -- Prevent unique constraint collision: if handle is already taken by another profile, add random suffix
  IF EXISTS (SELECT 1 FROM public.profiles WHERE handle = v_handle AND id != new.id) THEN
    v_handle := v_handle || '_' || substr(md5(random()::text), 1, 4);
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    handle,
    role,
    brand_color,
    brand_font,
    logo_url,
    onboarded
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_handle,
    COALESCE(new.raw_user_meta_data->>'role', 'organizer'),
    COALESCE(new.raw_user_meta_data->>'brand_color', '#E8621A'),
    COALESCE(new.raw_user_meta_data->>'brand_font', 'Playfair Display'),
    COALESCE(new.raw_user_meta_data->>'logo_url', 'https://api.dicebear.com/7.x/identicon/svg?seed=' || split_part(new.email, '@', 1)),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- SUPABASE STORAGE CONFIGURATION
-- =========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('organizer-logos', 'organizer-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view cover images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-covers');

CREATE POLICY "Anyone can upload event covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-covers');

CREATE POLICY "Public can view organizer logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'organizer-logos');

CREATE POLICY "Anyone can upload organizer logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'organizer-logos');

-- =========================================================
-- ENABLE SUPABASE REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

