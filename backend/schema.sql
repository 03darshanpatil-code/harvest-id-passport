-- HarvestID — Supabase schema migration
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is safe to re-run: every statement is IF NOT EXISTS.

-- ---------------------------------------------------------------------------
-- 1. harvest — add the columns the app writes (passport, score, media, etc.)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.harvest
  ADD COLUMN IF NOT EXISTS variety TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS farm_name TEXT,
  ADD COLUMN IF NOT EXISTS gps TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS passport BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- ---------------------------------------------------------------------------
-- 2. activities — create the table if it doesn't exist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id BIGSERIAL PRIMARY KEY,
  crop_id BIGINT REFERENCES public.harvest(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'sowing',
  title TEXT NOT NULL DEFAULT 'Field activity',
  note TEXT NOT NULL DEFAULT '',
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  media TEXT NOT NULL DEFAULT 'text',
  ai_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
  ai_summary TEXT,
  confidence INTEGER,
  photo TEXT,
  audio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index so filtering activities by crop stays fast as data grows.
CREATE INDEX IF NOT EXISTS idx_activities_crop_id ON public.activities (crop_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security — allow the anon key (used by the backend) to read
--    and write. If you already have policies, keep them and skip these.
-- ---------------------------------------------------------------------------
ALTER TABLE public.harvest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_harvest" ON public.harvest;
CREATE POLICY "anon_all_harvest"
  ON public.harvest
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_activities" ON public.activities;
CREATE POLICY "anon_all_activities"
  ON public.activities
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
