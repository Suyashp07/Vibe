-- =============================================================================
-- Migration: Add Event Poster Processing Fields and Storage Setup
-- Date: 2026-11-06
-- Description:
--   Adds metadata and WebP variant URLs to the public.events table to support
--   full-poster display (no cropping) across hero banners and card grids.
-- =============================================================================

-- 1. Add Poster Pipeline Columns to public.events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS poster_original_url text,
  ADD COLUMN IF NOT EXISTS poster_width int,
  ADD COLUMN IF NOT EXISTS poster_height int,
  ADD COLUMN IF NOT EXISTS poster_aspect_ratio numeric,
  ADD COLUMN IF NOT EXISTS poster_dominant_color text,
  ADD COLUMN IF NOT EXISTS poster_is_low_res boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS poster_hero_url text,
  ADD COLUMN IF NOT EXISTS poster_card_url text,
  ADD COLUMN IF NOT EXISTS poster_thumb_url text,
  ADD COLUMN IF NOT EXISTS poster_blur_data_url text,
  ADD COLUMN IF NOT EXISTS poster_source_hash text,
  ADD COLUMN IF NOT EXISTS poster_processing_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS poster_processed_at timestamptz;

-- Add check constraint for poster_processing_status if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_poster_processing_status_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_poster_processing_status_check
      CHECK (poster_processing_status IN ('pending', 'processed', 'failed'));
  END IF;
END $$;

-- 2. Indexes for Backfill and Idempotent Ingestion Lookups
CREATE INDEX IF NOT EXISTS idx_events_poster_processing_status
  ON public.events (poster_processing_status);

CREATE INDEX IF NOT EXISTS idx_events_poster_source_hash
  ON public.events (poster_source_hash);

-- 3. Storage Bucket Setup: 'event-posters'
-- Note: In Supabase, the storage bucket can be initialized via the dashboard,
-- API, or the following SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-posters',
  'event-posters',
  true,
  15728640, -- 15 MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif'];

-- 4. Storage Policies for 'event-posters'
-- Public read access for global CDN delivery
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for event posters'
  ) THEN
    CREATE POLICY "Public read access for event posters"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'event-posters');
  END IF;
END $$;

-- Service-role write access only (no client-side modifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role write access for event posters'
  ) THEN
    CREATE POLICY "Service role write access for event posters"
      ON storage.objects FOR ALL
      USING (bucket_id = 'event-posters' AND auth.role() = 'service_role')
      WITH CHECK (bucket_id = 'event-posters' AND auth.role() = 'service_role');
  END IF;
END $$;

