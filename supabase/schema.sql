-- ═══════════════════════════════════════════════════════════════════════════
-- NovaSign — Supabase SQL Schema Bootstrap (Alternative to `npx drizzle-kit push`)
-- Paste this into Supabase Dashboard → SQL Editor → New Query → Run
-- Creates the 7 tables, enables RLS, and creates the "signage-media" bucket.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  mime text,
  size_bytes integer,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text NOT NULL DEFAULT 'retail-promo',
  eyebrow text,
  headline text,
  subheadline text,
  product_name text,
  description text,
  original_price text,
  promo_price text,
  discount_badge text,
  cta_text text,
  ticker_text text,
  image_url text,
  image_fit text DEFAULT 'cover',
  image_position text DEFAULT 'center',
  video_url text,
  bg_image_url text,
  theme text DEFAULT 'none',
  bg_from text DEFAULT '#0b1020',
  bg_to text DEFAULT '#1e2a5a',
  bg_angle integer DEFAULT 135,
  accent_color text DEFAULT '#ff3b30',
  text_color text DEFAULT '#ffffff',
  muted_color text DEFAULT '#c7cede',
  card_color text DEFAULT '#141b33',
  animation_preset text DEFAULT 'launch',
  duration_sec integer DEFAULT 10,
  transition text DEFAULT 'fade',
  stagger_ms integer DEFAULT 120,
  ken_burns text DEFAULT 'zoom-in',
  overlay_opacity integer DEFAULT 45,
  layout_variant text DEFAULT 'A',
  items jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  loop boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL,
  scene_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  duration_override integer,
  transition_override text
);

CREATE TABLE IF NOT EXISTS public.displays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  playlist_id uuid,
  resolution text DEFAULT '1920x1080',
  orientation text DEFAULT 'landscape',
  status text DEFAULT 'offline',
  last_seen timestamptz,
  pairing_code text,
  settings jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  playlist_id uuid NOT NULL,
  display_id uuid,
  days text DEFAULT '1,2,3,4,5,6,0',
  start_time text DEFAULT '09:00',
  end_time text DEFAULT '21:00',
  priority integer DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- App settings (key "brand" = business name, logo, phone, colours, ticker)
CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON public.playlist_items (playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON public.schedules (enabled, priority DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- Add columns that didn't exist in earlier schema versions. Safe to re-run on
-- existing projects (ADD COLUMN IF NOT EXISTS is a no-op when the column
-- already exists).
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS bg_image_url text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS theme text DEFAULT 'none';

-- ───────────────────────────────────────────────────────────────────────────
-- Lock the tables away from Supabase's public Data API (REST / GraphQL).
-- NovaSign talks to Postgres directly as the table owner, which bypasses RLS,
-- so no policies are needed. Without this, anyone holding the project's
-- publishable/anon key could read displays.settings (Fully Kiosk passwords)
-- and edit every scene. Safe to re-run; the REVOKE and bucket steps are
-- skipped on plain local PostgreSQL.
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.displays       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings       ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE
      public.assets, public.scenes, public.playlists,
      public.playlist_items, public.displays, public.schedules,
      public.settings
    FROM anon, authenticated;
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────────────
-- Public Storage bucket for /api/upload (SUPABASE_STORAGE_BUCKET, default
-- "signage-media"). Uploads use the server-side secret key; screens read files
-- via the public URL, so no storage.objects policies are needed. Limits mirror
-- the checks in src/app/api/upload/route.ts.
-- ───────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'signage-media', 'signage-media', true, 26214400,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
