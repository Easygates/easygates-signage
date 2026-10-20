import Link from "next/link";
import { STEAM_LINK_PROFILE } from "@/lib/signage";

export const dynamic = "force-dynamic";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#070b16] text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-orange-400 font-black">N</span>
          <span className="font-black tracking-widest">NOVASIGN · DOCS</span>
        </Link>
        <nav className="flex gap-2 text-sm font-bold">
          <Link href="/display" className="rounded-full bg-white px-4 py-2 text-black">▶ Display</Link>
          <Link href="/admin" className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">CMS</Link>
        </nav>
      </header>

      <article className="prose-dark mx-auto max-w-5xl space-y-8 px-6 pb-20">
        <section className="rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/10">
          <h1 className="text-4xl font-black tracking-tight">Deployment & engineering guide</h1>
          <p className="mt-3 text-white/65">Everything needed to run NovaSign on the original Steam Link hardware, on a substitute player, and across many screens.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[["/display", "▶ Player", "Fullscreen HDMI output"], ["/admin", "CMS Admin", "Edit, preview, publish"], ["/api/selftest", "Self-test", "Automated checks"]].map(([h, t, d]) => (
              <Link key={h} href={h} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10">
                <div className="font-black">{t}</div><div className="text-sm text-white/55">{d}</div>
              </Link>
            ))}
          </div>
        </section>

        <Doc title="1 · Steam Link hardware — what we found" body={
          <>
            <SpecTable rows={[
              ["Device", STEAM_LINK_PROFILE.device],
              ["SoC / CPU", STEAM_LINK_PROFILE.soc],
              ["GPU", STEAM_LINK_PROFILE.gpu],
              ["RAM", STEAM_LINK_PROFILE.ram],
              ["Storage", STEAM_LINK_PROFILE.storage],
              ["Video", STEAM_LINK_PROFILE.video],
              ["Network", STEAM_LINK_PROFILE.network],
              ["OS", STEAM_LINK_PROFILE.os],
              ["SDK", STEAM_LINK_PROFILE.sdk],
            ]} />
            <p className="mt-3">Sources: Valve steamlink-sdk README, Marvell/Valve announcement, iFixit & community teardowns, Wikipedia. Key constraint: a single 1 GHz ARMv7 core and roughly 256 MB of app-usable RAM — there is no evergreen Chromium, no heavy JS framework budget, and no guarantee of GPU-composited CSS on the stock firmware.</p>
          </>
        } />

        <Doc title="2 · Rendering decision" body={
          <>
            <p><b>Prototype (this repo): HTML/CSS/JS player</b> at <code>/display</code>. One DOM scene at a time, transform/opacity-only animation, pre-sized images (≤1920px), 30 s poll for CMS pushes. This runs today on any kiosk substitute: Raspberry Pi 3/4, Intel NUC, Android TV stick, or a laptop driving HDMI.</p>
            <p className="mt-2"><b>Native path (for the physical Link):</b> Valve&apos;s <code>steamlink-sdk</code> supports SDL 2.0 + OpenGL ES 2.0 + Qt 5.4. The production route is a small native client that (a) polls <code>GET /api/player?displayId=…</code>, (b) caches JPEG/PNG assets to flash, (c) renders the same 7 templates with SDL textures + GLES quads and the same timeline table. The CMS API is already decoupled, so the web player and the native client are interchangeable renderers.</p>
            <p className="mt-2 text-white/60">We did not assume a Linux desktop, hardware video decode for signage, or modern browser APIs on the Link itself.</p>
          </>
        } />

        <Doc title="3 · Performance budget (Link-safe)" body={
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Max 1 scene in DOM; images pre-sized to 1920×1080, &lt; 400 KB each; preload only next scene.</li>
            <li>Animate <code>transform</code> + <code>opacity</code> only — no blur/backdrop animation, no video backgrounds on the Link profile.</li>
            <li>Cap concurrent animated layers at ~8; Ken Burns is a single transform on one layer.</li>
            <li>Scene durations 6–20 s; transitions ≤ 700 ms; <code>cut</code> transition for lowest-end mode.</li>
            <li>Reduced-motion mode freezes Ken Burns/parallax/ticker and shows final states.</li>
            <li>Missing assets fall back to gradient + typography (never a broken frame); failed polls keep playing the cached playlist.</li>
          </ul>
        } />

        <Doc title="4 · CMS guide (from another device on the LAN)" body={
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Run this app on a PC/NAS: <code>npm install && npx drizzle-kit push && npm run build && npm start</code> (or Docker — see README).</li>
            <li>Find the PC&apos;s LAN IP (<code>ipconfig / ifconfig</code>), open <code>http://&lt;pc-ip&gt;:3000/admin</code> from a tablet/laptop.</li>
            <li><b>Scenes:</b> pick a template → edit copy/prices/colours → set animation preset + duration → live preview → Publish.</li>
            <li><b>Playlists:</b> add scenes, drag-order with ↑/↓, override per-item duration. Total runtime is shown.</li>
            <li><b>Displays:</b> register each TV → copy its <code>/display?displayId=…</code> URL → open fullscreen on the player. Assign different playlists per screen.</li>
            <li><b>Schedules:</b> time windows (e.g. lunch menu 11:00–14:00) override a display&apos;s playlist by priority.</li>
            <li>Pushes land within ~30 s — no reinstall, no SSH, no USB stick.</li>
          </ol>
        } />

        <Doc title="5 · Multi-display architecture" body={
          <>
            <p>CMS (Next.js + Postgres) is the single source of truth. Each display is stateless: it polls <code>/api/player</code>, which resolves <b>schedule override → display playlist → first playlist → offline demo</b>. Heartbeats (<code>PUT /api/displays/:id {"{heartbeat:true}"}</code>) drive the green ON-LINE dots in the CMS. Do not try to broadcast HDMI over Wi-Fi from one Link — one player per TV, all managed centrally.</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-xs text-green-300 ring-1 ring-white/10">{`[ CMS:3000 ] ──LAN──▶ [ Link/TV #1 ?displayId=A ] → playlist "Entrance"
           ──LAN──▶ [ Link/TV #2 ?displayId=B ] → playlist "Café menu"
           ──LAN──▶ [ Pi/TV #3  ?displayId=C ] → schedule "Evenings"`}</pre>
          </>
        } />

        <Doc title="6 · Deploying to the actual Steam Link" body={
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Install the Valve SDK toolchain (<code>github.com/ValveSoftware/steamlink-sdk</code>) on a Linux build host.</li>
            <li>Build the native renderer (SDL2/GLES sample in <code>native/</code> — see README) against the SDK rootfs; package per SDK docs.</li>
            <li>Point the app at <code>http://&lt;cms-ip&gt;:3000/api/player?displayId=&lt;id&gt;</code>; cache assets under the ~500 MB app partition.</li>
            <li>Validate with <code>/api/selftest</code> + the CMS timeline inspector; test 24 h soak for leaks (RSS must stay flat).</li>
            <li><b>Substitute test (no Link available):</b> Raspberry Pi 3B + Chromium <code>--kiosk http://&lt;cms&gt;:3000/display?displayId=…</code> at 1080p. The Pi 3B (1 GB RAM, VideoCore IV) is a fair or slightly generous stand-in for the Link — if it holds 30–60 fps there, the native Link build has headroom. Unverified on real Link silicon: exact GLES frame pacing, H.264 signage video, captive-portal Wi-Fi.</li>
          </ol>
        } />

        <Doc title="6B · Connecting to Supabase PostgreSQL (.env)" body={
          <>
            <p>NovaSign works out of the box with both local PostgreSQL and <b>Supabase Cloud PostgreSQL</b> (including automatic TLS + Supavisor pooler support for <code>pg@8.20</code>). You can also use the interactive builder in <Link href="/admin?tab=database" className="font-bold text-emerald-300 underline">/admin → Database / Supabase</Link>.</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              <li>In <b>Supabase Dashboard → Connect (top bar) → URI</b>, copy your <b>Supavisor Pooler</b> connection strings (works over standard IPv4 + IPv6 networks).</li>
              <li>URL-encode special characters in your database password (<code>@ → %40</code>, <code># → %23</code>, <code>? → %3F</code>) and update <code>.env</code>:</li>
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-xs text-emerald-300 ring-1 ring-white/10">{`DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Optional — store uploaded media in a public Supabase Storage bucket:
# SUPABASE_URL="https://[PROJECT-REF].supabase.co"
# SUPABASE_SERVICE_ROLE_KEY="eyJ..."
# SUPABASE_STORAGE_BUCKET="signage-media"`}</pre>
            <p className="mt-3">Push the 6 tables with <code>npx drizzle-kit push</code> (uses <code>DIRECT_URL</code> automatically via <code>drizzle.config.ts</code>) <b>or</b> paste <code>supabase/schema.sql</code> directly into <b>Supabase Dashboard → SQL Editor → Run</b>, then restart the app and click <b>✨ Load demo</b>.</p>
          </>
        } />

        <Doc title="7 · Tests & verification" body={
          <>
            <p><code>GET /api/selftest</code> checks: all 7 templates covered by the demo, every timeline ordered with an exit step, durations in range, images present. Node tests live in <code>tests/</code> and run with <code>node --test</code>. Full gate before finishing:</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-xs text-green-300 ring-1 ring-white/10">{`npx next typegen && npm exec tsc -- --noEmit && npm run build\nnode --test tests/ && curl /api/selftest`}</pre>
          </>
        } />

        <Doc title="8 · Trade-offs" body={
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Web prototype first (fast iteration, pixel-faithful preview) over native-first (slower, needs SDK hardware loop).</li>
            <li>Deterministic CSS timelines over a JS animation library — smaller, predictable on weak CPUs, but fewer exotic effects.</li>
            <li>Polling (30 s) over websockets — simpler, firewall-proof on retail LANs, at the cost of sub-minute push latency.</li>
            <li>Fictional “Nova Mart” content + Pexels photography so every asset is replaceable via the CMS.</li>
          </ul>
        } />
      </article>
    </main>
  );
}

function Doc({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/10">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-3 leading-relaxed text-white/70">{body}</div>
    </section>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      {rows.map(([k, v], i) => (
        <div key={k} className={`grid grid-cols-[160px_1fr] gap-3 px-4 py-2.5 text-sm ${i % 2 ? "bg-white/[0.03]" : "bg-white/[0.06]"}`}>
          <span className="font-black tracking-wide text-white/45">{k.toUpperCase()}</span>
          <span className="font-mono text-[13px]">{v}</span>
        </div>
      ))}
    </div>
  );
}
