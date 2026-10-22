# NovaSign — Professional Animated Signage

Signage player + CMS for shops and trade showrooms: electrical, smart home and gate automation. 20 art-directed templates (7 retail + 7 value-store + 1 splash + 5 trade), a deterministic animation engine, playlists, schedules, seasonal themes and multi-display control. Runs on a PC and drives any number of TVs in kiosk mode.

Three fictional demo campaigns, all loadable from `/admin`:

- **NOVA MART · Winter Sale Event** — 8 retail scenes, covering all 7 retail templates.
- **APEX · Electrical, Smart Home & Gates** — 7 trade scenes (gate automation kit, service offer, trade price list, brand wall, smart panel spec sheet, 24/7 call-out, welcome splash with logo and contact details) plus 5 pre-registered screens.
- **Value Store · Seasonal Savings** — 12 value-retail scenes covering all 7 big-box value templates, with 4 seasonal themes (Christmas, Easter, Halloween, Spring, Summer).

## Templates

### Retail / value (big-box discount store look)

| Template | Best for |
|---|---|
| Price Drop | Single-hero discount promos — huge price, struck-through was-price, flag + burst |
| Deals Grid | Multi-item weekly offers — header banner, 6 deal tiles, ends-Sunday strip |
| Multi-Buy | Bundle & multipack promos — large offer lockup, 3 product images in a row |
| Clearance | End-of-line stock — red-and-yellow tag style, % off tags, stock counts |
| Aisle Guide | Store wayfinding — department name, giant aisle circle, arrow, sub-categories |
| Top Sellers | Bestseller charts — numbered top-5 list, rank numbers are the hero |
| Store Services | Customer information — click & collect, returns, opening hours, services desk |
| Splash / Welcome | Logo on a white plate, tagline and contact-detail cards — the logo follows Business settings |
| Retail Promotion | Hero deals & price drops (original) |
| Food Menu Board | QSR / café menu boards (original) |
| Product Showcase | Flagship launches (original) |
| Multi-Product Grid | Collections & bundles (original) |
| Announcement | Store news & events (original) |
| Full-Screen Campaign | Brand moments (original) |
| Split-Screen Promo | Dual-message promos (original) |

### Trade (electrical / smart home / gate automation)

| Template | Best for |
|---|---|
| Service & Installation | Gate automation & electrical services |
| Trade Price List | Upfront job pricing |
| Brands & Ecosystems | Smart home showrooms |
| Product Spec Sheet | Motors, kits & panels |
| Emergency Call-Out | 24/7 electricians & gate engineers |

## Seasonal themes

Any template can be dressed with a seasonal theme via the **Season / theme** picker in the scene editor:

- `christmas` — falling snow + red bunting
- `easter` — pastel eggs + flowers
- `halloween` — pumpkins + bats
- `spring` — blossom petals + branches
- `summer` — sun + waves
- `autumn` — falling leaves + acorns
- `winter` — frost corners + soft snow

Theme decorations always render; theme colours only override the slide's own palette when **"Use brand colours on every slide"** is on in `/admin?tab=business`. Decorations respect the reduced-motion toggle (`.sg-reduced`).

## Demo campaigns

Seed a campaign from `/admin` (**✨ Retail demo**, **⚡ Trade demo**, **💰 Value demo**) or via the API:

```bash
curl -X POST 'http://localhost:3000/api/seed?campaign=value'
curl -X POST 'http://localhost:3000/api/seed?campaign=retail'
curl -X POST 'http://localhost:3000/api/seed?campaign=trade'
```

The value campaign uses fictional products, a fictional store name ("Value Store"), and `{phone}` placeholders resolved from the Business tab settings. At least 4 slides use different seasonal themes.

## Images

Sample imagery for the value campaign lives in `public/retail/` and `public/seasonal/`. See [`public/retail/CREDITS.md`](public/retail/CREDITS.md) for sources and photographer attribution. All images are ≤ 1920 px wide and ≤ 300 KB.

## Quick start (Local PostgreSQL or Supabase)

```bash
npm install
npx drizzle-kit push        # creates the 7 tables via DIRECT_URL or DATABASE_URL
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

## Admin password (optional)

By default the admin (`/admin`) is open to anyone on your network, and shows an orange warning bar saying so. To require a login:

1. Open your `.env` file and add a line: `ADMIN_PASSWORD=choose-a-password`
2. Restart the app (stop it with Ctrl+C, then `npm start`).
3. Open `/admin`; it now sends you to a sign-in page.

Your shop screens (`/display`) never need the password, and the "screen is online" signal still works. Without the password you cannot edit slides, change settings, load demos or control the player boxes. If you use `curl` for the demo loaders, sign in first: `curl -c cookies.txt -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"password":"choose-a-password"}'`, then add `-b cookies.txt` to the other commands.

## Business settings (logo, phone, colours)

`/admin?tab=business` holds the details every screen shares: business name, logo, phone number, brand colours and a ticker. They're saved in the `settings` table and reach the screens on their next poll (≤ 30 s).

- Type `{phone}` or `{business}` in any slide text — headline, button, ticker, price-list rows — and the screen shows the saved value, so changing the number once updates every slide.
- **Use these colours on every slide** swaps each slide's own colours for the brand colours.
- The logo (top-left) and clock (top-right) can each be switched off.

Every slide is laid out on a fixed 1920×1080 canvas and scaled to fit the screen, so the admin preview, a 1080p TV and a 4K TV show the same composition. Non-16:9 screens get thin black bars.

## Routes

| Route | Purpose |
|---|---|
| `/` | Product overview |
| `/display` | Fullscreen player (append `?playlistId=…` or `?displayId=…`, optional `&poll=10`) |
| `/admin` | CMS — scenes, playlists, assets, displays, schedules, timeline |
| `/admin?tab=database` | Live DB diagnostics + interactive Supabase `.env` builder + SQL export |
| `/docs` | Hardware research, deploy guide and Supabase setup |
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

See **[HARDWARE.md](HARDWARE.md)** for the 2026 recommendation (Raspberry Pi kiosk, Android box + Fully Kiosk, HDMI splitter for identical content), UK pricing, and a one-command Pi installer in [`deploy/pi-kiosk.sh`](deploy/pi-kiosk.sh).

## Keeping the server address stable

Each screen opens `http://<pc-ip>:3000/display?displayId=…`. The PC's local IP address comes from your router and can change after a router restart or power cut, a long time switched off, or a change of network. When it does, every screen's saved address stops working until retyped (a screen that is already playing keeps its last playlist but gets no updates). To prevent it:

1. **Reserve the address in the router** (look for "DHCP reservation" / "address reservation") — free, about five minutes, best first step.
2. **Set a fixed address on the PC** in Windows network settings, outside the router's automatic range, only if the router can't reserve.
3. **Host the app online** (e.g. Vercel) — the address never changes and no PC has to stay on.
4. Using the PC's name (`http://MYPC:3000`) sometimes works, but many TV browsers and sticks can't resolve it.

Also turn off sleep on the PC while screens depend on it. The Displays tab fills in the server address automatically and shows each screen's full URL. The same guidance is in `/docs` (section 6).

## How it fits together

The CMS runs on a capable PC/NAS or cloud host backed by PostgreSQL / Supabase. Each screen is a stateless renderer that polls `GET /api/player`, and keeps its last good playlist if the server is unreachable.
