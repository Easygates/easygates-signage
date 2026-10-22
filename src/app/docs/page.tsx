import Link from "next/link";

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
          <p className="mt-3 text-white/65">Everything needed to run NovaSign: the CMS on your PC, five TVs on Fully Kiosk or a PC/Pi kiosk, and how to edit content and control every screen remotely.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[["/display", "▶ Player", "Fullscreen HDMI output"], ["/admin", "CMS Admin", "Edit, preview, publish"], ["/api/selftest", "Self-test", "Automated checks"]].map(([h, t, d]) => (
              <Link key={h} href={h} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10">
                <div className="font-black">{t}</div><div className="text-sm text-white/55">{d}</div>
              </Link>
            ))}
          </div>
        </section>

        <Doc title="1 · Rendering decision" body={
          <>
            <p><b>Player (this repo): HTML/CSS/JS at <code>/display</code>.</b> One DOM scene at a time, transform/opacity-only animation, pre-sized images (≤1920px), 30 s poll for CMS pushes. Runs in kiosk mode on a PC, a Raspberry Pi, or an Android TV box — anything with a modern browser.</p>
            <p className="mt-2"><b>On Android:</b> Fully Kiosk renders the same page inside the system WebView, so keep <b>Android System WebView</b> updated from the Play Store — a stale WebView is the usual cause of broken animations. The player uses only transform/opacity animations, so a 2020-era box is enough.</p>
          </>
        } />

        <Doc title="2 · Performance budget (low-power safe)" body={
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Max 1 scene in DOM; images pre-sized to 1920×1080, &lt; 400 KB each; preload only next scene.</li>
            <li>Animate <code>transform</code> + <code>opacity</code> only — no animated blur/backdrop, no video backgrounds on low-power players.</li>
            <li>Cap concurrent animated layers at ~8; Ken Burns is a single transform on one layer.</li>
            <li>Scene durations 6–20 s; transitions ≤ 700 ms; <code>cut</code> transition for lowest-end mode.</li>
            <li>Reduced-motion mode freezes Ken Burns/parallax/ticker and shows final states.</li>
            <li>Missing assets fall back to gradient + typography (never a broken frame); failed polls keep playing the cached playlist.</li>
          </ul>
        } />

        <Doc title="3 · Editing content remotely" body={
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Run this app on a PC/NAS: <code>npm install && npx drizzle-kit push && npm run build && npm start</code> (or Docker — see README).</li>
            <li>Find the PC&apos;s LAN IP (<code>ipconfig / ifconfig</code>), open <code>http://&lt;pc-ip&gt;:3000/admin</code> from a tablet/laptop. For editing from outside the shop, put the PC on <b>Tailscale</b> (free) and use its private <code>https://…ts.net</code> address — do not port-forward the CMS. Cloudflare Tunnel + Access is the alternative for a public URL.</li>
            <li><b>Scenes:</b> pick a template → edit copy/prices/colours → set animation preset + duration → live preview → Publish.</li>
            <li><b>Playlists:</b> add scenes, drag-order with ↑/↓, override per-item duration. Total runtime is shown. Click <b>Export MP4</b> to record one pass as silent 1080p H.264; use Chrome/Edge on <code>localhost</code> or HTTPS and select <b>This Tab</b> in the share picker.</li>
            <li><b>Displays:</b> register each TV → copy its <code>/display?displayId=…</code> URL → set it as the Start URL in Fully Kiosk (or a PC/Pi kiosk). Assign different playlists per screen.</li>
            <li><b>Schedules:</b> time windows (e.g. lunch menu 11:00–14:00) override a display&apos;s playlist by priority.</li>
            <li>Pushes land within 30 s (or 10 s with <code>&amp;poll=10</code> on the screen URL) — no reinstall, no SSH, no USB stick.</li>
          </ol>
        } />

        <Doc title="4 · Multi-display architecture" body={
          <>
            <p>CMS (Next.js + Postgres) is the single source of truth. Each display is stateless: it polls <code>/api/player</code>, which resolves <b>schedule override → display playlist → first playlist → offline demo</b>. Heartbeats (<code>PUT /api/displays/:id {"{heartbeat:true}"}</code>) drive the green ON-LINE dots in the CMS. Add a player behind each TV rather than re-broadcasting one screen — content is per display and managed centrally.</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-xs text-green-300 ring-1 ring-white/10">{`[ CMS on your PC :3000 ] ──LAN──▶ [ TV #1 · Fully @ :2323 ?displayId=A ] → "Showroom window"
                        ──LAN──▶ [ TV #2 · Fully @ :2322 ?displayId=B ] → "Gate display"
                        ──LAN──▶ [ TV #3 · Pi kiosk        ?displayId=C ] → schedule "Evenings"`}</pre>
          </>
        } />

        <Doc title="5 · Deploying the player (PC, Pi or Android box)" body={
          <ol className="list-decimal space-y-1.5 pl-5">
            <li><b>PC / mini PC:</b> dedicated standard Windows user, auto sign-in, Chrome <code>--kiosk &quot;http://&lt;cms&gt;:3000/display?displayId=…&quot;</code> in <code>shell:startup</code> inside a <code>start /wait</code> loop so it restarts if closed. Disable sleep, set Windows Update active hours, reboot nightly at 03:00. Full steps in <code>HARDWARE.md</code>.</li>
            <li><b>Raspberry Pi:</b> run <code>deploy/pi-kiosk.sh &quot;http://&lt;cms&gt;:3000/display?displayId=…&quot; --watchdog --nightly</code> — installs Chromium, autostarts it fullscreen, disables blanking.</li>
            <li><b>Android TV box (recommended):</b> Fully Kiosk Browser (1.61+) with the PLUS licence. Start URL <code>http://&lt;cms&gt;:3000/display?displayId=…&amp;poll=10</code>, launch on boot, keep screen on, kiosk PIN. Then enable <b>Remote Administration</b>, set a password and allow local network — paste the <code>http://&lt;box-ip&gt;:2323</code> address into <b>Admin → Displays → Player device</b> to get Reload / Wake / Restart / Screenshot buttons per screen. Note the Home button can still escape on consumer boxes without device-owner provisioning.</li>
            <li>Validate with <code>/api/selftest</code> + the CMS timeline inspector; run a 24 h soak (player RSS must stay flat).</li>
          </ol>
        } />

        <Doc title="5A · Controlling the players remotely (Fully Kiosk)" body={
          <>
            <p>Fully Kiosk&apos;s <b>Remote Administration</b> (a one-time PLUS licence, ~€8.90 per device) exposes a REST interface on <code>http://&lt;box-ip&gt;:2323</code>. The CMS proxies it so you get buttons per screen in <b>Admin → Displays → Player device</b> — no CORS, no password in the browser, LAN-only targets.</p>
            <div className="mt-3 overflow-x-auto rounded-2xl bg-black/40 ring-1 ring-white/10">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-widest text-white/40">
                  <tr><th className="px-4 py-2">Button</th><th className="px-4 py-2">Fully command</th><th className="px-4 py-2">Use it when</th></tr>
                </thead>
                <tbody className="text-white/75">
                  {[
                    ["Test", "deviceInfo", "check the box is online, battery, app version, current URL"],
                    ["Reload", "loadStartURL", "force a content refresh without waiting for the poll"],
                    ["Wake", "screenOn + loadStartURL", "the screen is black after a power cut"],
                    ["Screen on / off", "screenOn / screenOff", "open and close the shop"],
                    ["Restart", "restartApp", "the player is stuck or showing an old scene"],
                    ["Clear cache", "clearCache", "stale or half-rendered assets"],
                    ["Screenshot", "getScreenshot", "confirm what is actually on the wall"],
                  ].map(([a, b, c]) => (
                    <tr key={a} className="border-t border-white/10">
                      <td className="px-4 py-2 font-bold">{a}</td>
                      <td className="px-4 py-2 font-mono text-[11px] text-emerald-300">{b}</td>
                      <td className="px-4 py-2 text-white/60">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3">Setup on each box: Fully → Settings → <b>Remote Administration</b> → enable, set a password, allow from local network. Give every player a DHCP reservation, then paste <code>http://&lt;box-ip&gt;:2323</code> into its display card. Sanity check from your PC: <code>curl &quot;http://&lt;box-ip&gt;:2323/?cmd=deviceInfo&amp;type=json&amp;password=&lt;pass&gt;&quot;</code> should return JSON.</p>
            <p className="mt-2 text-white/60">Content changes still come from the CMS — the player polls every 10–30 s. The REST controls are for device recovery and power, not for publishing content.</p>
          </>
        } />

        <Doc title="5B · Connecting to Supabase PostgreSQL (.env)" body={
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
# SUPABASE_SECRET_KEY="sb_secret_..."   (Settings → API Keys — server-only)
# SUPABASE_STORAGE_BUCKET="signage-media"`}</pre>
            <p className="mt-3">Paste <code>supabase/schema.sql</code> into <b>Supabase Dashboard → SQL Editor → Run</b> (creates the 7 tables, enables Row Level Security and creates the <code>signage-media</code> bucket) <b>or</b> push the tables with <code>npx drizzle-kit push</code> (uses <code>DIRECT_URL</code> automatically via <code>drizzle.config.ts</code>; enables RLS but does not create the bucket). Then restart the app and click one of the demo packs (<b>✨ Retail</b>, <b>⚡ Trade</b>, <b>💰 Value</b>, <b>🏢 Corporate</b>, <b>🔧 Trade counter</b>). Each one creates its scenes, a playlist, screens and a schedule, then opens that playlist ready to press ▶ Play.</p>
            <p className="mt-2 text-white/60">RLS with no policies keeps the tables out of Supabase&apos;s public Data API — the app connects as the table owner and is unaffected. <code>/admin?tab=database</code> warns if any table still has RLS off.</p>
            <p className="mt-3"><b>Backups.</b> <Link href="/admin?tab=database" className="font-bold text-emerald-300 underline">Database / Supabase → Backup &amp; restore</Link> downloads every table as a restorable JSON file or a psql-ready <code>.sql</code> dump, and restores a JSON backup in <b>merge</b> (add missing rows) or <b>replace</b> (wipe then restore) mode. Media files live outside the database — also copy <code>public/uploads/</code> or the Supabase Storage bucket. Set <code>ADMIN_PASSWORD</code> before exposing the CMS: backup files contain the screen-control passwords, so keep them private.</p>
          </>
        } />

        <Doc title="6 · Keeping the server address stable" body={
          <>
            <p>Every screen opens an address like <code>http://192.168.0.178:3000/display?displayId=…</code>. The number is your PC&apos;s <b>local IP address</b>, handed out by your router. Restarting the app does not change it, but the router can give the PC a different one later. If it changes, every screen&apos;s saved address stops working until you retype it. A screen that is already playing keeps showing its last playlist, but it cannot pick up edits.</p>
            <p className="mt-3 font-bold text-white/85">When the address can change</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>The router restarts or loses power, and the PC asks for an address again.</li>
              <li>The PC is switched off for a few days and the router hands its address to another device.</li>
              <li>The PC reconnects to Wi-Fi, switches between Wi-Fi and a network cable, or the router or Wi-Fi settings change. A new router changes it for certain.</li>
              <li>A busy network with many phones and guest devices makes it more likely.</li>
            </ul>
            <p className="mt-3 font-bold text-white/85">How to stop it (cheapest first)</p>
            <ol className="mt-1 list-decimal space-y-1.5 pl-5">
              <li><b>Reserve the address in the router.</b> Log in to the router, find <i>DHCP reservation</i> or <i>address reservation</i>, and tie the PC&apos;s address to the PC. Free, about five minutes, and the best first step.</li>
              <li><b>Set a fixed address on the PC</b> in Windows network settings. Use it only if the router has no reservation option, and pick a number outside the router&apos;s automatic range so two devices never clash.</li>
              <li><b>Host the app online</b> (for example on Vercel). The address never changes and the screens don&apos;t depend on a PC being on. Best long-term choice for shop screens; the database is already online.</li>
              <li><b>Use the PC&apos;s name</b> (<code>http://MYPC:3000</code>) instead of the number. Many TV browsers and streaming sticks cannot look these up reliably, so don&apos;t depend on it.</li>
            </ol>
            <p className="mt-3 text-white/60">Also switch off sleep on the PC while screens depend on it. In <b>Admin → Displays</b> the server address box fills in automatically from the address you opened the admin on, so after a change you can copy the new URLs from there.</p>
          </>
        } />

        <Doc title="7 · Tests & verification" body={
          <>
            <p><code>GET /api/selftest</code> checks: every template in the catalogue is covered by a demo campaign, every timeline ordered with an exit step, durations in range, images present. Node tests live in <code>tests/</code> and run with <code>node --test</code>. Full gate before finishing:</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/50 p-4 font-mono text-xs text-green-300 ring-1 ring-white/10">{`npx next typegen && npm exec tsc -- --noEmit && npm run build\nnode --test tests/ && curl /api/selftest`}</pre>
          </>
        } />

        <Doc title="8 · Trade-offs" body={
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Web player on consumer Android boxes (cheap, remote-manageable, one codebase) over native players (fast to iterate, no SDK hardware loop).</li>
            <li>Deterministic CSS timelines over a JS animation library — smaller, predictable on weak CPUs, but fewer exotic effects.</li>
            <li>Polling (10–30 s) over websockets — simpler and firewall-proof on shop LANs, at the cost of a few seconds&apos; push latency. <code>&amp;poll=10</code> on the screen URL tightens it.</li>
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
