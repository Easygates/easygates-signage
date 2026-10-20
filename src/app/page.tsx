import Link from "next/link";
import { DEMO_SCENES, TEMPLATES, TRADE_DEMO_SCENES } from "@/lib/signage";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#05070f] text-white">
      {/* nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-xl font-black text-white shadow-lg">N</span>
          <div>
            <div className="font-black tracking-[0.2em]">NOVASIGN</div>
            <div className="text-[11px] tracking-widest text-white/50">ELECTRICAL · SMART HOME · GATE AUTOMATION</div>
          </div>
        </div>
        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link href="/display" className="rounded-full bg-white px-5 py-2.5 text-black hover:bg-white/85">▶ Live Display</Link>
          <Link href="/admin" className="rounded-full bg-white/10 px-5 py-2.5 ring-1 ring-white/20 hover:bg-white/20">CMS Admin</Link>
          <Link href="/docs" className="hidden rounded-full px-4 py-2.5 text-white/70 hover:text-white sm:block">Docs & Deploy</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 20% 20%, #ff3b3044, transparent 60%), radial-gradient(50% 50% at 85% 30%, #4c1d95aa, transparent 60%), linear-gradient(135deg,#070b18,#1b2450)" }} />
        <div className="absolute -right-20 top-10 h-96 w-96 rounded-full bg-red-500/20 blur-3xl" style={{ animation: "sg-blob 9s ease-in-out infinite" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.25em] ring-1 ring-white/20">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" /> 8-SCENE DEMO · 7 TEMPLATES · RUNNING NOW
            </div>
            <h1 className="sg-display mt-5 text-[clamp(2.8rem,6.5vw,5.2rem)]">
              Broadcast-grade signage for the <span className="text-red-500">original Steam&nbsp;Link.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              A McDonald&apos;s-grade menu-board engine: staged animation timelines, price-pop choreography, tickers, playlists, schedules and multi-display control — with the CMS on your laptop and the player on any HDMI screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/display" className="rounded-2xl bg-red-500 px-8 py-4 text-lg font-black shadow-[0_20px_50px_rgba(255,59,48,0.4)] hover:bg-red-400">▶ Launch Display</Link>
              <Link href="/admin" className="rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold ring-1 ring-white/20 hover:bg-white/20">Open CMS</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold tracking-widest text-white/60">
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">1080p60 HDMI</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">~256 MB RAM SAFE</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">REDUCED-MOTION</span>
              <span className="rounded-full bg-white/5 px-3 py-1 ring-1 ring-white/10">OFFLINE-SAFE DEMO</span>
            </div>
          </div>
          {/* live strip preview */}
          <div className="space-y-3">
            <div className="overflow-hidden rounded-3xl ring-1 ring-white/20 shadow-2xl">
              <div className="flex items-center justify-between bg-black/60 px-4 py-2 text-xs font-bold tracking-widest">
                <span>WINTER SALE EVENT · PREVIEW</span><span className="text-red-400">● ON AIR</span>
              </div>
              <div className="grid grid-cols-2 gap-0">
                {DEMO_SCENES.slice(0, 4).map((s) => (
                  <div key={s.id} className="relative h-36 overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.imageUrl && <img src={s.imageUrl} alt="" className="h-full w-full object-cover" />}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${s.bgFrom}dd, transparent 70%)` }} />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-[10px] font-bold tracking-widest" style={{ color: s.accentColor }}>{s.eyebrow?.slice(0, 28)}</div>
                      <div className="truncate text-sm font-black">{s.productName || s.headline}</div>
                    </div>
                    {s.promoPrice && <span className="absolute right-2 top-2 rounded-lg px-2 py-0.5 text-xs font-black text-white" style={{ background: s.accentColor }}>{s.promoPrice}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[["7", "templates"], ["8", "demo scenes"], ["60fps", "target HDMI"]].map(([a, b]) => (
                <div key={b} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-2xl font-black">{a}</div>
                  <div className="text-[11px] tracking-widest text-white/50">{b.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* templates */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-3xl font-black tracking-tight">{TEMPLATES.length} coordinated templates.</h2>
        <p className="mt-2 max-w-3xl text-white/60">
          Not one slideshow theme — {TEMPLATES.length} art-directed layouts, each with its own staged timeline. Built for shops and
          showrooms, then extended for the trade: service lists, rate cards, brand walls, spec sheets and emergency call-outs.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => {
            const demo = [...DEMO_SCENES, ...TRADE_DEMO_SCENES].find((s) => s.template === t.id);
            return (
              <Link key={t.id} href="/admin" className="group overflow-hidden rounded-3xl bg-white/[0.05] ring-1 ring-white/10 hover:ring-white/30">
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {demo?.imageUrl && <img src={demo.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${demo?.bgFrom || "#000"} 100%)` }} />
                  <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-black tracking-widest backdrop-blur">0{i + 1}</span>
                </div>
                <div className="p-5">
                  <div className="font-black">{t.name}</div>
                  <div className="mt-1 text-sm text-white/60">{t.blurb}</div>
                  <div className="mt-2 text-[11px] font-bold tracking-widest text-white/40">BEST FOR · {t.bestFor.toUpperCase()}</div>
                </div>
              </Link>
            );
          })}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
            <div className="text-sm font-bold tracking-widest opacity-80">PLAYER HARDWARE</div>
            <div className="mt-2 text-xl font-black leading-snug">One small PC or Raspberry Pi per TV.</div>
            <div className="mt-2 text-sm opacity-90">The CMS runs on your computer; each screen opens its own kiosk URL and picks up edits within 30 seconds. The Steam Link is a dead end — see the hardware guide.</div>
            <Link href="/docs" className="mt-4 inline-block rounded-xl bg-black/70 px-5 py-2.5 text-sm font-black">READ THE GUIDE →</Link>
          </div>
        </div>
      </section>

      {/* sequence */}
      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-3xl font-black">The 8-beat promotional choreography.</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-4">
            {["Background animates in", "Product image zooms to position", "Product name reveals", "Was-price draws, promo price pops", "Discount badge springs in", "Support copy + CTA cascade", "Hold for reading", "Elegant transition out"].map((s, i) => (
              <li key={s} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
                <div className="text-2xl font-black text-red-500">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 text-sm font-bold">{s}</div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/display" className="rounded-2xl bg-white px-7 py-3.5 font-black text-black">Watch it play →</Link>
            <Link href="/admin" className="rounded-2xl bg-white/10 px-7 py-3.5 font-bold ring-1 ring-white/20">Remix it in the CMS</Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs tracking-widest text-white/40">
        <span>NOVASIGN · FICTIONAL DEMO BRAND “NOVA MART” · ALL PRICES FICTIONAL</span>
        <span className="flex gap-4"><Link href="/api/selftest" className="hover:text-white">SELF-TEST</Link><Link href="/docs" className="hover:text-white">DOCS</Link><Link href="/display" className="hover:text-white">DISPLAY</Link></span>
      </footer>
    </main>
  );
}
