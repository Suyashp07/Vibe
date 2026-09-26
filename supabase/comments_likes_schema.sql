-- =========================================================
-- VIBE — EVENT COMMENTS & LIKES TABLES
-- Run this in your Supabase SQL Editor
-- =========================================================

-- 1. EVENT COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT 'Guest',
  user_email text,
  user_avatar text,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamptz DEFAULT now()
);

-- Index for fast event-scoped queries
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_created_at ON public.event_comments(created_at DESC);

-- 2. EVENT LIKES TABLE (persistent, deduplicated)
CREATE TABLE IF NOT EXISTS public.event_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_identifier text NOT NULL,  -- email or device fingerprint
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_identifier)
);

CREATE INDEX IF NOT EXISTS idx_event_likes_event_id ON public.event_likes(event_id);

-- 3. Enable Row Level Security
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Anyone can read comments" ON public.event_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON public.event_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read likes" ON public.event_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert likes" ON public.event_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own likes" ON public.event_likes FOR DELETE USING (true);
