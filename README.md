# NovaSign — Professional Animated Signage for the Original Steam Link

Signage player + CMS for shops and trade showrooms: electrical, smart home and gate automation. 12 art-directed templates (7 retail + 5 trade), a deterministic animation engine, playlists, schedules and multi-display control. Runs on a PC and drives any number of TVs in kiosk mode.

Two fictional demo campaigns, both loadable from `/admin`:

- **NOVA MART · Winter Sale Event** — 8 retail scenes, covering all 7 retail templates.
- **APEX · Electrical, Smart Home & Gates** — 6 trade scenes (gate automation kit, service offer, trade price list, brand wall, smart panel spec sheet, 24/7 call-out) plus 5 pre-registered screens.

## Quick start (Local PostgreSQL or Supabase)

```bash
npm install
npx drizzle-kit push        # creates the 6 tables via DIRECT_URL or DATABASE_URL
npm run build
npm start                   # → http://localhost:3000
```

## Configuring `DATABASE_URL` in `.env` for Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project → click **Connect** (top bar) → **Connection String / ORMs**.
2. Copy the **Supavisor Pooler** URI strings (works over IPv4 & IPv6 without requiring the paid IPv4 add-on):
   - **Transaction Pooler (`:6543`)** → `DATABASE_URL` (used at runtime by Next.js / `src/db/index.ts`)
   - **Session Pooler (`:5432`)** → `DIRECT_URL` (used automatically by `drizzle.config.ts` during `npx drizzle-kit push`)
3. URL-encode any special characters in `[YOUR-PASSWORD]` (`@` → `%40`, `#` → `%23`, `%` → `%25`, `?` → `%3F`), or use the interactive **Supabase `.env` Builder** at `/admin?tab=database`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Optional — route /api/upload directly to a public Supabase Storage bucket:
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SECRET_KEY="sb_secret_..."   # Settings → API Keys; server-only, never NEXT_PUBLIC_
SUPABASE_STORAGE_BUCKET="signage-media"
```

   A full template lives in [`.env.example`](.env.example). The legacy `SUPABASE_SERVICE_ROLE_KEY` (JWT) is still read as a fallback, but Supabase retires those keys at the end of 2026.

4. **Create tables on Supabase** (pick either method):
   - **Dashboard (recommended):** paste [`supabase/schema.sql`](supabase/schema.sql) into **Supabase Dashboard → SQL Editor → Run**. It creates the tables, enables Row Level Security and creates the public `signage-media` Storage bucket. Safe to re-run.
   - **CLI (Drizzle):** `npx drizzle-kit push` — creates the tables with RLS enabled; create the bucket yourself (Dashboard → Storage → New bucket, public).

   > **Why RLS with no policies?** Supabase exposes `public` tables through its Data API to anyone holding the project's publishable/anon key. NovaSign never uses that API — it connects to Postgres directly as the table owner, which bypasses RLS — so enabling RLS without policies closes the API off (including the Fully Kiosk passwords in `displays.settings`) without affecting the app. `/admin?tab=database` warns if any table still has RLS off.

5. Start the server and seed a demo campaign via **✨ Retail demo** / **⚡ Trade demo** in `/admin`, or `curl -X POST 'http://localhost:3000/api/seed?campaign=trade'` (`campaign=retail` is the default).

> **Built-in `pg@8.20` + Supabase TLS handling:** `src/db/index.ts` and `drizzle.config.ts` automatically normalize Supabase connection URLs (`uselibpqcompat=true&sslmode=require`, `ssl: { rejectUnauthorized: false }`, and stripping Prisma's `?pgbouncer=true`) so Supavisor pooler connections never fail with certificate chain errors.

## Routes

| Route | Purpose |
|---|---|
| `/` | Product overview |
| `/display` | Fullscreen player (append `?playlistId=…` or `?displayId=…`, optional `&poll=10`) |
| `/admin` | CMS — scenes, playlists, assets, displays, schedules, timeline |
| `/admin?tab=database` | Live DB diagnostics + interactive Supabase `.env` builder + SQL export |
| `/docs` | Hardware research + Supabase & Steam Link deploy guide |
| `/api/db-status` | Live DB health, latency, pooler mode & table row counts |
| `/api/selftest` | Automated checks (JSON) |
| `/api/player?displayId=…` | What a screen should play right now (`&poll=` is a player-side refresh hint) |
| `/api/displays/:id/control` | Proxy to Fully Kiosk Remote Admin — reload / wake / restart / screenshot (POST action, GET screenshot) |

## Tests & validation

```bash
node --test "tests/*.mjs"
curl -s localhost:3000/api/selftest | jq .
npx next typegen && npm exec tsc -- --noEmit && npm run build
```

## Choosing player hardware

The Steam Link is a 2015 device and is no longer a sensible target. See **[HARDWARE.md](HARDWARE.md)** for the 2026 recommendation (Raspberry Pi kiosk, Android box + Fully Kiosk, HDMI splitter for identical content), UK pricing, and a one-command Pi installer in [`deploy/pi-kiosk.sh`](deploy/pi-kiosk.sh).

## Steam Link reality (researched)

Marvell DE3005-A1 (ARMADA 1500 Mini), single-core ARMv7 Cortex-A9 @ 1 GHz + NEON · Vivante GC1000 (OpenGL ES 2.0) · ~512 MB RAM (≈256 MB usable by apps) · 4 GB NAND (≈500 MB–1 GB for apps) · HDMI 1080p60 with H.264 decode · 100 MbE + 802.11ac · custom Valve Linux · `ValveSoftware/steamlink-sdk` (SDL 2.0, Qt 5.4, GLES2).

**Strategy:** CMS runs on a capable PC/NAS or cloud host backed by PostgreSQL / Supabase. Each screen (Link or substitute) is a stateless renderer that polls `GET /api/player`.
