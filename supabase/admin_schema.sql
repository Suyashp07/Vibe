-- =========================================================
-- VIBE BY SWANIKI — ADMIN PANEL & SECURITY SCHEMA MIGRATION
-- Paste this entire file into your Supabase SQL Editor and click 'Run'
-- =========================================================

-- 1. UPGRADE PROFILES ROLE CONSTRAINT
-- Drop existing restriction and allow super_admin, curator, organizer, and guest
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'curator', 'organizer', 'guest'));

-- Elevate primary administrators
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email IN (
  'suyashpersonal@gmail.com',
  'suyashpandey4002@gmail.com',
  'pandeysuyash100@gmail.com',
  'suyashpersonal100@gmail.com'
);

-- 2. CREATE IMMUTABLE AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL DEFAULT 'admin',
  action text NOT NULL, -- e.g. 'event.publish', 'event.discard', 'event.edit', 'curator.add', 'curator.remove'
  target_type text NOT NULL, -- 'event', 'rsvp', 'profile', 'curator'
  target_id text NOT NULL,
  ip_address text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Index for fast sorting by recent activity
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable Row Level Security (Append-Only)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users who are admins or curators
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'curator')
    )
  );

-- Service role and server actions can insert logs
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs" 
  ON public.audit_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- 3. CREATE DYNAMIC TELEGRAM CURATORS TABLE
CREATE TABLE IF NOT EXISTS public.telegram_curators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id bigint UNIQUE NOT NULL,
  name text NOT NULL,
  username text,
  role text NOT NULL DEFAULT 'curator',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  added_by text DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial curator from environment (Suyash)
INSERT INTO public.telegram_curators (telegram_user_id, name, username, role, is_active, notes)
VALUES (1728340363, 'Suyash Pandey (Primary)', 'Suyashp07', 'super_admin', true, 'Primary administrator')
ON CONFLICT (telegram_user_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.telegram_curators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active telegram curators" ON public.telegram_curators;
CREATE POLICY "Public read active telegram curators" 
  ON public.telegram_curators 
  FOR SELECT 
  TO public 
  USING (true);

DROP POLICY IF EXISTS "Admins can manage telegram curators" ON public.telegram_curators;
CREATE POLICY "Admins can manage telegram curators" 
  ON public.telegram_curators 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'curator')
    )
  );

-- 4. EVENTS RLS WRITE POLICY FOR CURATORS
DROP POLICY IF EXISTS "Admins and Curators have full write on events" ON public.events;
CREATE POLICY "Admins and Curators have full write on events"
  ON public.events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('super_admin', 'curator')
    )
  );
