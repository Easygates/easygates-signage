"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ScreenView from "@/components/ScreenView";
import BusinessPanel from "@/components/BusinessPanel";
import DatabasePanel from "@/components/DatabasePanel";
import FailsafePanel from "@/components/FailsafePanel";
import PlayerControls from "@/components/PlayerControls";
import { ScreenBasePanel, ScreenUrl, useScreenBase } from "@/components/ScreenAddress";
import { ANIMATION_PRESETS, DEMO_SCENES, ITEM_TEMPLATES, TEMPLATES, TEMPLATE_CATEGORIES, TRANSITIONS, templateCategory, buildTimeline, valueDemoPlaylist, type Scene, type TemplateId } from "@/lib/signage";
import { DEFAULT_BRAND, normalizeBrand, type BrandSettings } from "@/lib/brand";
import { SCENE_TEXT_FIELDS, templateImageMode, templateIsMediaOnly, templateRows, templateUses, type SceneTextField } from "@/lib/templateFields";
import { THEMES, themeDef } from "@/lib/themes";

type Tab = "scenes" | "playlists" | "assets" | "displays" | "schedules" | "timeline" | "business" | "failsafe" | "database";
const TABS: Tab[] = ["scenes", "playlists", "assets", "displays", "schedules", "timeline", "business", "failsafe", "database"];

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
      // media only — nothing is drawn over the picture
      headline: "",
      subheadline: "",
      description: "",
      ctaText: "",
      imageUrl: "",
      bgImageUrl: "/ambient/ambient-aurora.jpg",
      videoUrl: "",
      kenBurns: "zoom-in",
      items: null,
    },
    flash: "Background sample loaded — pick an image or video; nothing is drawn over it",
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
  // ── Trade-counter retail (Screwfix-style) ──
  "bulk-buy": {
    fields: {
      eyebrow: "{business} · TRADE COUNTER",
      headline: "BUY MORE. PAY LESS.",
      subheadline: "Quantity breaks on the everyday kit",
      productName: "18V Combi Drill Kit",
      description: "Two batteries, a charger and a hard case.",
      originalPrice: "£149.99",
      promoPrice: "£99.99",
      discountBadge: "SAVE £50",
      ctaText: "TRADE PRICES · IN STORE NOW",
      imageUrl: "",
      items: [
        { name: "1–4", price: "£119.99", desc: "each", tag: "SAVE £30" },
        { name: "5–9", price: "£109.99", desc: "each", tag: "SAVE £40" },
        { name: "10+", price: "£99.99", desc: "each", tag: "SAVE £50" },
      ],
    },
    flash: "Bulk-buy sample loaded — put the quantity breaks in Rows and the best price in Promo price",
  },
  "shelf-edge": {
    fields: {
      eyebrow: "{business} · WEEKLY DEALS",
      headline: "PRICES CUT ACROSS THE TRADE COUNTER",
      subheadline: "Six shelf-edge deals — while stocks last",
      ctaText: "OFFERS END SUNDAY",
      imageUrl: "",
      items: [
        { name: "Product one", price: "£8.99", desc: "Cat No. 3318 · was £12.99", tag: "PACK OF 1000" },
        { name: "Product two", price: "£99.99", desc: "Cat No. 6841 · was £149.99", tag: "SAVE £50" },
        { name: "Product three", price: "£24.99", desc: "Cat No. 5527 · was £34.99", tag: "SAVE 28%" },
      ],
    },
    flash: "Shelf-edge sample loaded — each row is one white label; add a photo per row for the product shot",
  },
  "flash-sale": {
    fields: {
      eyebrow: "{business} · FLASH SALE",
      headline: "48-HOUR FLASH SALE",
      subheadline: "20% off selected lines",
      description: "Show your trade card at the counter — the discount is applied at checkout.",
      promoPrice: "20%",
      discountBadge: "OFF",
      ctaText: "ENDS SUNDAY · IN STORE",
      imageUrl: "",
      items: [
        { name: "Category one", desc: "What is included", tag: "-20%" },
        { name: "Category two", desc: "What is included", tag: "-20%" },
        { name: "Category three", desc: "What is included", tag: "-20%" },
      ],
    },
    flash: "Flash-sale sample loaded — the big number is Promo price, the word under it is the Discount badge",
  },
  "click-collect": {
    fields: {
      eyebrow: "{business} · CLICK & COLLECT",
      headline: "CLICK & COLLECT IN 1 MINUTE",
      subheadline: "Order before 6pm and collect on the way home.",
      productName: "1 MINUTE",
      description: "Everything you need, in stock at the trade counter.",
      ctaText: "ORDER ONLINE · COLLECT IN STORE",
      imageUrl: "",
      items: [
        { name: "Order online", desc: "Browse the range and pay as normal", tag: "6PM CUT-OFF" },
        { name: "We pick it", desc: "The counter team checks your order", tag: "SAME DAY" },
        { name: "Collect in store", desc: "Show your order number at the counter", tag: "1 MINUTE" },
      ],
    },
    flash: "Click & Collect sample loaded — the dial text is the Product name, the steps are Rows",
  },
  "trade-account": {
    fields: {
      eyebrow: "{business} · TRADE ACCOUNT",
      headline: "TRADE PRICES. NO HASSLE.",
      subheadline: "Open an account and buy at trade prices every day.",
      description: "Apply at the counter or online — it takes about two minutes.",
      discountBadge: "NO MINIMUM SPEND",
      ctaText: "APPLY AT THE TRADE COUNTER",
      imageUrl: "",
      items: [
        { name: "Trade pricing", desc: "Lower prices on the whole range" },
        { name: "Bulk breaks", desc: "Buy more, pay less on packs and pallets" },
        { name: "One invoice", desc: "Monthly account, one statement" },
      ],
    },
    flash: "Trade-account sample loaded — benefits go in Rows, the stamp is the Discount badge",
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
  const [sceneQuery, setSceneQuery] = useState("");
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
  // Fields the chosen template doesn't draw are hidden by default (see lib/templateFields);
  // this lets the editor reveal them anyway, e.g. while re-purposing a scene.
  const [showAllFields, setShowAllFields] = useState(false);
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
  // How this template draws the slide image, how it draws its rows and which
  // slide fields it reads — all from src/lib/templateFields.ts, the single table
  // shared with the row editor and the tests.
  const imageMode = templateImageMode(draft.template);
  // Logo templates draw the image whole, so the picker should not crop it.
  const imageIsLogo = imageMode === "logo";
  // "Background image / video": the renderer draws the media only. Headline and
  // ticker are hidden here too, because that template shows neither.
  const mediaOnly = templateIsMediaOnly(draft.template);
  // "none" = the renderer never draws the slide-level image (rows carry the pictures).
  const imageUnused = imageMode === "none";
  const rowFields = templateRows(draft.template);
  const tplUses = (f: SceneTextField) => templateUses(draft.template, f);
  const fieldVisible = (f: SceneTextField) => showAllFields || tplUses(f);
  const hiddenFieldCount = SCENE_TEXT_FIELDS.filter((f) => !tplUses(f)).length;
  /** One labelled editor field, hidden (or dimmed) when the template ignores it. */
  const sceneField = (key: SceneTextField, label: string, node: React.ReactNode) =>
    fieldVisible(key) ? (
      <div key={key} className={tplUses(key) ? undefined : "opacity-60"}>
        <label className="lbl">
          {label}
          {!tplUses(key) && <span className="ml-1 font-normal normal-case tracking-normal text-amber-300/80">· not used by this template</span>}
        </label>
        {node}
      </div>
    ) : null;

  /**
   * Upload one file to the media library and return its URL. Used by the field
   * drop targets and by the asset pickers, so "add a picture" works from
   * anywhere in the editor instead of only from the Assets tab.
   */
  const uploadToLibrary = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r || !r.ok || j.error) {
      flash(j.error || `Upload failed${r ? ` (${r.status})` : ""}`);
      return null;
    }
    const url: string = j.asset?.url || j.url || "";
    if (!url) {
      flash("Upload failed — the server returned no file address");
      return null;
    }
    flash("Uploaded to the media library");
    void load();
    return url;
  };

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

  // Load a demo campaign and go straight to the playlist it builds. The endpoint
  // creates the scenes, the playlist, the screens and a schedule; before this the
  // only feedback was a toast, so it looked like the button had done nothing.
  const seed = async (campaign: "retail" | "trade" | "value" | "corporate" | "counter" = "retail") => {
    const label = campaign === "trade" ? "Trade" : campaign === "value" ? "Value" : campaign === "corporate" ? "Corporate" : campaign === "counter" ? "Trade counter" : "Retail";
    const r = await fetch(`/api/seed?campaign=${campaign}`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.playlistId) {
      // Keep the technical detail out of the toast: the API's db-unavailable text is
      // aimed at whoever installed the CMS, not at the person clicking a demo pack.
      const reason = String(j.error || "").startsWith("db-unavailable")
        ? "the database isn't reachable — check DATABASE_URL and load supabase/schema.sql"
        : j.error || "the database isn't reachable";
      flash(`${label} demo not loaded — ${reason}`);
      return;
    }
    await load();
    setSelPlaylist(j.playlistId);
    setTab("playlists");
    flash(
      `${label} demo ready — playlist “${j.playlistName}” with ${j.scenes ?? "?"} slides` +
        (j.created ? ` (${j.created} new scene${j.created === 1 ? "" : "s"})` : "") +
        ` and ${j.displays ?? "?"} screens. Press ▶ Play to preview it.`
    );
  };

  const timeline = useMemo(() => buildTimeline(draft), [draft]);
  // Scene list filter: name, template id, product name and headline all match.
  const sceneFilter = sceneQuery.trim().toLowerCase();
  const shownScenes = sceneFilter
    ? scenes.filter((s) => [s.name, s.template, s.productName, s.headline].some((v) => (v || "").toLowerCase().includes(sceneFilter)))
    : scenes;
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
            <button onClick={() => seed("retail")} title="8 retail slides + a playlist + 2 screens, then opens the playlist" className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20 hover:bg-white/20">✨ Retail demo</button>
            <button onClick={() => seed("trade")} title="7 trade slides + a playlist + 5 screens, then opens the playlist" className="rounded-full bg-amber-400/20 px-4 py-2 text-amber-200 ring-1 ring-amber-300/40 hover:bg-amber-400/30">⚡ Trade demo</button>
            <button onClick={() => seed("value")} title="12 value-store slides + a playlist + 2 screens, then opens the playlist" className="rounded-full bg-emerald-400/20 px-4 py-2 text-emerald-200 ring-1 ring-emerald-300/40 hover:bg-emerald-400/30">💰 Value demo</button>
            <button onClick={() => seed("corporate")} title="7 corporate slides + a playlist + 2 screens, then opens the playlist" className="rounded-full bg-sky-400/20 px-4 py-2 text-sky-200 ring-1 ring-sky-300/40 hover:bg-sky-400/30">🏢 Corporate demo</button>
            <button onClick={() => seed("counter")} title="5 trade-counter slides + a playlist + 2 screens, then opens the playlist" className="rounded-full bg-red-500/20 px-4 py-2 text-red-200 ring-1 ring-red-400/40 hover:bg-red-500/30">🔧 Trade counter demo</button>
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
                <span className="text-xs font-black tracking-widest text-white/50">
                  SCENES ({shownScenes.length}{shownScenes.length !== scenes.length ? ` / ${scenes.length}` : ""})
                </span>
                <button onClick={() => { setSelId("new"); adoptDraft(emptyScene()); }} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ New</button>
              </div>
              <div className="mb-2">
                <input
                  type="search"
                  value={sceneQuery}
                  onChange={(e) => setSceneQuery(e.target.value)}
                  placeholder="Search scenes by name, template, product…"
                  aria-label="Search scenes"
                  className="inp !py-1.5 text-xs"
                />
              </div>
              <div className="sg-scroll max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {shownScenes.map((s) => (
                  <button key={s.id} onClick={() => { setSelId(s.id); adoptDraft(s); setDirty(false); setPreviewKey((k) => k + 1); }}
                    className={`w-full rounded-2xl p-3 text-left ring-1 ${selId === s.id ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black">{s.name}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${selId === s.id ? "bg-black text-white" : "bg-white/10"}`}>{s.template}</span>
                    </div>
                    <div className={`mt-0.5 truncate text-xs ${selId === s.id ? "text-black/60" : "text-white/50"}`}>{s.productName || s.headline} · {s.promoPrice || ""}</div>
                  </button>
                ))}
                {shownScenes.length === 0 && (
                  <p className="px-1 py-3 text-xs text-white/40">No scenes match “{sceneQuery}”.</p>
                )}
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
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/10">
                <span className="text-[11px] text-white/50">
                  {mediaOnly
                    ? "This template draws only its image or video — no text, logo, clock or ticker."
                    : hiddenFieldCount === 0
                      ? "Every field below is drawn by this template."
                      : `${hiddenFieldCount} field${hiddenFieldCount === 1 ? "" : "s"} hidden — this template doesn't draw ${hiddenFieldCount === 1 ? "it" : "them"}.`}
                </span>
                {hiddenFieldCount > 0 && (
                  <button
                    onClick={() => setShowAllFields((v) => !v)}
                    aria-pressed={showAllFields}
                    className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black ring-1 ring-white/15 hover:bg-white/20"
                  >
                    {showAllFields ? "Hide unused fields" : "Show unused fields"}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sceneField("eyebrow", "Eyebrow / kicker", <input value={draft.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value as never)} className="inp" />)}
                {(showAllFields || !mediaOnly) && (
                  <div className={mediaOnly ? "opacity-60" : undefined}>
                    <Field label="Headline">
                      <input value={draft.headline || ""} onChange={(e) => set("headline", e.target.value as never)} className="inp" />
                    </Field>
                    {mediaOnly && <p className="mt-1 text-[11px] text-amber-300/80">· not used by this template</p>}
                  </div>
                )}
                {sceneField("productName", "Product name", <input value={draft.productName || ""} onChange={(e) => set("productName", e.target.value as never)} className="inp" />)}
                {sceneField("subheadline", "Subheadline", <input value={draft.subheadline || ""} onChange={(e) => set("subheadline", e.target.value as never)} className="inp" />)}
              </div>
              {fieldVisible("description") && (
                <Field label="Description"><textarea value={draft.description || ""} onChange={(e) => set("description", e.target.value as never)} rows={2} className="inp" /></Field>
              )}
              {(["originalPrice", "promoPrice", "discountBadge"] as SceneTextField[]).some(fieldVisible) && (
                <div className="grid grid-cols-3 gap-3">
                  {sceneField("originalPrice", "Was price", <input value={draft.originalPrice || ""} onChange={(e) => set("originalPrice", e.target.value as never)} className="inp" />)}
                  {sceneField("promoPrice", "Promo price", <input value={draft.promoPrice || ""} onChange={(e) => set("promoPrice", e.target.value as never)} className="inp" />)}
                  {sceneField("discountBadge", "Badge", <input value={draft.discountBadge || ""} onChange={(e) => set("discountBadge", e.target.value as never)} className="inp" />)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {sceneField("ctaText", "CTA", <input value={draft.ctaText || ""} onChange={(e) => set("ctaText", e.target.value as never)} className="inp" />)}
                {(showAllFields || !mediaOnly) && (
                  <div className={mediaOnly ? "opacity-60" : undefined}>
                    <Field label="Ticker">
                      <input value={draft.tickerText || ""} onChange={(e) => set("tickerText", e.target.value as never)} className="inp" />
                    </Field>
                    {mediaOnly && <p className="mt-1 text-[11px] text-amber-300/80">· not used by this template (no ticker on ambient screens)</p>}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-white/40">Tip: type <code className="text-white/70">{"{phone}"}</code> or <code className="text-white/70">{"{business}"}</code> in any text and the screen shows the details from the <button onClick={() => setTab("business")} className="underline">Business</button> tab.</p>
              {imageUnused && !showAllFields ? (
                <p className="rounded-xl bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200/90 ring-1 ring-amber-300/25">
                  This template doesn&apos;t draw a slide image —{" "}
                  {rowFields.includes("image") ? "set a picture on each row below" : "it has no picture area"}, or add a background image.
                  {" "}<button onClick={() => setShowAllFields(true)} className="underline">Show the field anyway</button>
                </p>
              ) : (
                <div className={imageUnused ? "opacity-60" : undefined}>
                  <MediaField
                    label={imageIsLogo ? "Logo image URL (overrides the Business logo)" : "Image URL"}
                    value={draft.imageUrl || ""}
                    onChange={(v) => set("imageUrl", v as never)}
                    assets={allAssets}
                    onUpload={uploadToLibrary}
                    fit={imageIsLogo ? "contain" : "cover"}
                    hint={
                      <>
                        <p className="mt-1 text-[11px] text-white/40">Type or paste an address, press “Library” to pick one, or drop a file here to upload it.</p>
                        {imageUnused && (
                          <p className="mt-1 text-[11px] text-amber-300/90">This template doesn&apos;t draw the slide image.</p>
                        )}
                      </>
                    }
                  />
                </div>
              )}
              <MediaField
                label="Background image (full-bleed behind the slide)"
                value={draft.bgImageUrl || ""}
                onChange={(v) => set("bgImageUrl", v as never)}
                assets={allAssets}
                onUpload={uploadToLibrary}
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
              {fieldVisible("videoUrl") && (
                <div className={tplUses("videoUrl") ? undefined : "opacity-60"}>
                  <MediaField
                    label="Video URL (muted, looping hero background)"
                    value={draft.videoUrl || ""}
                    onChange={(v) => set("videoUrl", v as never)}
                    assets={allAssets}
                    onUpload={uploadToLibrary}
                    media="video"
                    placeholder="https://…/clip.mp4"
                  />
                </div>
              )}
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label className="lbl">Season / theme</label>
                  <span className="mb-1.5 text-[11px] text-white/40">{themeDef(draft.theme).decor}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((th) => {
                    const active = (draft.theme || "none") === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => set("theme", th.id as never)}
                        aria-pressed={active}
                        title={`${th.name} — ${th.blurb}`}
                        className={`flex flex-col items-center gap-1.5 rounded-xl p-2 ring-2 text-xs font-bold ${active ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}
                      >
                        {/* two-tone swatch: background gradient with the accent + second accent as dots */}
                        <span
                          className={`relative grid h-8 w-full place-items-center overflow-hidden rounded-lg ring-1 ${active ? "ring-black/20" : "ring-white/15"}`}
                          style={{ background: `linear-gradient(135deg, ${th.palette.bgFrom}, ${th.palette.bgTo})` }}
                        >
                          <span className="absolute left-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: th.palette.accent }} />
                          <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full" style={{ background: th.palette.accent2 }} />
                          <span className="text-[10px] font-black" style={{ color: th.palette.text }}>{th.id === "none" ? "—" : th.name.slice(0, 2).toUpperCase()}</span>
                        </span>
                        <span>{th.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-white/40">
                  Decorations always show. Theme colours only apply when &quot;Use brand colours on every slide&quot; is on (Business tab).
                  {" "}{themeDef(draft.theme).blurb}.
                </p>
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
              {fieldVisible("highlightColor") && (
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
                  <label className="lbl">Animation feel</label>
                  <div className="space-y-1.5">
                    {(Object.keys(ANIMATION_PRESETS) as (keyof typeof ANIMATION_PRESETS)[]).map((k) => {
                      const pr = ANIMATION_PRESETS[k];
                      return (
                        <button key={k} onClick={() => { set("animationPreset", k as never); }} className={`w-full rounded-xl px-3 py-2 text-left text-xs font-bold ring-1 ${draft.animationPreset === k ? "bg-white text-black" : "bg-white/5 ring-white/10"}`}>
                          {pr.name} — <span className="font-normal opacity-70">{pr.blurb}</span>
                          <span className="mt-0.5 block font-mono text-[10px] opacity-60">
                            {pr.baseMs} ms · {pr.staggerMs} ms stagger · enters from {pr.rise} px / {pr.scaleFrom}×
                          </span>
                        </button>
                      );
                    })}
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
                  <FocalPicker
                    value={draft.imagePosition || "center"}
                    onChange={(v) => set("imagePosition", v as never)}
                    fit={draft.imageFit || "cover"}
                    onFit={(v) => set("imageFit", v as never)}
                  />
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
                  onUpload={uploadToLibrary}
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
                    <div className={`text-xs ${selPlaylist === p.id ? "text-black/60" : "text-white/50"}`}>{p.scenes?.length || 0} scene{p.scenes?.length === 1 ? "" : "s"}</div>
                  </button>
                ))}
                {playlists.length === 0 && (
                  <p className="text-sm text-white/50">
                    No playlists yet. The demo packs in the header (Retail / Trade / Value / Corporate) build a
                    playlist, screens and a schedule, then open the playlist here.
                  </p>
                )}
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
                <span className="rounded-full bg-white/10 px-3 py-1.5">Feel: {ANIMATION_PRESETS[draft.animationPreset]?.name ?? draft.animationPreset}</span>
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
        {tab === "failsafe" && <FailsafePanel playlists={playlists} onFlash={flash} />}
        {tab === "database" && <DatabasePanel onFlash={flash} onSeed={seed} onRestored={load} />}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="lbl">{label}</label>{children}</div>;
}


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
  onUpload,
}: {
  title: string;
  assets: Asset[];
  onPick: (url: string) => void;
  current?: string;
  onClose?: () => void;
  media?: "image" | "video";
  fit?: "cover" | "contain";
  /** Optional: upload a new file and return its URL (then it is picked). */
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const q = query.trim().toLowerCase();
  const all = assets.filter((a) => (media === "video" ? a.type === "video" : a.type !== "video"));
  const items = q ? all.filter((a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q)) : all;
  const noun = media === "video" ? "video" : "image";
  const upload = async (file: File) => {
    if (!onUpload || uploading) return;
    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);
    if (url) onPick(url);
  };
  return (
    <div className="mt-2 w-full rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10" role="group" aria-label={title}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-black tracking-widest text-white/50">{title}</span>
        <span className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white/40" aria-live="polite">
            {q ? `${items.length} of ${all.length}` : all.length} {noun}{all.length === 1 ? "" : "s"}
          </span>
          {onUpload && (
            <label className={`cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-black ring-1 ${uploading ? "bg-white/10 text-white/40 ring-white/10" : "bg-white text-black ring-white hover:bg-white/90"}`}>
              {uploading ? "Uploading…" : "+ Upload"}
              <input
                type="file"
                className="hidden"
                accept={media === "video" ? "video/mp4,video/webm" : "image/*"}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(f); }}
              />
            </label>
          )}
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close the media library" className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black text-white/70 ring-1 ring-white/15 hover:bg-white/20">✕</button>
          )}
        </span>
      </div>
      {all.length > 0 && (
        <div className="mb-2 flex gap-1.5">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${noun}s by name…`}
            aria-label={`Search the media library`}
            className="inp !py-1.5 text-xs"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear the search" className="shrink-0 rounded-lg bg-white/10 px-2.5 text-xs font-black ring-1 ring-white/15 hover:bg-white/20">✕</button>
          )}
        </div>
      )}
      {all.length === 0 ? (
        <p className="text-xs text-white/50">
          No {noun}s in the library yet — {onUpload ? "use “+ Upload” above" : "upload one in the Assets tab"} and it shows up here.
        </p>
      ) : items.length === 0 ? (
        <p className="text-xs text-white/50">Nothing matches “{query}”.</p>
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

/** The nine standard focal points, in the order the 3×3 pad shows them. */
const FOCAL_POINTS: { value: string; label: string }[] = [
  { value: "left top", label: "Top left" },
  { value: "center top", label: "Top centre" },
  { value: "right top", label: "Top right" },
  { value: "left center", label: "Middle left" },
  { value: "center", label: "Centre" },
  { value: "right center", label: "Middle right" },
  { value: "left bottom", label: "Bottom left" },
  { value: "center bottom", label: "Bottom centre" },
  { value: "right bottom", label: "Bottom right" },
];

/**
 * Read a CSS object-position value back into one of FOCAL_POINTS, so a slide that
 * stores "top" or "50% 50%" still highlights the right square. Custom values like
 * "30% 60%" return null — they stay editable in the advanced box.
 */
function focalPoint(raw: string): string | null {
  const tokens = (raw || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const word = (t: string) =>
    ({ left: "left", right: "right", center: "center", centre: "center", "0%": "left", "50%": "center", "100%": "right" })[t];
  const vert = (t: string) => ({ top: "top", bottom: "bottom", center: "center", centre: "center", "0%": "top", "50%": "center", "100%": "bottom" })[t];
  if (tokens.length === 0) return "center";
  if (tokens.length === 1) {
    const v = vert(tokens[0]);
    if (tokens[0] === "center" || tokens[0] === "centre" || tokens[0] === "50%") return "center";
    if (v === "top" || v === "bottom") return `center ${v}`;
    const h = word(tokens[0]);
    return h === "left" || h === "right" ? `${h} center` : null;
  }
  const a = tokens[0];
  const b = tokens[1];
  const aVert = vert(a) && !word(a);
  const x = aVert ? word(b) : word(a);
  const y = aVert ? vert(a) : vert(b);
  if (!x || !y) return null;
  const xv = x === "center" ? "center" : x;
  const yv = y === "center" ? "center" : y;
  return xv === "center" && yv === "center" ? "center" : `${xv} ${yv}`;
}

/**
 * Focal point + fit for the slide photo (and the background image — both use
 * `imagePosition`). Replaces the old free-text box that expected CSS syntax like
 * "30% 60%" and gave no hint what the valid values were.
 */
function FocalPicker({ value, onChange, fit, onFit }: { value: string; onChange: (v: string) => void; fit: string; onFit: (v: string) => void }) {
  const [advanced, setAdvanced] = useState(false);
  const active = focalPoint(value);
  return (
    <div>
      <label className="lbl">Image position &amp; fit</label>
      <div className="flex items-start gap-3">
        <div className="grid shrink-0 grid-cols-3 gap-1 rounded-xl bg-black/40 p-1.5 ring-1 ring-white/10" role="radiogroup" aria-label="Image focal point">
          {FOCAL_POINTS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={active === p.value}
              aria-label={p.label}
              title={p.label}
              onClick={() => onChange(p.value)}
              className={`grid h-6 w-6 place-items-center rounded-md ring-1 transition ${active === p.value ? "bg-white ring-white" : "bg-white/10 ring-white/15 hover:bg-white/25"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active === p.value ? "bg-black" : "bg-white/50"}`} />
            </button>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onFit("cover")}
              aria-pressed={fit !== "contain"}
              title="Fill the area — the picture is cropped at the edges"
              className={`rounded-lg px-2.5 py-1 text-[11px] font-black ring-1 ${fit !== "contain" ? "bg-white text-black ring-white" : "bg-white/10 ring-white/15 hover:bg-white/20"}`}
            >
              Fill area
            </button>
            <button
              type="button"
              onClick={() => onFit("contain")}
              aria-pressed={fit === "contain"}
              title="Show the whole picture — nothing is cropped"
              className={`rounded-lg px-2.5 py-1 text-[11px] font-black ring-1 ${fit === "contain" ? "bg-white text-black ring-white" : "bg-white/10 ring-white/15 hover:bg-white/20"}`}
            >
              Show whole
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { onChange("center"); onFit("cover"); }} className="text-[11px] text-white/40 underline hover:text-white/70">
              Reset
            </button>
            <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="text-[11px] text-white/40 underline hover:text-white/70">
              {advanced ? "Hide custom value" : "Custom value"}
            </button>
          </div>
          {advanced && (
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="inp !py-1.5 text-xs"
              placeholder="center · top · 30% 60%"
              aria-label="Custom image position (CSS object-position)"
            />
          )}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-white/40">Which part of the photo stays in view. Applies to the slide photo and the background image.</p>
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
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  assets: Asset[];
  media?: "image" | "video";
  fit?: "cover" | "contain";
  placeholder?: string;
  hint?: React.ReactNode;
  /** Optional: drop a file on the field to upload it and use the result. */
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const broken = value !== "" && failed === value;
  const isVideo = media === "video";
  const drop = async (file: File | undefined) => {
    if (!file || !onUpload || uploading) return;
    setUploading(true);
    const url = await onUpload(file);
    setUploading(false);
    if (url) onChange(url);
  };
  return (
    <div
      onDragOver={onUpload ? (e) => { e.preventDefault(); setDragging(true); } : undefined}
      onDragLeave={onUpload ? () => setDragging(false) : undefined}
      onDrop={onUpload ? (e) => { e.preventDefault(); setDragging(false); void drop(e.dataTransfer.files?.[0]); } : undefined}
      className={dragging ? "rounded-xl ring-2 ring-white/70" : undefined}
    >
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
          {uploading ? "Uploading…" : <><BrowseIcon /> Library</>}
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
      {dragging && <p className="mt-1 text-[11px] font-bold text-white/80">Drop to upload and use this file…</p>}
      {open && (
        <LibraryPicker
          title={`${label.toUpperCase()} — MEDIA LIBRARY`}
          assets={assets}
          current={value}
          media={media}
          fit={fit}
          onUpload={onUpload}
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
  "bulk-buy": "Up to 4 quantity breaks — name = quantity band (1–4 / 5–9 / 10+), price = price each, detail = unit note, tag = saving. The last row is highlighted",
  "shelf-edge": "Up to 6 shelf labels — name / price / detail (cat no. + was price) / tag (pack size) + optional product photo",
  "flash-sale": "Up to 4 categories in the sale — name / detail / tag (the % off chip)",
  "click-collect": "Up to 4 collection steps — name / detail / tag (the timing chip, e.g. 1 MINUTE)",
  "trade-account": "Up to 5 account benefits — name / detail + optional tag chip",
};

function ItemsEditor({ items, template, assets, onChange, onUpload }: { items: NonNullable<Scene["items"]>; template: TemplateId; assets: Asset[]; onChange: (v: NonNullable<Scene["items"]>) => void; onUpload?: (file: File) => Promise<string | null> }) {
  const list = items || [];
  const [pickIndex, setPickIndex] = useState<number | null>(null);
  const edit = (i: number, k: string, v: string) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  // Which columns this template draws comes from lib/templateFields, so adding a
  // template can no longer leave the editor showing the wrong inputs.
  const rows = templateRows(template);
  const showPrice = rows.includes("price");
  const showTag = rows.includes("tag");
  const showDesc = rows.includes("desc");
  const showImage = rows.includes("image");
  const isLogo = template === "brand-wall";
  const imagePlaceholder = isLogo ? "Logo image URL" : template === "team-intro" ? "Photo URL (optional)" : template === "trustpilot-review" ? "Reviewer photo URL" : "Image URL";
  return (
    <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black tracking-widest text-white/50">ROWS ({list.length})</span>
        <button onClick={() => onChange([...list, { name: "New row", price: "£9.99", desc: "", tag: "" }])} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ Add</button>
      </div>
      <p className="mb-1 text-[11px] text-white/40">{ITEM_HINTS[template] || "Rows for this template"}</p>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/25">Columns: {rows.length ? rows.join(" · ") : "none"}</p>
      <div className="space-y-2">
        {list.map((it, i) => {
          const picking = pickIndex === i;
          return (
            <div key={i} className="space-y-1.5 rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10">
              <div className="grid grid-cols-[minmax(0,1fr)_84px_96px_26px] gap-1.5">
                <input value={it.name} onChange={(e) => edit(i, "name", e.target.value)} className="inp !py-2 text-xs" placeholder="Name / label" />
                {showPrice ? (
                  <input value={it.price || ""} onChange={(e) => edit(i, "price", e.target.value)} className="inp !py-2 text-xs" placeholder="£0.00" />
                ) : showTag ? (
                  <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />
                ) : (
                  <span />
                )}
                {showPrice && showTag && <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />}
                <button onClick={() => { onChange(list.filter((_, j) => j !== i)); setPickIndex(null); }} title="Remove this row" aria-label={`Remove row ${i + 1}`} className="rounded-lg bg-white/10 text-red-300">✕</button>
              </div>
              <div className="flex items-center gap-1.5">
                {showDesc && (
                  <input value={it.desc || ""} onChange={(e) => edit(i, "desc", e.target.value)} className="inp !py-2 min-w-0 flex-1 text-xs" placeholder="Detail / spec value" />
                )}
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
                  onUpload={onUpload}
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
