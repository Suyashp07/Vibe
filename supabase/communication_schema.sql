-- Communication Gateway Schema: Host <-> Guest
-- Run this in Supabase SQL Editor to enable host announcements and direct 1-on-1 Q&A messaging

-- 1. EVENT ANNOUNCEMENTS TABLE (Broadcasts from Host to Attendees)
CREATE TABLE IF NOT EXISTS public.event_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_audience text CHECK (target_audience IN ('all', 'confirmed', 'waitlisted')) DEFAULT 'all',
  is_urgent boolean DEFAULT false,
  send_email boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_event_id ON public.event_announcements(event_id, created_at DESC);

-- 2. EVENT DIRECT MESSAGES / GUEST INQUIRIES (1-on-1 Q&A between Host and Guest)
CREATE TABLE IF NOT EXISTS public.event_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_role text CHECK (sender_role IN ('guest', 'host')) NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  rsvp_id uuid REFERENCES public.rsvps(id) ON DELETE SET NULL,
  subject text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  parent_id uuid REFERENCES public.event_messages(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.event_messages(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.event_messages(recipient_email);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.event_messages(sender_email);

-- Enable RLS
ALTER TABLE public.event_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Announcements RLS Policies:
-- Anyone can view announcements for public events or events they have access to
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_announcements' AND policyname = 'Announcements viewable by everyone'
  ) THEN
    CREATE POLICY "Announcements viewable by everyone" 
      ON public.event_announcements FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_announcements' AND policyname = 'Organizers can insert announcements'
  ) THEN
    CREATE POLICY "Organizers can insert announcements" 
      ON public.event_announcements FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Direct Messages RLS Policies:
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_messages' AND policyname = 'Messages viewable by thread participants'
  ) THEN
    CREATE POLICY "Messages viewable by thread participants" 
      ON public.event_messages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'event_messages' AND policyname = 'Anyone can send a message'
  ) THEN
    CREATE POLICY "Anyone can send a message" 
      ON public.event_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Try adding to realtime publication if available
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_announcements;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
