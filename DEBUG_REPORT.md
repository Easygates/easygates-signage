# Debug & Test Report — Easygates Signage
**Branch:** `arena/5155fdcc-easygates-signage` (from `ebe8585`)  
**Date:** 2026-10-22  
**Environment:** Node 22, Next.js 16.2.6 (Turbopack), PostgreSQL via `pg@8.20` + `drizzle-orm`

---

## 1. Test Matrix

| Check | Command | Before | After |
|-------|---------|--------|-------|
| **Unit tests** | `node --test tests/*.mjs` | 88 pass, 0 fail | **88 pass, 0 fail** ✅ |
| **Lint** | `npm run lint` | 4 warnings, `eslint: not found` without install | **0 errors, 0 warnings** ✅ |
| **Typecheck** | `npm run typecheck` / `tsc --noEmit` | pass | **pass** ✅ |
| **Build** | `npm run build` (no `.env`) | **FAIL** — `DATABASE_URL is required` during `Collecting page data` | **pass** ✅ — 7.1s, all routes dynamic |

`npm install` was required first (402 packages). Vulnerabilities: 12 (4 moderate, 7 high, 1 critical via `sharp`/`postcss` — upstream, not fixable without major bump).

---

## 2. Problems Found & Fixed

### 🔴 P0 — Build crashes without `DATABASE_URL` (blocker)
**Symptom**
```
Creating an optimized production build ...
Error: DATABASE_URL is required. Set it in .env
  at src/db/index.ts:resolveDbConfig
> Build error occurred
Error: Failed to collect page data for /api/assets
```
Next.js imports every API route at build time even with `export const dynamic = "force-dynamic"`. The top-level `export const dbInfo = resolveDbConfig()` throws when `DATABASE_URL` is unset, so CI / Vercel builds without env fail.

**Root cause:** Throw at import time, no build-time guard.

**Fix**
- `src/db/index.ts` — `resolveDbConfig()` now returns a safe localhost placeholder when `process.env.NEXT_PHASE === "phase-production-build"` (or `SKIP_DB_CHECK=1`), so the build can collect pages. At runtime (no `NEXT_PHASE`) it still throws if the var is truly missing, so mis-configuration is still caught.
- `drizzle.config.ts` — same pattern: use placeholder URL + warning when `raw` is empty, unless it's a build. Prevents `drizzle-kit` import from crashing the build.

**Verification:** `npm run build` with no `DATABASE_URL` now succeeds, emits all 19 API routes + pages.

---

### 🔴 P1 — Render-phase `setState` in display player (React anti-pattern)
**File:** `src/app/display/page.tsx:90`
```ts
if (index >= scenes.length) setIndex(0); // during render!
```
Triggers React warning *“Cannot update a component from inside the function body”* and can cause cascading renders/infinite loop when CMS playlist shrinks.

**Fix:** Derive a clamped index instead of mutating state mid-render:
```ts
const safeIndex = scenes.length === 0 ? 0 : Math.min(index, scenes.length - 1);
// … use safeIndex everywhere (render, preload, auto-advance, navigation)
// navigation helpers derive next from safeIndex, not stale functional updater
const go = useCallback((dir) => {
  const next = (safeIndex + dir + len) % len; // closure, not (i) => …
  setIndex(next);
}, [safeIndex, len, reduced]);
```
No `useEffect` with `setState` needed; lint rule `react-hooks/set-state-in-effect` passes.

---

### 🟠 P1 — Missing error handling in write APIs (DoS / stack leak)
**Files:** `src/app/api/assets`, `displays`, `playlists`, `playlist-items`, `schedules`, `scenes`, `seed`, `scenes/[id]`, `playlists/[id]`, `displays/[id]`
- `GET` handlers wrapped in `try/catch → { error: "db-unavailable" }`.
- `POST/PUT/DELETE` handlers had **no** catch — DB outage leaks stack trace as unhandled 500.
- `seed` performs ~20 DB writes with no catch at all.

**Fix:** Wrap every write handler in `try { … } catch { return 503 }` returning `{ error: "db-unavailable" }`. Consistent with read handlers; screens keep playing on 503.

**Extra:** `src/app/api/scenes/route.ts` now validates `template` against `TEMPLATES` id set, returning 400 for unknown templates (prevents persisting corrupt scenes that crash `SceneRenderer`).

**Extra:** `src/app/api/upload/route.ts` outer `formData()` parsing now wrapped; malformed multipart returns 400 instead of 500.

---

### 🟠 P1 — Input validation: playlist-items missing required fields
**File:** `src/app/api/playlist-items/route.ts`  
`POST` accepted empty `playlistId`/`sceneId`, creating orphan rows. **Fix:** return 400 unless both present.

---

### 🟡 P2 — Lint: `<img>` vs `<Image>` warnings + unused disable
**Files:** `src/components/BusinessPanel.tsx`, `src/components/scene/parts.tsx`
- BusinessPanel renders 4 `<img>` tags for arbitrary user upload URLs (any domain) — `next/image` would need dynamic allowlist, so `<img>` is intentional.
- `parts.tsx` had per-line `eslint-disable` placed on `return (` line, not on `<img>`, appearing “unused” + still warning.

**Fix:** Add file-level `/* eslint-disable @next/next/no-img-element -- reason */` with justification, remove misplaced per-line disables. `npm run lint` now 0 warnings.

---

### 🟡 P2 — XSS via unescaped `url("…")` interpolation
**File:** `src/components/SceneRenderer.tsx`  
`backgroundImage: \`url("${scene.bgImageUrl}")\`` breaks out if URL contains `"` or `)`. Low risk (only admin can set), but fixed.

**Fix:** Added `cssUrl()` helper that escapes `"` and `\` before interpolation: `` `url("${cssUrl(scene.bgImageUrl!)}")` ``.

---

### 🟡 P2 — `next.config.ts` missing Supabase remote pattern
**Before:** only `images.pexels.com`, `images.unsplash.com`.  
Supabase Storage URLs (`*.supabase.co`) would fail if ever passed to `<Image>`.  
**Fix:** Added `{ hostname: "*.supabase.co" }` and `{ hostname: "*.supabase.com" }` to `remotePatterns`.

---

### 🟡 P2 — `drizzle.config.ts` crash path
Same build-safety fix as `src/db/index.ts` (placeholder + warning).

---

### ℹ️ Noted but not changed (informational)

| Item | Why left as-is |
|------|----------------|
| **Middleware deprecation** — `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` | Keeping `src/middleware.ts`; renaming to `proxy.ts` would break on older Next. Warning is cosmetic and build still succeeds. Attempting both files causes hard error. |
| **Vulnerabilities in `sharp`/`postcss`** (12 via `next`) | Upstream; `npm audit fix` would pin `next@16.4.2` (SemVer major) — deferred to separate dep-bump PR. |
| **Playlist reorder not transactional** (`playlist-items` PUT loops sequential updates) | Low concurrency; true fix needs `db.transaction`. Documented for future. |
| **Tests mirror timeline logic instead of importing it** (`animation.test.mjs`) | Tests pass but won't catch drift between test copy and real `src/lib/signage.ts`. Recommend importing real `buildTimeline` when DB-free test setup allows. |
| **`eslint-config-next/core-web-vitals` on ESLint 9.39** | Deprecated in ESLint 9 flat config but still functional; migration to `eslint@10` is separate. |

---

## 3. Manual Smoke Tests

- `npm install` → 402 packages, 12 vulns (expected).
- `npm run lint` → 0 errors.
- `npx tsc --noEmit` → no errors.
- `node --test tests/*.mjs` → 88/88.
- `npm run build` with empty env → success, 19 dynamic routes listed, no DB required.
- `npm run build` with dummy `DATABASE_URL=postgresql://…@localhost:5432/app_db` → same success (placeholder not needed, real URL used).
- Visual check: `src/app/display/page.tsx` preload and auto-advance use `safeIndex`, no render-phase setState.

---

## 4. Changed Files Summary

```
18 files | +324 −217

drizzle.config.ts                   — build-safe placeholder
next.config.ts                      — add Supabase remotePatterns
src/db/index.ts                     — build-safe resolveDbConfig
src/app/api/*                       — add try/catch + validation (10 routes)
src/app/display/page.tsx            — clamp safeIndex, remove render-phase setState
src/components/BusinessPanel.tsx    — fix lint disables
src/components/SceneRenderer.tsx    — cssUrl escape
src/components/scene/parts.tsx      — file-level eslint disable
```

All changes are backward-compatible; no schema, API contract, or template behaviour changed except adding safety guards.

---

## 5. How to Verify Locally

```bash
npm install
npm run lint        # expect: no output
npm run typecheck   # expect: no errors
node --test tests/*.mjs  # expect: 88 pass
npm run build       # expect: ✓ Compiled successfully, ✓ Generating static pages
# with DB:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db npm run build
npm start           # → http://localhost:3000, seed via /admin → ✨ Retail demo
```

## 6. Re-verification - arena/c5ccc534-easygates-signage @ d6d53db (2026-10-22)

Re-checked the previous agent's debugging (PR #8 / arena/5155fdcc) on this branch. Every claim in sections 2-4 was confirmed against the actual tree, and the full verification matrix passes again:

| Check | Command | Result |
|-------|---------|--------|
| Unit tests | node --test tests/*.mjs | 88 pass, 0 fail OK |
| Lint | npm run lint | 0 errors, 0 warnings OK |
| Typecheck | npm run typecheck | pass OK |
| Build (no DATABASE_URL) | npm run build | success, all routes dynamic OK |

Spot checks:
- src/db/index.ts - placeholder DB config during NEXT_PHASE build phase; still throws at runtime if DATABASE_URL missing. OK
- drizzle.config.ts - placeholder URL + warning, no build crash. OK
- src/app/display/page.tsx - no render-phase setState; safeIndex derived from scenes, used for render/preload/auto-advance/navigation. OK
- API routes - try/catch -> 503 { error: "db-unavailable" } on all GET and write handlers, incl. seed. OK
- src/app/api/scenes/route.ts - template validated against TEMPLATES id set (400 on unknown). OK
- src/app/api/playlist-items/route.ts - 400 unless playlistId and sceneId present. OK
- src/components/SceneRenderer.tsx - cssUrl() escapes " and \ in url("..."). OK
- src/components/BusinessPanel.tsx, src/components/scene/parts.tsx - file-level eslint-disable with justification; misplaced per-line disables removed. OK
- next.config.ts - *.supabase.co / *.supabase.com added to remotePatterns. OK

No regressions found; nothing needed fixing. The previous agent's debugging was done correctly and is fully backward-compatible.

## 7. Follow-up fixes — arena/c5ccc534-easygates-signage @ fa6898e (2026-10-22)

Two issues reported after the original debug pass:

### 🟡 P2 — Seasonal images not showing in assets or quick pick
**Root cause:** `/api/assets` only returns DB rows. The 12 images in `public/seasonal/` (plus `public/retail/`, `public/trade/`) were never registered in the assets table, so they were absent from the AssetsPanel library and LibraryPicker quick-set.

**Fix:** Added `src/app/api/public-assets/route.ts` — a GET endpoint that scans `public/seasonal/`, `public/retail/`, `public/trade/`, `public/uploads/` for image files and returns them as read-only assets. The admin page merges DB assets + public assets into `allAssets` and feeds them to LibraryPicker, AssetsPanel and BusinessPanel. Seasonal images now appear in the library and quick-set pickers without requiring a DB entry.

### 🟡 P2 — No quick-set library picker for row-level "img URL"
**Root cause:** `ItemsEditor` (scene editor rows for product-grid, brand-wall, deals-grid, top-sellers, clearance, multibuy) rendered the per-row image URL as a plain text input with no library picker — unlike scene-level `imageUrl`/`bgImageUrl` which had LibraryPicker quick-set.

**Fix:** `ItemsEditor` now accepts an `assets` prop and shows a 📂 "pick from library" button next to each row's image input, plus an inline LibraryPicker that applies the chosen URL to that row. A "quick-set any row" picker is also available at the bottom.

**Verification:** typecheck ✅, lint ✅, build ✅ (new `/api/public-assets` route included), 88/88 unit tests ✅.

## 8. New templates — arena/c5ccc534-easygates-signage @ 34df5b6 (2026-10-22)

Added 5 corporate templates + 1 background-only template to the scene editor:

| Template | Purpose | Key fields |
|----------|---------|------------|
| `company-values` | Mission statement + values list | headline, subheadline, items (name+desc), imageUrl |
| `team-intro` | Meet the team photo grid | headline, subheadline, items (image+name+desc), ctaText |
| `corporate-milestone` | Milestone / anniversary | headline (big number), subheadline, description, imageUrl, ctaText |
| `corporate-news` | Company news / announcement | eyebrow, headline, description, tickerText, imageUrl, ctaText |
| `testimonial-quote` | Testimonial / customer quote | headline (quote), description, productName (attribution), ctaText (role), imageUrl (photo), items |
| `fullscreen-bg` | Full-screen image or video, no logo | bgImageUrl or videoUrl (+ imageUrl fallback), headline/subheadline/eyebrow/ctaText optional overlay |

All registered in `TemplateId`, `TEMPLATES`, `TEMPLATE_CATEGORIES` (new "Corporate" group), `ITEM_TEMPLATES` (company-values, team-intro, testimonial-quote) and rendered in `SceneRenderer.tsx`. The `fullscreen-bg` template supports `videoUrl` (autoplay muted loop) or `bgImageUrl`/`imageUrl` with Ken Burns, plus an optional darkened overlay and centered text — no logo is ever rendered.

Verification: typecheck ✅, lint ✅, build ✅, 88/88 unit tests ✅.

## 9. Trustpilot Review template — arena/c5ccc534-easygates-signage

Added `trustpilot-review` template ("Social proof" category) for showing the
company's Trustpilot rating, star breakdown and top 5-star reviews on signage.
Source profile: https://uk.trustpilot.com/review/easygates.co.uk

How it works: data is entered manually in the scene editor (reliable on TVs —
no internet dependency at display time, no fragile scraping; Trustpilot's
official API needs a Trustpilot business account + API key and can be wired in
later if live data is wanted).

Field mapping in the scene editor:
- `imageUrl` — Trustpilot logo (upload the logo asset or use library quick-set)
- `headline` — big rating number, e.g. "4.8"
- `subheadline` — e.g. "Excellent · based on 2,341 reviews"
- `description` — optional summary/blurb card
- `ctaText` — optional call to action, e.g. "Read our reviews on Trustpilot"
- `items` rows — name = reviewer name, desc = review text, tag = stars
  (e.g. "★★★★★", defaults to 5 stars), image = optional reviewer avatar

Registered in `TemplateId`, `TEMPLATES`, `TEMPLATE_CATEGORIES` ("Social proof"),
`ITEM_TEMPLATES`, and rendered in `SceneRenderer.tsx`.
Verification: typecheck ✅, lint ✅, build ✅, 88/88 unit tests ✅.

## 10. Asset deletion + ambient backgrounds — arena/c5ccc534-easygates-signage @ 27271e2 (2026-10-22)

### 10.1 Delete assets from the library
- Assets tab: every library card now has a 🗑 button. Clicking it opens a
  confirmation modal with a preview of the asset and the warning
  "⚠️ This will be permanently deleted and cannot be undone… any scenes using
  this image will lose it." — buttons: **Cancel** / **Delete permanently**.
- DB (uploaded/registered) assets → `DELETE /api/assets?id=…` deletes the row
  and best-effort removes the backing file: local `public/uploads/…` for
  `/api/uploads/…` / `/uploads/…` URLs, or the Supabase Storage object when
  Supabase storage is configured. External URLs only lose their library entry.
  Returns 404 (unknown id) / 503 (DB unavailable), same conventions as the
  existing routes.
- Bundled/public images → `DELETE /api/public-assets?url=/<dir>/<file>`
  removes the file from disk. Path safety: directory allowlist
  (seasonal/retail/trade/ambient/uploads) + image-extension allowlist +
  resolved-path containment check; anything else → 400, missing file → 404.
- After a successful delete the library reloads (DB + public scan), so the
  asset disappears from the Assets tab and all quick-set pickers.

### 10.2 Three ambient backgrounds
New folder `public/ambient/` (added to the `/api/public-assets` scan, so they
appear in the library and quick-set pickers automatically):
- `ambient-aurora.jpg` — indigo/violet/teal aurora waves on near-black
- `ambient-amber-glow.jpg` — warm amber/copper glow on charcoal
- `ambient-teal-silk.jpg` — deep teal/midnight silk waves
All dark and text-friendly (~50–70 KB each, well within the Link's memory
budget). Ideal with the `fullscreen-bg` template or as any scene background.

### 10.3 Verification
- typecheck ✅ · lint ✅ (0 errors/warnings) · build ✅ · 88/88 unit tests ✅
- Runtime smoke test against a dev server: test image appeared in
  `/api/public-assets` → `DELETE` → 200 and file gone from disk → repeat
  `DELETE` → 404 → traversal attempt (`/../package.json`) → 400 → 3 ambient
  backgrounds listed. DB-asset delete could not be exercised in the sandbox
  (no `DATABASE_URL`; the whole `/api/assets` route errors at DB init in that
  state — pre-existing behaviour, identical for GET/POST).

---

## Branch summary for review — arena/c5ccc534-easygates-signage vs main

| Commit | Change |
|---|---|
| `0bac187` | docs: re-verification of previous debug work (§6) |
| `fa6898e` | fix: seasonal/public images appear in library + quick-set pickers; quick-set library picker for item-row "img URL" fields (§7) |
| `c8b6900` | docs note for the above |
| `34df5b6` | feat: 5 corporate templates (company-values, team-intro, corporate-milestone, corporate-news, testimonial-quote) + `fullscreen-bg` background image/video template with no logo (§8) |
| `6de7a4e` | docs note for the above |
| `894c1db` | feat: Trustpilot Review template — rating, star breakdown, top reviews (§9) |
| `27271e2` | feat: delete assets from library with permanent-delete warning + 3 ambient backgrounds (§10) |

Every step verified: `tsc --noEmit`, `eslint .`, `next build`, 88/88 tests.
Ready for review → merge into `main`.
