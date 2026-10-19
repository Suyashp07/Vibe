-- =========================================================
-- MIGRATION: Add Extended Profile & Privacy Consent Fields
-- Target Table: public.profiles
-- Run this script in the Supabase Dashboard SQL Editor
-- =========================================================

-- 1. Add demographic and personal attributes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'Mumbai',
  ADD COLUMN IF NOT EXISTS gender text DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS age integer;

-- 2. Add DPDP Act 2023 compliance & privacy consent audit columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_profile_consent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_city_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dpdp_consent boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS dpdp_consent_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS dpdp_consent_version text DEFAULT 'DPDP-2023-V1.0';

-- 3. Helpful comment for schema documentation
COMMENT ON COLUMN public.profiles.city IS 'Primary home city for event recommendations';
COMMENT ON COLUMN public.profiles.gender IS 'Self-identified gender (male, female, other)';
COMMENT ON COLUMN public.profiles.dpdp_consent IS 'Digital Personal Data Protection Act (DPDP Act, 2023) consent audit trail';
