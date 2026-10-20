-- ═══════════════════════════════════════════════════════════════════════════
-- NovaSign — Supabase SQL Schema Bootstrap (Alternative to `npx drizzle-kit push`)
-- Paste this into Supabase Dashboard → SQL Editor → New Query → Run
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

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON public.playlist_items (playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON public.schedules (enabled, priority DESC);
