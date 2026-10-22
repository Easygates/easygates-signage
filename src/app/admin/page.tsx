"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScreenView from "@/components/ScreenView";
import BusinessPanel from "@/components/BusinessPanel";
import DatabasePanel from "@/components/DatabasePanel";
import PlayerControls from "@/components/PlayerControls";
import { ScreenBasePanel, ScreenUrl, useScreenBase } from "@/components/ScreenAddress";
import { ANIMATION_PRESETS, DEMO_SCENES, ITEM_TEMPLATES, TEMPLATES, TEMPLATE_CATEGORIES, TRANSITIONS, templateCategory, buildTimeline, valueDemoPlaylist, type Scene, type TemplateId } from "@/lib/signage";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";

type Tab = "scenes" | "playlists" | "assets" | "displays" | "schedules" | "timeline" | "business" | "database";
const TABS: Tab[] = ["scenes", "playlists", "assets", "displays", "schedules", "timeline", "business", "database"];

const sameBrand = (a: BrandSettings, b: BrandSettings) => JSON.stringify(a) === JSON.stringify(b);

interface PlaylistFull {
  id: string; name: string; description?: string; loop?: boolean;
  items: { id: string; sceneId: string; position: number; durationOverride?: number | null; transitionOverride?: string | null }[];
  scenes: (Scene & { _itemId?: string; _durationOverride?: number | null; _transitionOverride?: string | null })[];
}

const emptyScene = (): Scene => ({
  id: "new", name: "Untitled scene", template: "retail-promo",
  eyebrow: "{business} · SPECIAL OFFER", headline: "BIG SUMMER DEAL.",
  productName: "Sample Product", description: "Describe the offer in one readable line.",
  originalPrice: "£99", promoPrice: "£59", discountBadge: "-40%",
  ctaText: "SHOP IN STORE TODAY", tickerText: "",
  imageUrl: DEMO_SCENES[0].imageUrl, imageFit: "cover", imagePosition: "center",
  bgFrom: "#0b1020", bgTo: "#2a3a8c", bgAngle: 135,
  accentColor: "#ff3b30", textColor: "#ffffff", mutedColor: "#c7cede", cardColor: "#141b33",
  animationPreset: "launch", durationSec: 10, transition: "fade", staggerMs: 120,
  kenBurns: "zoom-in", overlayOpacity: 40, layoutVariant: "A", items: null, theme: "none",
});

// Sample page loaded when a slide switches to one of these templates, so the
// preview shows the template as intended instead of the previous product content.
const TEMPLATE_STARTERS: Partial<Record<TemplateId, { fields: Partial<Scene>; flash: string }>> = {
  splash: {
    fields: {
      imageUrl: "",
      eyebrow: "WELCOME",
      headline: "{business}",
      subheadline: "",
      ctaText: "",
      items: [
        { name: "Call us", desc: "{phone}" },
        { name: "Opening hours", desc: "Mon–Fri 8am–5pm" },
        { name: "Find us", desc: "Add your address" },
      ],
    },
    flash: "Welcome starter loaded — the logo comes from the Business tab; edit the cards below",
  },
  "company-values": {
    fields: {
      eyebrow: "{business} · WHO WE ARE",
      headline: "WHAT WE STAND FOR",
      subheadline: "The principles behind everything we do.",
      description: "",
      imageUrl: "",
      ctaText: "",
      items: [
        { name: "Safety first", desc: "Every site, every job — no shortcuts." },
        { name: "Right first time", desc: "Specified, tested and signed off properly." },
        { name: "Keep it simple", desc: "Straight answers and clear quotes." },
        { name: "Proud people", desc: "Look after the team and the work speaks for itself." },
      ],
    },
    flash: "Company Values sample loaded — edit the values to make them yours",
  },
  "team-intro": {
    fields: {
      eyebrow: "{business} · THE PEOPLE",
      headline: "MEET THE TEAM",
      subheadline: "The people who keep the work moving.",
      description: "",
      imageUrl: "",
      ctaText: "WE'RE HIRING — ASK AT RECEPTION",
      items: [
        { name: "Alex M.", desc: "Head of Installation" },
        { name: "Jordan T.", desc: "Site Surveyor" },
        { name: "Sam K.", desc: "Electrician, First-Class" },
        { name: "Ria P.", desc: "Accounts & Planning" },
        { name: "Lee B.", desc: "Workshop Lead" },
        { name: "Dan O.", desc: "Aftercare & Call-outs" },
      ],
    },
    flash: "Meet the Team sample loaded — swap in your people and add photos per row",
  },
  "corporate-milestone": {
    fields: {
      eyebrow: "A MILESTONE",
      headline: "25",
      subheadline: "YEARS KEEPING BRITAIN MOVING",
      description: "From a two-van fitting business to one of the UK's leading gate and barrier specialists.",
      imageUrl: "",
      ctaText: "HERE'S TO THE NEXT 25",
      items: null,
    },
    flash: "Milestone sample loaded — put your number in the Headline",
  },
  "corporate-news": {
    fields: {
      eyebrow: "COMPANY NEWS",
      headline: "NEW SMART PANEL LINE THIS WINTER",
      subheadline: "",
      description: "App control, visitor codes and remote release for residential and light commercial sites — fitted by our own teams.",
      imageUrl: "",
      ctaText: "BOOK A SITE SURVEY",
      tickerText: "AVAILABLE FROM DECEMBER —",
      items: null,
    },
    flash: "Company News sample loaded — headline = the story, Ticker = the date",
  },
  "testimonial-quote": {
    fields: {
      eyebrow: "CUSTOMER STORY",
      headline: "Fitted in a day. Zero fuss. Brilliant team.",
      description: "“They turned up on time, kept the site clean and the gate works perfectly.”",
      productName: "M. Carter",
      imageUrl: "",
      ctaText: "Homeowner · Manchester",
      items: [
        { name: "J. O'Neill", desc: "“Clear quote, tidy install, great aftercare.”" },
        { name: "S. Patel", desc: "“The smart panel app is easier than our phone keys.”" },
      ],
    },
    flash: "Testimonial sample loaded — Headline is the big quote, rows add more",
  },
  "fullscreen-bg": {
    fields: {
      eyebrow: "",
      headline: "{business}",
      subheadline: "",
      description: "",
      ctaText: "",
      imageUrl: "",
      bgImageUrl: "/ambient/ambient-aurora.jpg",
      videoUrl: "",
      kenBurns: "zoom-in",
      items: null,
    },
    flash: "Background sample loaded — swap the background via Quick-set or Image URL",
  },
  "trustpilot-review": {
    fields: {
      eyebrow: "RATED BY OUR CUSTOMERS",
      headline: "4.8",
      subheadline: "Excellent · based on 1,284 reviews",
      description: "Independent, verified reviews from customers across the UK.",
      imageUrl: "",
      ctaText: "READ OUR REVIEWS ON TRUSTPILOT",
      items: [
        { name: "Karen H.", desc: "Gate fitted in a day — tidy, professional and on budget.", tag: "★★★★★" },
        { name: "Tomasz W.", desc: "Remote release and visitor codes changed how we run the site.", tag: "★★★★★" },
        { name: "Priya S.", desc: "Great aftercare — they came back to tweak the sensor for free.", tag: "★★★★☆" },
      ],
    },
    flash: "Trustpilot sample loaded — rating in the Headline, reviews in the rows",
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "scenes";
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    return TABS.find((x) => x === t) ?? "scenes";
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistFull[]>([]);
  const [assets, setAssets] = useState<{ id: string; name: string; url: string; type: string }[]>([]);
  const [publicAssets, setPublicAssets] = useState<{ id: string; name: string; url: string; type: string }[]>([]);
  const [displays, setDisplays] = useState<{ id: string; name: string; location?: string; playlistId?: string | null; pairingCode?: string; status?: string; lastSeen?: string; fullyUrl?: string; hasFully?: boolean }[]>([]);
  const [schedules, setSchedules] = useState<{ id: string; name: string; playlistId: string; displayId?: string | null; days: string; startTime: string; endTime: string; priority: number; enabled: boolean }[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Scene>(emptyScene());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [selPlaylist, setSelPlaylist] = useState<string | null>(null);
  // load() is memoised, so it reads the current selection through refs (otherwise it always sees
  // the first-render values and every reload jumps back to the first slide and playlist)
  const selIdRef = useRef<string | null>(null);
  const selPlRef = useRef<string | null>(null);
  // Baseline of the draft: the content as last loaded / saved / starter-applied.
  // While draft === baseline the slide is "untouched" and switching template may
  // load that template's sample page; the moment the user edits anything,
  // switching templates keeps their content instead of overwriting it (pickTemplate).
  const draftBaseline = useRef("");
  // stable (setDraft never changes) so it can be a dep of load() without recreating it
  const adoptDraft = useCallback((s: Scene) => { setDraft(s); draftBaseline.current = JSON.stringify(s); }, [setDraft]);
  useEffect(() => { selIdRef.current = selId; selPlRef.current = selPlaylist; });
  const screenBase = useScreenBase();
  // template picker filter: a pick applies only to the slide it was made on, then falls back to that slide's own category
  const [catPick, setCatPick] = useState<{ forId: string | null; cat: string }>({ forId: null, cat: "all" });
  const tplCat = catPick.forId === selId && catPick.cat ? catPick.cat : templateCategory(draft.template) === "other" ? "all" : templateCategory(draft.template);
  const [reduced, setReduced] = useState(false);
const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [previewKey, setPreviewKey] = useState(0);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandDraft, setBrandDraft] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandReady, setBrandReady] = useState(true);
  const [brandSaving, setBrandSaving] = useState(false);
  const savedBrandRef = useRef<BrandSettings>(DEFAULT_BRAND);

  const load = useCallback(async () => {
    const [s, p, a, d, sch, st, pub] = await Promise.all([
      fetch("/api/scenes").then((r) => r.json()).catch(() => ({ scenes: [] })),
      fetch("/api/playlists").then((r) => r.json()).catch(() => ({ playlists: [] })),
      fetch("/api/assets").then((r) => r.json()).catch(() => ({ assets: [] })),
      fetch("/api/displays").then((r) => r.json()).catch(() => ({ displays: [] })),
      fetch("/api/schedules").then((r) => r.json()).catch(() => ({ schedules: [] })),
      fetch("/api/settings").then((r) => r.json()).catch(() => null),
      fetch("/api/public-assets").then((r) => r.json()).catch(() => ({ assets: [] })),
    ]);
    const dbScenes: Scene[] = s.scenes?.length ? s.scenes : DEMO_SCENES;
    setScenes(dbScenes);
    setPlaylists(p.playlists || []);
    setAssets(a.assets || []);
    setPublicAssets(pub.assets || []);
    setDisplays(d.displays || []);
    setSchedules(sch.schedules || []);
    if (st?.brand) {
      // keep unsaved edits on the Business tab; otherwise follow the saved settings
      const b = normalizeBrand(st.brand);
      const prev = savedBrandRef.current;
      savedBrandRef.current = b;
      setBrand(b);
      setBrandDraft((dr) => (sameBrand(dr, prev) ? b : dr));
      setBrandReady(st.ready !== false);
    }
    if (selIdRef.current === null && dbScenes[0]) { setSelId(dbScenes[0].id); adoptDraft(dbScenes[0]); }
    if (selPlRef.current === null && p.playlists?.[0]) setSelPlaylist(p.playlists[0].id);
  }, [setBrandDraft, adoptDraft]);

  // load() only touches state after awaiting, but keep it out of the effect
  // body so the set-state-in-effect rule stays quiet.
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  // DB assets + public disk images (seasonal, retail, trade, uploads) —
  // merged so both show in the library and quick-set pickers.
  const allAssets = useMemo(
    () => [...assets, ...publicAssets],
    [assets, publicAssets]
  );

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const saveBrand = async () => {
    setBrandSaving(true);
    try {
      const r = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: brandDraft }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Save failed");
      const b = normalizeBrand(j.brand);
      savedBrandRef.current = b;
      setBrand(b);
      setBrandDraft(b);
      flash("Business settings saved — screens update within 30s");
    } catch (e) {
      flash(e instanceof Error ? e.message : "Save failed");
    }
    setBrandSaving(false);
  };
  const set = (k: keyof Scene, v: never) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };

  // Templates that get sample content when a slide switches to them (like splash):
  // without it the slide keeps the previous product content (prices, menu rows) and
  // the new layout looks broken/empty.
  // The sample page is only loaded while the draft is still untouched (identical to
  // what was last loaded/saved/applied). Once the user has typed anything into the
  // slide, switching templates keeps their content — never overwrites it.
  // The draft is not saved until Publish either way.
  const pickTemplate = (id: TemplateId) => {
    if (draft.template === id) return;
    const starter = TEMPLATE_STARTERS[id];
    if (!starter) { set("template", id as never); return; }
    if (JSON.stringify(draft) === draftBaseline.current) {
      const next: Scene = { ...draft, ...starter.fields, template: id };
      setDraft(next);
      draftBaseline.current = JSON.stringify(next);
      setDirty(true);
      flash(starter.flash);
    } else {
      set("template", id as never);
      flash("Template switched — your content was kept, nothing was overwritten");
    }
  };

  const isDemo = selId?.startsWith("demo-") && !scenes.some((s) => s.id === selId && !(s as { _demo?: boolean })._demo);
  // These templates draw the slide image as a logo/sticker, so the picker should
  // show whole images instead of cropping them to a rectangle.
  const imageIsLogo = draft.template === "splash" || draft.template === "trustpilot-review";
  // Templates whose renderer never draws the slide-level image (they show the
  // per-row pictures instead) — typing an address there silently does nothing.
  const imageUnused = IMAGE_UNUSED_TEMPLATES.includes(draft.template);

  const save = async () => {
    setSaving(true);
    try {
      if (!draft.id || draft.id === "new" || draft.id.startsWith("demo-")) {
        const r = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: undefined }) });
        const j = await r.json();
        setSelId(j.scene.id); adoptDraft(j.scene); flash("Scene created — display picks it up within 30s");
      } else {
        const r = await fetch(`/api/scenes/${draft.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        const j = await r.json();
        adoptDraft(j.scene); flash("Published — displays refresh automatically");
      }
      setDirty(false); load();
    } catch { flash("Save failed"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!draft.id || draft.id === "new" || draft.id.startsWith("demo-")) { flash("Demo scenes can't be deleted — duplicate one first"); return; }
    if (!confirm("Delete this scene?")) return;
    await fetch(`/api/scenes/${draft.id}`, { method: "DELETE" });
    setSelId(null); adoptDraft(emptyScene()); load(); flash("Scene deleted");
  };

  const flushDuration = async (id: string, value: number) => {
    if (!value || value < 6) return;
    await fetch("/api/playlist-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, durationOverride: value }),
    });
    load();
  };

  const saveDuration = (id: string, value: number, immediate = false) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    if (immediate) { void flushDuration(id, value); return; }
    saveTimers.current[id] = setTimeout(() => { delete saveTimers.current[id]; void flushDuration(id, value); }, 500);
  };

  const reorderPlaylist = async (draggedId: string, targetId: string) => {
    const order = playlist?.items.map((x) => x.id) ?? [];
    const from = order.indexOf(draggedId);
    const to = order.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = order.filter((id) => id !== draggedId);
    next.splice(to, 0, draggedId);
    await fetch("/api/playlist-items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId: playlist!.id, order: next }),
    });
    load();
  };

  const duplicate = async () => {
    const r = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: undefined, name: `${draft.name} (copy)` }) });
    const j = await r.json(); setSelId(j.scene.id); adoptDraft(j.scene); load(); flash("Duplicated — now editing the copy");
  };

  const seed = async (campaign: "retail" | "trade" | "value" | "corporate" = "retail") => {
    const r = await fetch(`/api/seed?campaign=${campaign}`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    load();
    flash(
      campaign === "trade"
        ? `Trade demo loaded (${j.created ?? "?"} new scenes, 5 screens)`
        : campaign === "value"
          ? `Value demo loaded (${j.created ?? "?"} new scenes, 2 screens)`
          : campaign === "corporate"
            ? `Corporate demo loaded (${j.created ?? "?"} new scenes, 2 screens)`
            : `Retail demo loaded (${j.created ?? "?"} new scenes, 2 screens)`
    );
  };

  const timeline = useMemo(() => buildTimeline(draft), [draft]);
  const playlist = playlists.find((p) => p.id === selPlaylist);

  return (
    <main className="min-h-screen bg-[#0a0f1f] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className={brand.logoUrl ? "flex h-10 items-center rounded-xl bg-white px-3" : "grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-orange-400 font-black"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.businessName} className="h-6 w-auto max-w-[140px] object-contain" /> : (brand.businessName.charAt(0).toUpperCase() || "N")}
            </Link>
            <div>
              <div className="font-black uppercase tracking-widest">{brand.businessName || "NovaSign"} · signage</div>
              <div className="text-[11px] tracking-widest text-white/50">CONTENT → PLAYLISTS → DISPLAYS {dirty && <span className="ml-2 rounded bg-amber-400 px-2 py-0.5 text-black">UNSAVED</span>}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <button onClick={() => seed("retail")} className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20 hover:bg-white/20">✨ Retail demo</button>
            <button onClick={() => seed("trade")} className="rounded-full bg-amber-400/20 px-4 py-2 text-amber-200 ring-1 ring-amber-300/40 hover:bg-amber-400/30">⚡ Trade demo</button>
            <button onClick={() => seed("value")} className="rounded-full bg-emerald-400/20 px-4 py-2 text-emerald-200 ring-1 ring-emerald-300/40 hover:bg-emerald-400/30">💰 Value demo</button>
            <button onClick={() => seed("corporate")} className="rounded-full bg-sky-400/20 px-4 py-2 text-sky-200 ring-1 ring-sky-300/40 hover:bg-sky-400/30">🏢 Corporate demo</button>
            <Link href="/display" target="_blank" className="rounded-full bg-red-500 px-4 py-2 hover:bg-red-400">▶ Display</Link>
            <Link href="/docs" className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">Docs</Link>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }} className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">Sign out</button>
            {msg && <span className="rounded-full bg-green-500/20 px-4 py-2 text-green-300 ring-1 ring-green-400/40">{msg}</span>}
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-5 pb-3">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-5 py-2 text-sm font-black tracking-widest uppercase ${tab === t ? "bg-white text-black" : t === "database" ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>{t === "database" ? "⚡ database / supabase" : t === "business" ? "⚙ business" : t}</button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-6">
        {/* ── SCENES ── */}
        {tab === "scenes" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr_520px]">
            <div className="rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-white/50">SCENES ({scenes.length})</span>
                <button onClick={() => { setSelId("new"); adoptDraft(emptyScene()); }} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ New</button>
              </div>
              <div className="sg-scroll max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {scenes.map((s) => (
                  <button key={s.id} onClick={() => { setSelId(s.id); adoptDraft(s); setDirty(false); setPreviewKey((k) => k + 1); }}
                    className={`w-full rounded-2xl p-3 text-left ring-1 ${selId === s.id ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black">{s.name}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${selId === s.id ? "bg-black text-white" : "bg-white/10"}`}>{s.template}</span>
                    </div>
                    <div className={`mt-0.5 truncate text-xs ${selId === s.id ? "text-black/60" : "text-white/50"}`}>{s.productName || s.headline} · {s.promoPrice || ""}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="sg-scroll max-h-[78vh] space-y-4 overflow-y-auto rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <h2 className="font-black">Scene editor</h2>
                <div className="flex gap-2">
                  <button onClick={duplicate} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black ring-1 ring-white/20">Duplicate</button>
                  <button onClick={remove} className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-red-300 ring-1 ring-white/20">Delete</button>
                  <button onClick={save} disabled={saving} className="rounded-full bg-green-500 px-5 py-2 text-xs font-black text-black disabled:opacity-50">{saving ? "Publishing…" : "⬆ Publish"}</button>
                </div>
              </div>
              {isDemo && <p className="rounded-2xl bg-amber-400/15 p-3 text-xs text-amber-200 ring-1 ring-amber-300/30">You&apos;re editing a built-in demo scene — Publish will save it as a new editable copy.</p>}
              <Field label="Scene name"><input value={draft.name} onChange={(e) => set("name", e.target.value as never)} className="inp" /></Field>
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label className="lbl">Template</label>
                  <select aria-label="Template category" value={tplCat} onChange={(e) => setCatPick({ forId: selId, cat: e.target.value })} className="inp mb-1.5 w-auto bg-[#141b33] py-1 text-xs">
                    <option value="all">All templates ({TEMPLATES.length})</option>
                    {TEMPLATE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.templates.length})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.filter((t) => tplCat === "all" || templateCategory(t.id) === tplCat || t.id === draft.template).map((t) => (
                    <button key={t.id} onClick={() => pickTemplate(t.id)} className={`rounded-2xl p-3 text-left ring-1 ${draft.template === t.id ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}>
                      <div className="text-xs font-black">{t.name}</div>
                      <div className={`text-[11px] ${draft.template === t.id ? "text-black/60" : "text-white/50"}`}>{t.blurb}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Eyebrow / kicker"><input value={draft.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value as never)} className="inp" /></Field>
                <Field label="Headline"><input value={draft.headline || ""} onChange={(e) => set("headline", e.target.value as never)} className="inp" /></Field>
                <Field label="Product name"><input value={draft.productName || ""} onChange={(e) => set("productName", e.target.value as never)} className="inp" /></Field>
                <Field label="Subheadline"><input value={draft.subheadline || ""} onChange={(e) => set("subheadline", e.target.value as never)} className="inp" /></Field>
              </div>
              <Field label="Description"><textarea value={draft.description || ""} onChange={(e) => set("description", e.target.value as never)} rows={2} className="inp" /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Was price"><input value={draft.originalPrice || ""} onChange={(e) => set("originalPrice", e.target.value as never)} className="inp" /></Field>
                <Field label="Promo price"><input value={draft.promoPrice || ""} onChange={(e) => set("promoPrice", e.target.value as never)} className="inp" /></Field>
                <Field label="Badge"><input value={draft.discountBadge || ""} onChange={(e) => set("discountBadge", e.target.value as never)} className="inp" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA"><input value={draft.ctaText || ""} onChange={(e) => set("ctaText", e.target.value as never)} className="inp" /></Field>
                <Field label="Ticker"><input value={draft.tickerText || ""} onChange={(e) => set("tickerText", e.target.value as never)} className="inp" /></Field>
              </div>
              <p className="text-[11px] text-white/40">Tip: type <code className="text-white/70">{"{phone}"}</code> or <code className="text-white/70">{"{business}"}</code> in any text and the screen shows the details from the <button onClick={() => setTab("business")} className="underline">Business</button> tab.</p>
              <MediaField
                label={imageIsLogo ? "Logo image URL (overrides the Business logo)" : "Image URL"}
                value={draft.imageUrl || ""}
                onChange={(v) => set("imageUrl", v as never)}
                assets={allAssets}
                fit={imageIsLogo ? "contain" : "cover"}
                hint={
                  <>
                    <p className="mt-1 text-[11px] text-white/40">Type or paste an address, or press “Library” to pick a picture from your media library.</p>
                    {imageUnused && (
                      <p className="mt-1 text-[11px] text-amber-300/90">This template doesn&apos;t draw the slide image — add pictures to the rows below, or use the background image.</p>
                    )}
                  </>
                }
              />
              <MediaField
                label="Background image (full-bleed behind the slide)"
                value={draft.bgImageUrl || ""}
                onChange={(v) => set("bgImageUrl", v as never)}
                assets={allAssets}
                hint={[
                  "product-showcase",
                  "fullscreen-campaign",
                  "split-promo",
                  "callout-emergency",
                ].includes(draft.template) ? (
                  <p className="mt-1 text-[11px] text-white/40">
                    On this template the background image replaces the main photo.
                  </p>
                ) : undefined}
              />
              <MediaField
                label="Video URL (muted, looping hero background)"
                value={draft.videoUrl || ""}
                onChange={(v) => set("videoUrl", v as never)}
                assets={allAssets}
                media="video"
                placeholder="https://…/clip.mp4"
              />
              <div>
                <label className="lbl">Season / theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "none", label: "None", color: "#0f172a" },
                    { id: "christmas", label: "Christmas", color: "#dc2626" },
                    { id: "easter", label: "Easter", color: "#ec4899" },
                    { id: "halloween", label: "Halloween", color: "#f97316" },
                    { id: "spring", label: "Spring", color: "#16a34a" },
                    { id: "summer", label: "Summer", color: "#0ea5e9" },
                    { id: "autumn", label: "Autumn", color: "#d97706" },
                    { id: "winter", label: "Winter", color: "#0ea5e9" },
                  ].map((th) => {
                    const active = draft.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => set("theme", th.id as never)}
                        className={`flex flex-col items-center gap-1 rounded-xl p-2 ring-2 text-xs font-bold ${active ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}
                      >
                        <div className={`h-6 w-6 rounded-full ${active ? "ring-2 ring-white" : ""}`} style={{ background: th.color }} />
                        <span>{th.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-white/40">Theme decorations always show. Theme colours only apply when &quot;Use brand colours on every slide&quot; is on (Business tab).</p>
              </div>
              <Field label="Darken background">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={draft.overlayOpacity ?? 45}
                    onChange={(e) => set("overlayOpacity", Number(e.target.value) as never)}
                    className="w-full accent-red-500"
                  />
                  <span className="text-xs font-mono text-white/50">{draft.overlayOpacity ?? 45}%</span>
                </div>
                <p className="mt-1 text-[11px] text-white/40">Darkens the background image so slide text stays readable.</p>
              </Field>
              <div className="grid grid-cols-4 gap-3">
                <Color label="Background from" v={draft.bgFrom} onChange={(v) => set("bgFrom", v as never)} />
                <Color label="Background to" v={draft.bgTo} onChange={(v) => set("bgTo", v as never)} />
                <Color label="Accent" v={draft.accentColor} onChange={(v) => set("accentColor", v as never)} />
                <Color label="Text" v={draft.textColor} onChange={(v) => set("textColor", v as never)} />
              </div>
              {HIGHLIGHT_TEMPLATES.includes(draft.template) && (
                <div className="flex items-end gap-3">
                  <div className="w-1/4 min-w-[120px]">
                    <Color label="Highlight (yellow)" v={draft.highlightColor || "#ffd60a"} onChange={(v) => set("highlightColor", v as never)} />
                  </div>
                  <button onClick={() => set("highlightColor", "" as never)} disabled={!draft.highlightColor} className="mb-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold ring-1 ring-white/15 disabled:opacity-40">Reset to yellow</button>
                  <p className="mb-1 text-[11px] text-white/40">The second colour on strips, price flags and stickers.</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Animation preset</label>
                  <div className="space-y-1.5">
                    {(Object.keys(ANIMATION_PRESETS) as (keyof typeof ANIMATION_PRESETS)[]).map((k) => (
                      <button key={k} onClick={() => { set("animationPreset", k as never); }} className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold ring-1 ${draft.animationPreset === k ? "bg-white text-black" : "bg-white/5 ring-white/10"}`}>
                        {ANIMATION_PRESETS[k].name} — <span className="font-normal opacity-70">{ANIMATION_PRESETS[k].blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="lbl">Scene transition</label>
                    <select value={draft.transition} onChange={(e) => set("transition", e.target.value as never)} className="inp bg-[#141b33]">
                      {TRANSITIONS.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.blurb}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={`Duration · ${draft.durationSec}s`}><input type="range" min={6} max={20} value={draft.durationSec} onChange={(e) => set("durationSec", Number(e.target.value) as never)} className="w-full accent-red-500" /></Field>
                    <Field label={`Stagger · ${draft.staggerMs}ms`}><input type="range" min={40} max={300} step={10} value={draft.staggerMs} onChange={(e) => set("staggerMs", Number(e.target.value) as never)} className="w-full accent-red-500" /></Field>
                  </div>
                  <div>
                    <label className="lbl">Image motion (Ken Burns)</label>
                    <select value={draft.kenBurns} onChange={(e) => set("kenBurns", e.target.value as never)} className="inp bg-[#141b33]">
                      {(["zoom-in", "zoom-out", "pan-left", "pan-right", "static"] as const).map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <Field label="Image position"><input value={draft.imagePosition || "center"} onChange={(e) => set("imagePosition", e.target.value as never)} className="inp" placeholder="center / top / 30% 60%" /></Field>
                </div>
              </div>
              {draft.template === "aisle-guide" && (
                <Field label="Arrow direction">
                  <select value={["left", "right"].includes((draft.layoutVariant || "").toLowerCase()) ? draft.layoutVariant.toLowerCase() : "ahead"} onChange={(e) => set("layoutVariant", e.target.value as never)} className="inp bg-[#141b33]">
                    <option value="ahead">Ahead</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                  <p className="mt-1 text-[11px] text-white/40">Put the aisle number in “Product name” and the department in “Headline”.</p>
                </Field>
              )}
              {ITEM_TEMPLATES.includes(draft.template) && (
                <ItemsEditor
                  items={(draft.items as Scene["items"]) || []}
                  template={draft.template}
                  assets={allAssets}
                  onChange={(v) => set("items", v as never)}
                />
              )}
            </div>

            <div className="lg:sticky lg:top-32">
              <div className="mb-2 flex items-center justify-between text-xs font-black tracking-widest text-white/50">
                <span>LIVE PREVIEW · {draft.template.toUpperCase()}</span>
                <span className="flex gap-2">
                  <button onClick={() => setReduced((r) => !r)} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">{reduced ? "MOTION: REDUCED" : "MOTION: FULL"}</button>
                  <button onClick={() => setPreviewKey((k) => k + 1)} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">↻ REPLAY</button>
                </span>
              </div>
              <div className="sg-stage relative overflow-hidden rounded-3xl bg-black ring-1 ring-white/20 shadow-2xl">
                <ScreenView scene={draft} brand={brand} reducedMotion={reduced} animKey={previewKey} progressKey={previewKey} preview />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Link href={`/display?playlistId=${selPlaylist || ""}`} target="_blank" className="rounded-xl bg-white/10 p-3 font-bold ring-1 ring-white/15 hover:bg-white/20">⛶ Full-screen<br />playlist</Link>
                <button onClick={save} className="rounded-xl bg-green-500/20 p-3 font-black text-green-300 ring-1 ring-green-400/40">⬆ Publish<br />to displays</button>
                <button onClick={() => setTab("timeline")} className="rounded-xl bg-white/10 p-3 font-bold ring-1 ring-white/15">◷ View<br />timeline</button>
              </div>
              <LibraryPicker title="QUICK-SET IMAGE FROM LIBRARY" assets={allAssets} current={draft.imageUrl || ""} onPick={(url) => set("imageUrl", url as never)} />
              <LibraryPicker title="QUICK-SET BACKGROUND FROM LIBRARY" assets={allAssets} current={draft.bgImageUrl || ""} onPick={(url) => set("bgImageUrl", url as never)} />
            </div>
          </div>
        )}

        {/* ── PLAYLISTS ── */}
        {tab === "playlists" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
            <div className="rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-white/50">PLAYLISTS</span>
                <button onClick={async () => { const r = await fetch("/api/playlists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Playlist ${playlists.length + 1}` }) }); const j = await r.json(); setSelPlaylist(j.playlist.id); load(); }} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ New</button>
              </div>
              <div className="space-y-2">
                {playlists.map((p) => (
                  <button key={p.id} onClick={() => setSelPlaylist(p.id)} className={`w-full rounded-2xl p-3 text-left ring-1 ${selPlaylist === p.id ? "bg-white text-black" : "bg-white/5 ring-white/10"}`}>
                    <div className="text-sm font-black">{p.name}</div>
                    <div className={`text-xs ${selPlaylist === p.id ? "text-black/60" : "text-white/50"}`}>{p.scenes?.length || 0} scenes</div>
                  </button>
                ))}
                {playlists.length === 0 && <p className="text-sm text-white/50">No playlists yet — click “Load demo”.</p>}
              </div>
            </div>
            <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              {!playlist ? <p className="text-white/50">Select a playlist.</p> : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input value={playlist.name} onChange={async (e) => { const v = e.target.value; setPlaylists((ps) => ps.map((p) => p.id === playlist.id ? { ...p, name: v } : p)); }} onBlur={async (e) => { await fetch(`/api/playlists/${playlist.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: e.target.value }) }); }} className="rounded-xl bg-transparent text-xl font-black outline-none ring-white/20 focus:ring-2" />
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/display?playlistId=${playlist.id}`} target="_blank" className="rounded-full bg-red-500 px-4 py-2 text-xs font-black">▶ Play</Link>
                      <Link href={`/export?playlistId=${playlist.id}`} target="_blank" className="rounded-full bg-sky-400 px-4 py-2 text-xs font-black text-slate-950 hover:bg-sky-300">↓ Export MP4</Link>
                      <button onClick={async () => { if (!confirm("Delete playlist?")) return; await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" }); setSelPlaylist(null); load(); }} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-red-300 ring-1 ring-white/20">Delete</button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-white/50">Total runtime ≈ {Math.round((playlist.scenes || []).reduce((a, s) => a + (s._durationOverride || s.durationSec || 10), 0) / 60 * 10) / 10} min · loops on displays · pushes within 30s</div>
                  <div className="mt-4 space-y-2">
                    {(playlist.scenes || []).map((s, i) => (
                      <div key={s._itemId || s.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-sm font-black">{i + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {s.imageUrl && <img src={s.imageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-black">{s.name}</div>
                          <div className="text-xs text-white/50">{s.template} · {s._durationOverride || s.durationSec}s · {s._transitionOverride || s.transition}</div>
                        </div>
                        <input type="number" min={6} max={30} defaultValue={s._durationOverride || s.durationSec} title="Duration override"
                          onChange={(e) => saveDuration(s._itemId!, Number(e.target.value))}
                          onBlur={(e) => saveDuration(s._itemId!, Number(e.target.value), true)}
                          className="w-16 rounded-lg bg-black/40 px-2 py-1.5 text-center text-sm font-bold ring-1 ring-white/15" />
                        <div draggable={true}
                          onDragStart={(e) => { e.dataTransfer.setData("text/plain", s._itemId!); e.dataTransfer.effectAllowed = "move"; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => { const id = e.dataTransfer.getData("text/plain"); if (id && id !== s._itemId) await reorderPlaylist(id, s._itemId!); }}
                          className="rounded-lg bg-white/10 px-2.5 py-1.5 font-black text-[14px] cursor-grab active:cursor-grabbing" title="Drag to reorder">
                          ⠇
                        </div>
                        <button onClick={async () => { await fetch(`/api/playlist-items?id=${s._itemId}`, { method: "DELETE" }); load(); }} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-red-300">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <select id="addscene" className="inp max-w-md bg-[#141b33]">
                      {scenes.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.template})</option>)}
                    </select>
                    <button onClick={async () => { const el = document.getElementById("addscene") as HTMLSelectElement; if (!el?.value || el.value.startsWith("demo-")) { flash("Save the scene first (Publish), then add it"); return; } await fetch("/api/playlist-items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId: playlist.id, sceneId: el.value }) }); load(); flash("Added to playlist"); }} className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-black">+ Add scene</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── ASSETS ── */}
        {tab === "assets" && <AssetsPanel assets={allAssets} onReload={load} flash={flash} onUse={(url) => { set("imageUrl", url as never); setTab("scenes"); flash("Image set on current scene draft"); }} />}

        {/* ── DISPLAYS ── */}
        {tab === "displays" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
            <ScreenBasePanel {...screenBase} />
            <div className="grid gap-4 sm:grid-cols-2">
              {displays.map((x) => {
                const pl = playlists.find((p) => p.id === x.playlistId);
                const online = x.status === "online";
                return (
                  <div key={x.id} className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black tracking-widest ${online ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"}`}>{online ? "● ONLINE" : "○ OFFLINE"}</span>
                      <span className="font-mono text-xs text-white/40">{x.pairingCode}</span>
                    </div>
                    <div className="mt-3 text-lg font-black">{x.name}</div>
                    <div className="text-sm text-white/50">{x.location || "—"}</div>
                    <div className="mt-3">
                      <label className="lbl">Playlist</label>
                      <select value={x.playlistId || ""} onChange={async (e) => { await fetch(`/api/displays/${x.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId: e.target.value || null }) }); load(); flash("Display retargeted — applies on next poll"); }} className="inp bg-[#141b33]">
                        <option value="">— none —</option>
                        {playlists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <ScreenUrl url={`${screenBase.base}/display?displayId=${x.id}`} onCopied={() => flash("Screen URL copied")} />
                    <div className="mt-3 flex gap-2 text-xs font-black">
                      <Link href={`/display?displayId=${x.id}`} target="_blank" className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-center hover:bg-red-400">▶ OPEN SCREEN</Link>
                      <button onClick={async () => { if (!confirm("Remove display?")) return; await fetch(`/api/displays/${x.id}`, { method: "DELETE" }); load(); }} className="rounded-xl bg-white/10 px-4 py-2.5 text-red-300 ring-1 ring-white/20">✕</button>
                    </div>
                    <PlayerControls displayId={x.id} fullyUrl={x.fullyUrl} hasFully={x.hasFully} onSaved={load} flash={flash} />
                    <div className="mt-2 text-[11px] text-white/40">Serving: {pl?.name || "—"} · Last seen: {x.lastSeen ? new Date(x.lastSeen).toLocaleString() : "never"}</div>
                  </div>
                );
              })}
              {displays.length === 0 && <p className="text-white/50">No displays — load the demo or add one.</p>}
            </div>
            </div>
            <div className="h-fit rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h3 className="font-black">Add a screen</h3>
              <p className="mt-1 text-sm text-white/50">Each TV gets its own URL, opened fullscreen by a player device (Fully Kiosk on an Android box, or a PC/Pi in kiosk mode).</p>
              <button onClick={async () => { const r = await fetch("/api/displays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Screen ${displays.length + 1}`, playlistId: selPlaylist }) }); await r.json(); load(); flash("Screen added — open its URL on the player device"); }} className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-black">+ Register display</button>
              <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-white/70">
                <li>Click <b>+ Register display</b>. A card appears with its own web address.</li>
                <li>Choose the <b>Playlist</b> that screen should play.</li>
                <li>Click <b>COPY</b> on the screen&apos;s address box.</li>
                <li>On the device plugged into the TV (TV browser, streaming stick or mini PC), open that address. It plays full screen and shows <b>ONLINE</b> here within about 20 seconds.</li>
                <li>To start on its own after a power cut, set that address as the start page of a kiosk app (see below).</li>
              </ol>
              <p className="mt-3 text-xs text-white/50">The TV and the server must be able to reach each other: on the same Wi-Fi/network for a PC at the shop, or any internet connection if the CMS is hosted online. If the address starts with <code>localhost</code>, it will only work on this PC.</p>
              <div className="mt-4 rounded-2xl bg-black/30 p-4 text-xs leading-relaxed text-white/60">
                <span className="font-black text-white/80">FULLY KIOSK (RECOMMENDED):</span><br />1. Install Fully Kiosk Browser, buy the PLUS licence.<br />2. Start URL = this screen&apos;s URL · Launch on Boot · Keep Screen On.<br />3. Settings → Remote Administration: enable, set a password, allow local network.<br />4. Paste the player&apos;s <code>http://IP:2323</code> into <b>Player device</b> above to reload / wake / screenshot it from here.<br /><br />It heartbeats every 20 s and polls content every 30 s — no reinstall needed.
              </div>
            </div>
          </div>
        )}

        {/* ── SCHEDULES ── */}
        {tab === "schedules" && (
          <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-black">Campaign schedules <span className="text-sm font-normal text-white/50">— time windows override a display&apos;s default playlist; if schedules overlap, the higher number wins</span></h3>
              <button onClick={async () => { if (!playlists[0]) { flash("Create a playlist first"); return; } await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Schedule ${schedules.length + 1}`, playlistId: playlists[0].id }) }); load(); }} className="rounded-full bg-white px-4 py-2 text-xs font-black text-black">+ New schedule</button>
            </div>
            <div className="mt-4 space-y-2">
              {schedules.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                  <button onClick={async () => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, enabled: !s.enabled }) }); load(); }} className={`rounded-full px-3 py-1 text-xs font-black ${s.enabled ? "bg-green-500 text-black" : "bg-white/10 text-white/50"}`}>{s.enabled ? "ON" : "OFF"}</button>
                  <span className="font-black">{s.name}</span>
                  <select value={s.playlistId} onChange={async (e) => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, playlistId: e.target.value }) }); load(); }} className="rounded-lg bg-black/40 px-2 py-1.5 text-sm ring-1 ring-white/15">
                    {playlists.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={s.displayId || ""} onChange={async (e) => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, displayId: e.target.value || null }) }); load(); }} className="rounded-lg bg-black/40 px-2 py-1.5 text-sm ring-1 ring-white/15">
                    <option value="">all displays</option>
                    {displays.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                  <input type="time" value={s.startTime} onChange={async (e) => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, startTime: e.target.value }) }); load(); }} className="rounded-lg bg-black/40 px-2 py-1.5 text-sm ring-1 ring-white/15" />
                  <span className="text-white/40">→</span>
                  <input type="time" value={s.endTime} onChange={async (e) => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, endTime: e.target.value }) }); load(); }} className="rounded-lg bg-black/40 px-2 py-1.5 text-sm ring-1 ring-white/15" />
                  <div className="flex items-center gap-1">
                    {([["Mon", 1], ["Tue", 2], ["Wed", 3], ["Thu", 4], ["Fri", 5], ["Sat", 6], ["Sun", 0]] as [string, number][]).map(([label, value]) => {
                      // an empty / missing days value means "every day"
                      const stored = (s.days ?? "").split(",").filter((d) => d !== "").map(Number);
                      const cur = stored.length ? stored : [1, 2, 3, 4, 5, 6, 0];
                      const active = cur.includes(value);
                      return (
                        <button
                          key={label}
                          onClick={async () => {
                            const next = active ? cur.filter((d) => d !== value) : [...cur, value];
                            if (next.length === 0) { flash("A schedule needs at least one day"); return; }
                            await fetch("/api/schedules", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: s.id, days: next.join(",") }),
                            });
                            load();
                          }}
                          className={`rounded px-2 py-1 text-[12px] font-black ${active ? "bg-white text-black" : "bg-white/10 text-white/50 ring-1 ring-white/20 hover:bg-white/20"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] text-white/40" title="If schedules overlap, higher number wins">priority</span>
                  <input type="number" value={s.priority} onChange={async (e) => { await fetch("/api/schedules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, priority: Number(e.target.value) }) }); load(); }} className="w-14 rounded-lg bg-black/40 px-2 py-1.5 text-center text-sm ring-1 ring-white/15" />
                  <button onClick={async () => { await fetch(`/api/schedules?id=${s.id}`, { method: "DELETE" }); load(); }} className="ml-auto rounded-lg bg-white/10 px-3 py-1.5 text-xs text-red-300">Delete</button>
                </div>
              ))}
              {schedules.length === 0 && <p className="text-white/50">No schedules yet.</p>}
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_480px]">
            <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h3 className="font-black">Animation timeline — {draft.name}</h3>
              <p className="text-sm text-white/50">Deterministic 10-step choreography for the 8-beat sequence. CSS delays in the preview mirror these timestamps.</p>
              <div className="mt-4 space-y-1">
                {timeline.map((t, i) => {
                  const total = draft.durationSec * 1000;
                  const left = Math.min(100, (t.atMs / total) * 100);
                  return (
                    <div key={t.key + i} className="grid grid-cols-[44px_1fr] items-center gap-3 rounded-xl bg-white/[0.03] p-2.5 ring-1 ring-white/5">
                      <span className="font-mono text-xs text-white/40">{(t.atMs / 1000).toFixed(1)}s</span>
                      <div>
                        <div className="flex justify-between text-sm"><span className="font-bold">{i + 1}. {t.label}</span><span className="text-white/40">{t.effect} · {t.durMs}ms</span></div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-red-500" style={{ marginLeft: `${left}%`, width: `${Math.max(3, (t.durMs / total) * 100)}%` }} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1.5">Preset: {draft.animationPreset}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">Easing: {ANIMATION_PRESETS[draft.animationPreset]?.easing}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5">Exit: {draft.transition}</span>
              </div>
            </div>
            <div>
              <div className="sg-stage relative overflow-hidden rounded-3xl bg-black ring-1 ring-white/20">
                <ScreenView scene={draft} brand={brand} reducedMotion={reduced} animKey={previewKey} progressKey={previewKey} preview />
              </div>
              <button onClick={() => setPreviewKey((k) => k + 1)} className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-black ring-1 ring-white/20">↻ Replay scene</button>
            </div>
          </div>
        )}

        {/* ── BUSINESS ── */}
        {tab === "business" && (
          <BusinessPanel
            draft={brandDraft}
            onChange={(k, v) => setBrandDraft((b) => ({ ...b, [k]: v }))}
            dirty={!sameBrand(brandDraft, brand)}
            saving={brandSaving}
            ready={brandReady}
            onSave={saveBrand}
            onUndo={() => setBrandDraft(brand)}
            scenes={scenes}
            assets={allAssets}
            onAssetsChanged={load}
            flash={flash}
          />
        )}

        {/* ── DATABASE / SUPABASE ── */}
        {tab === "database" && <DatabasePanel onFlash={flash} onSeed={seed} />}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="lbl">{label}</label>{children}</div>;
}

// Templates that never render scene.imageUrl (see SceneRenderer / templates/*).
const IMAGE_UNUSED_TEMPLATES: TemplateId[] = ["product-grid", "deals-grid", "multibuy", "clearance", "aisle-guide", "top-sellers", "store-services", "price-list", "brand-wall", "team-intro"];

const HIGHLIGHT_TEMPLATES: string[] = ["price-drop", "deals-grid", "multibuy", "clearance", "aisle-guide", "top-sellers", "store-services", "splash"];

type Asset = { id: string; name: string; url: string; type: string; source?: string };

/**
 * One media thumbnail with a visible fallback when the file can't be loaded, so a
 * broken/mistyped URL or a deleted file reads as "404" instead of an empty box.
 */
function Thumb({ url, fit = "cover", className = "h-10 w-16" }: { url: string; fit?: "cover" | "contain"; className?: string }) {
  const [failed, setFailed] = useState("");
  const broken = failed === url;
  return (
    <span className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/15`}>
      {broken ? (
        <span className="text-sm font-black text-red-300" title="This file could not be loaded — is the address right, or is the display offline?">!</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" draggable={false} onError={() => setFailed(url)} className={`h-full w-full ${fit === "contain" ? "bg-white object-contain p-1" : "object-cover"}`} />
      )}
    </span>
  );
}

/** Small picture icon for the library buttons (emoji glyphs are not on every machine). */
function BrowseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]">
      <rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="10" r="1.8" fill="currentColor" />
      <path d="M4.5 18l5-5 4 4 3-2.5 3 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Media-library browser. It is always rendered *inline below the field that opened
 * it* — never inside the narrow row grid — because as a grid child it used to be
 * squeezed into the 40px column and clipped to an unreadable sliver.
 */
function LibraryPicker({
  title,
  assets,
  onPick,
  current = "",
  onClose,
  media = "image",
  fit = "cover",
}: {
  title: string;
  assets: Asset[];
  onPick: (url: string) => void;
  current?: string;
  onClose?: () => void;
  media?: "image" | "video";
  fit?: "cover" | "contain";
}) {
  const items = assets.filter((a) => (media === "video" ? a.type === "video" : a.type !== "video"));
  const noun = media === "video" ? "video" : "image";
  return (
    <div className="mt-2 w-full rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10" role="group" aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-black tracking-widest text-white/50">{title}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white/40">
            {items.length} {noun}{items.length === 1 ? "" : "s"}
          </span>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close the media library" className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-white/70 ring-1 ring-white/15 hover:bg-white/20">✕</button>
          )}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-white/50">
          No {noun}s in the library yet — upload one in the <span className="font-bold text-white/70">Assets</span> tab and it shows up here.
        </p>
      ) : (
        <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-4">
          {items.map((a) => {
            const active = current === a.url;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onPick(a.url)}
                title={a.name}
                aria-pressed={active}
                className={`relative overflow-hidden rounded-lg transition ${active ? "ring-2 ring-white" : "ring-1 ring-white/20 hover:ring-2 hover:ring-white/70"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} loading="lazy" draggable={false} className={`aspect-[4/3] w-full ${fit === "contain" ? "bg-white object-contain p-1" : "object-cover"}`} />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/65 px-1 py-0.5 text-left text-[10px] font-bold text-white/90">{a.name}</span>
                {active && <span className="pointer-events-none absolute right-1 top-1 rounded bg-white px-1 text-[9px] font-black text-black">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Address field for an image/video with a library button, a live preview and a
 * clear button. Used for the slide image, the background image and the video.
 */
function MediaField({
  label,
  value,
  onChange,
  assets,
  media = "image",
  fit = "cover",
  placeholder = "https://… or /retail/apples.jpg",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  assets: Asset[];
  media?: "image" | "video";
  fit?: "cover" | "contain";
  placeholder?: string;
  hint?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState("");
  const broken = value !== "" && failed === value;
  const isVideo = media === "video";
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} className="inp" placeholder={placeholder} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          title="Browse the media library"
          className={`shrink-0 rounded-xl px-3 text-xs font-bold ring-1 ${open ? "bg-white text-black ring-white" : "bg-white/10 ring-white/15 hover:bg-white/20"}`}
        >
          <BrowseIcon /> Library
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} title="Clear this field" aria-label="Clear" className="shrink-0 rounded-xl bg-white/10 px-3 text-xs font-bold ring-1 ring-white/15 hover:bg-white/20">✕</button>
        )}
      </div>
      {value && (
        <div className="mt-1.5 flex items-center gap-2">
          {broken ? (
            <span className="rounded-lg bg-red-500/15 px-2 py-1 text-[11px] font-bold text-red-300 ring-1 ring-red-400/30">Can&apos;t load this {isVideo ? "video" : "image"} — check the address</span>
          ) : (
            <span className="h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/15">
              {isVideo ? (
                <video src={value} className="h-full w-full object-cover" muted onError={() => setFailed(value)} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="" draggable={false} onError={() => setFailed(value)} className="h-full w-full object-cover" />
              )}
            </span>
          )}
          <span className="min-w-0 truncate font-mono text-[10px] text-white/35">{value}</span>
        </div>
      )}
      {hint}
      {open && (
        <LibraryPicker
          title={`${label.toUpperCase()} — MEDIA LIBRARY`}
          assets={assets}
          current={value}
          media={media}
          fit={fit}
          onClose={() => setOpen(false)}
          onPick={(url) => { onChange(url); setOpen(false); }}
        />
      )}
    </div>
  );
}

function Color({ label, v, onChange }: { label: string; v: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="flex items-center gap-2 rounded-xl bg-black/40 p-2 ring-1 ring-white/10">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#ff3b30"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
        <span className="font-mono text-xs text-white/70">{v}</span>
      </div>
    </div>
  );
}

const ITEM_HINTS: Partial<Record<TemplateId, string>> = {
  "food-menu": "Name / price / tag — the menu list",
  "product-grid": "Name / price / tag + image — product cards",
  "service-offer": "Up to 4 ticked bullets — name + detail (price is ignored)",
  "price-list": "Up to 8 rate rows — name / detail / price, tag optional",
  "brand-wall": "Up to 8 brand tiles — name + short descriptor, optional logo image (shown instead of the name)",
  "product-spec": "Up to 6 spec rows — name = label, detail = value",
  "callout-emergency": "Up to 3 job types — name + detail",
  "deals-grid": "Up to 6 deal tiles — name / price / tag + image",
  "clearance": "Up to 4 clearance items — name + tag (% off) + detail (stock count)",
  "top-sellers": "Up to 5 ranked items — name / price / tag (rank number) + image",
  "multibuy": "Up to 3 products in the offer — name / price + image",
  "aisle-guide": "Up to 6 sub-categories for this aisle — name + optional note",
  "splash": "Up to 4 contact cards — name = label (Call us), detail = the value ({phone} works). The icon is picked from the words. Put a logo URL in the slide's Image URL to override the Business logo.",
  "store-services": "Up to 6 service cards — name = title, detail = lines such as opening hours, tag = icon word (collect, returns, hours, help, delivery)",
  "company-values": "Up to 6 values — name = the principle, detail = one line explaining it",
  "team-intro": "Up to 8 people — name + role in detail; optional avatar image per row",
  "testimonial-quote": "Up to 2 extra quotes — name = author, detail = the quote. The main quote goes in the slide's Headline + Description",
  "trustpilot-review": "Top reviews — name = reviewer, detail = review text, tag = stars (★★★★★). The rating number goes in the slide's Headline",
};

// Templates whose renderer draws a picture per row (see SceneRenderer): product
// cards, brand logos, deal tiles, ranked thumbnails, clearance items, multi-buy
// products, team avatars and Trustpilot reviewer photos.
const IMAGE_TEMPLATES: TemplateId[] = ["product-grid", "brand-wall", "deals-grid", "top-sellers", "clearance", "multibuy", "team-intro", "trustpilot-review"];

function ItemsEditor({ items, template, assets, onChange }: { items: NonNullable<Scene["items"]>; template: TemplateId; assets: Asset[]; onChange: (v: NonNullable<Scene["items"]>) => void }) {
  const list = items || [];
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const edit = (i: number, k: string, v: string) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const showPrice =
    template === "food-menu" ||
    template === "product-grid" ||
    template === "price-list" ||
    template === "deals-grid" ||
    template === "clearance" ||
    template === "top-sellers";
  const showImage = IMAGE_TEMPLATES.includes(template);
  const isLogo = template === "brand-wall";
  const imagePlaceholder = isLogo ? "Logo image URL" : template === "team-intro" ? "Photo URL (optional)" : template === "trustpilot-review" ? "Reviewer photo URL" : "Image URL";
  return (
    <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black tracking-widest text-white/50">ROWS ({list.length})</span>
        <button onClick={() => onChange([...list, { name: "New row", price: "£9.99", desc: "", tag: "" }])} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ Add</button>
      </div>
      <p className="mb-2 text-[11px] text-white/40">{ITEM_HINTS[template] || "Rows for this template"}</p>
      <div className="space-y-2">
        {list.map((it, i) => {
          const picking = pickIndex === i;
          return (
            <div key={i} className="space-y-1.5 rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10">
              <div className="grid grid-cols-[minmax(0,1fr)_84px_96px_26px] gap-1.5">
                <input value={it.name} onChange={(e) => edit(i, "name", e.target.value)} className="inp !py-2 text-xs" placeholder="Name / label" />
                {showPrice ? (
                  <input value={it.price || ""} onChange={(e) => edit(i, "price", e.target.value)} className="inp !py-2 text-xs" placeholder="£0.00" />
                ) : (
                  <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />
                )}
                {showPrice && <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />}
                <button onClick={() => { onChange(list.filter((_, j) => j !== i)); setPickIndex(null); }} title="Remove this row" aria-label={`Remove row ${i + 1}`} className="rounded-lg bg-white/10 text-red-300">✕</button>
              </div>
              <div className="flex items-center gap-1.5">
                <input value={it.desc || ""} onChange={(e) => edit(i, "desc", e.target.value)} className="inp !py-2 min-w-0 flex-1 text-xs" placeholder="Detail / spec value" />
                {showImage && (
                  <button
                    type="button"
                    onClick={() => setPickIndex(picking ? null : i)}
                    aria-expanded={picking}
                    aria-label={`Pick an image for row ${i + 1} from the library`}
                    title="Pick from the media library"
                    className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ring-1 ${picking ? "bg-white text-black ring-white" : "bg-white/10 ring-white/15 hover:bg-white/20"}`}
                  >
                    <BrowseIcon /> Image
                  </button>
                )}
              </div>
              {showImage && (
                <div className="flex items-center gap-1.5">
                  {it.image && <Thumb url={it.image} fit={isLogo ? "contain" : "cover"} className="h-9 w-14" />}
                  <input
                    value={it.image || ""}
                    onChange={(e) => { edit(i, "image", e.target.value); setPickIndex(null); }}
                    className="inp !py-2 min-w-0 flex-1 text-xs"
                    placeholder={imagePlaceholder}
                    aria-label={`Row ${i + 1} image URL`}
                  />
                  {it.image && (
                    <button
                      type="button"
                      onClick={() => { edit(i, "image", ""); setPickIndex(null); }}
                      title="Remove this row's image"
                      aria-label={`Clear the image on row ${i + 1}`}
                      className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-red-300 ring-1 ring-white/15 hover:bg-red-500/25"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
              {/* The library opens full-width below the row — as a grid child it was
                  squeezed into a 40px column and clipped to an unreadable sliver. */}
              {showImage && picking && (
                <LibraryPicker
                  title={`ROW ${i + 1} IMAGE — MEDIA LIBRARY`}
                  assets={assets}
                  current={it.image || ""}
                  fit={isLogo ? "contain" : "cover"}
                  onClose={() => setPickIndex(null)}
                  onPick={(url) => { edit(i, "image", url); setPickIndex(null); }}
                />
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="text-xs text-white/40">No rows yet — add some above.</p>}
      </div>
    </div>
  );
}

function AssetsPanel({ assets, onReload, flash, onUse }: { assets: { id: string; name: string; url: string; type: string; source?: string }[]; onReload: () => void; flash: (m: string) => void; onUse: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; url: string; type: string; source?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isPublicAsset = (a: { id: string; source?: string }) => a.source === "public" || a.id.startsWith("public-");

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const endpoint = isPublicAsset(pendingDelete)
      ? `/api/public-assets?url=${encodeURIComponent(pendingDelete.url)}`
      : `/api/assets?id=${encodeURIComponent(pendingDelete.id)}`;
    const r = await fetch(endpoint, { method: "DELETE" }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setDeleting(false);
    setPendingDelete(null);
    if (!r || j.error) flash(j.error ? `Delete failed: ${j.error}` : "Delete failed");
    else { onReload(); flash("Asset permanently deleted"); }
  };

  const upload = async (f: File) => {
    if (busy) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) flash(j.error || `Upload failed (${r.status})`);
      else { onReload(); flash("Uploaded to library"); }
    } catch {
      flash("Upload failed — check the connection to the server");
    }
    setBusy(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="h-fit space-y-4 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
        <h3 className="font-black">Add media</h3>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-white bg-white/10" : "border-white/20 hover:border-white/50"}`}
        >
          <div className="text-3xl">⇪</div>
          <div className="mt-1 text-sm font-bold">{busy ? "Uploading…" : "Drop / click to upload"}</div>
          <div className="text-xs text-white/40">jpg · png · webp · gif · mp4 · webm · max 25 MB</div>
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }}
          />
        </label>
        <div className="space-y-2">
          <label className="lbl">Or register by URL</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Hero headphones)" className="inp" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="inp" />
          <button onClick={async () => { if (!url) return; await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name || url.slice(0, 40), url }) }); setUrl(""); setName(""); onReload(); flash("Asset registered"); }} className="w-full rounded-xl bg-white py-2.5 text-sm font-black text-black">+ Add URL</button>
        </div>
        <p className="text-xs text-white/40">Tip: click any thumbnail to copy its URL, or “Use” to drop it straight onto the scene you&apos;re editing. Keep hero images ≤ 1920px wide for the Link&apos;s memory budget.</p>
      </div>
      <div className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
        <h3 className="font-black">Library ({assets.length})</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.type === "video" ? <video src={a.url} className="h-28 w-full object-cover" muted /> : <img src={a.url} alt={a.name} className="h-28 w-full object-cover" loading="lazy" />}
              <div className="p-2.5">
                <div className="truncate text-xs font-bold">{a.name}</div>
                <div className="mt-1.5 flex gap-1.5">
                  <button onClick={() => { navigator.clipboard.writeText(a.url); flash("URL copied"); }} className="flex-1 rounded-lg bg-white/10 py-1.5 text-[11px] font-black">COPY</button>
                  <button onClick={() => onUse(a.url)} className="flex-1 rounded-lg bg-white py-1.5 text-[11px] font-black text-black">USE →</button>
                  <button onClick={() => setPendingDelete(a)} title="Delete permanently" aria-label={`Delete ${a.name} permanently`} className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-black text-red-300 hover:bg-red-500/25">🗑</button>
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && <p className="col-span-full text-sm text-white/50">Library empty — load the demo or upload images.</p>}
        </div>
      </div>
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="w-full max-w-md rounded-3xl bg-[#171717] p-6 ring-1 ring-white/15" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl">🗑️</div>
            <h4 className="mt-2 text-lg font-black">Delete “{pendingDelete.name}”?</h4>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {pendingDelete.type === "video" ? <video src={pendingDelete.url} className="mt-3 h-40 w-full rounded-2xl object-cover" muted /> : <img src={pendingDelete.url} alt={pendingDelete.name} className="mt-3 h-40 w-full rounded-2xl object-cover" />}
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              <span className="font-black text-red-300">⚠️ This will be permanently deleted</span> and cannot be undone. The file will be removed from the library{isPublicAsset(pendingDelete) ? " and from disk" : ""} — any scenes using this image will lose it.
            </p>
            <p className="mt-2 truncate text-xs text-white/40">{pendingDelete.url}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setPendingDelete(null)} disabled={deleting} className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-black disabled:opacity-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-black text-white disabled:opacity-50">{deleting ? "Deleting…" : "Delete permanently"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// keep TS happy about unused import guard
const _T: TemplateId = "retail-promo";
void _T;
