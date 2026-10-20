"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ScreenView from "@/components/ScreenView";
import BusinessPanel from "@/components/BusinessPanel";
import DatabasePanel from "@/components/DatabasePanel";
import PlayerControls from "@/components/PlayerControls";
import { ANIMATION_PRESETS, DEMO_SCENES, ITEM_TEMPLATES, TEMPLATES, TRANSITIONS, buildTimeline, type Scene, type TemplateId } from "@/lib/signage";
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
  kenBurns: "zoom-in", overlayOpacity: 40, layoutVariant: "A", items: null,
});

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("scenes");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistFull[]>([]);
  const [assets, setAssets] = useState<{ id: string; name: string; url: string; type: string }[]>([]);
  const [displays, setDisplays] = useState<{ id: string; name: string; location?: string; playlistId?: string | null; pairingCode?: string; status?: string; lastSeen?: string; fullyUrl?: string; hasFully?: boolean }[]>([]);
  const [schedules, setSchedules] = useState<{ id: string; name: string; playlistId: string; displayId?: string | null; days: string; startTime: string; endTime: string; priority: number; enabled: boolean }[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Scene>(emptyScene());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [selPlaylist, setSelPlaylist] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [brand, setBrand] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandDraft, setBrandDraft] = useState<BrandSettings>(DEFAULT_BRAND);
  const [brandReady, setBrandReady] = useState(true);
  const [brandSaving, setBrandSaving] = useState(false);
  const savedBrandRef = useRef<BrandSettings>(DEFAULT_BRAND);
  const selIdRef = useRef<string | null>(null);
  const selPlRef = useRef<string | null>(null);
  selIdRef.current = selId;
  selPlRef.current = selPlaylist;

  const load = useCallback(async () => {
    const [s, p, a, d, sch, st] = await Promise.all([
      fetch("/api/scenes").then((r) => r.json()).catch(() => ({ scenes: [] })),
      fetch("/api/playlists").then((r) => r.json()).catch(() => ({ playlists: [] })),
      fetch("/api/assets").then((r) => r.json()).catch(() => ({ assets: [] })),
      fetch("/api/displays").then((r) => r.json()).catch(() => ({ displays: [] })),
      fetch("/api/schedules").then((r) => r.json()).catch(() => ({ schedules: [] })),
      fetch("/api/settings").then((r) => r.json()).catch(() => null),
    ]);
    const dbScenes: Scene[] = s.scenes?.length ? s.scenes : DEMO_SCENES;
    setScenes(dbScenes);
    setPlaylists(p.playlists || []);
    setAssets(a.assets || []);
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
    if (!selIdRef.current && dbScenes[0]) { setSelId(dbScenes[0].id); setDraft(dbScenes[0]); }
    if (!selPlRef.current && p.playlists?.[0]) setSelPlaylist(p.playlists[0].id);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t && TABS.includes(t)) {
      setTab(t);
    }
  }, []);

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

  const isDemo = selId?.startsWith("demo-") && !scenes.some((s) => s.id === selId && !(s as { _demo?: boolean })._demo);

  const save = async () => {
    setSaving(true);
    try {
      if (!draft.id || draft.id === "new" || draft.id.startsWith("demo-")) {
        const r = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: undefined }) });
        const j = await r.json();
        setSelId(j.scene.id); setDraft(j.scene); flash("Scene created — display picks it up within 30s");
      } else {
        const r = await fetch(`/api/scenes/${draft.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        const j = await r.json();
        setDraft(j.scene); flash("Published — displays refresh automatically");
      }
      setDirty(false); load();
    } catch { flash("Save failed"); }
    setSaving(false);
  };

  const remove = async () => {
    if (!draft.id || draft.id === "new" || draft.id.startsWith("demo-")) { flash("Demo scenes can't be deleted — duplicate one first"); return; }
    if (!confirm("Delete this scene?")) return;
    await fetch(`/api/scenes/${draft.id}`, { method: "DELETE" });
    setSelId(null); setDraft(emptyScene()); load(); flash("Scene deleted");
  };

  const duplicate = async () => {
    const r = await fetch("/api/scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, id: undefined, name: `${draft.name} (copy)` }) });
    const j = await r.json(); setSelId(j.scene.id); setDraft(j.scene); load(); flash("Duplicated — now editing the copy");
  };

  const seed = async (campaign: "retail" | "trade" = "retail") => {
    const r = await fetch(`/api/seed?campaign=${campaign}`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    load();
    flash(
      campaign === "trade"
        ? `Trade demo loaded (${j.created ?? "?"} new scenes, 5 screens)`
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
            <Link href="/display" target="_blank" className="rounded-full bg-red-500 px-4 py-2 hover:bg-red-400">▶ Display</Link>
            <Link href="/docs" className="rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20">Docs</Link>
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
          <div className="grid gap-5 lg:grid-cols-[300px_1fr_520px]">
            <div className="rounded-3xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-white/50">SCENES ({scenes.length})</span>
                <button onClick={() => { setSelId("new"); setDraft(emptyScene()); }} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ New</button>
              </div>
              <div className="sg-scroll max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {scenes.map((s) => (
                  <button key={s.id} onClick={() => { setSelId(s.id); setDraft(s); setDirty(false); setPreviewKey((k) => k + 1); }}
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
                <label className="lbl">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => set("template", t.id as never)} className={`rounded-2xl p-3 text-left ring-1 ${draft.template === t.id ? "bg-white text-black ring-white" : "bg-white/5 ring-white/10 hover:bg-white/10"}`}>
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
              <Field label="Image URL (or pick from Assets → click to copy)">
                <div className="flex gap-2">
                  <input value={draft.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value as never)} className="inp" placeholder="https://…" />
                  {draft.imageUrl && <button onClick={() => set("imageUrl", "" as never)} className="rounded-xl bg-white/10 px-3 text-xs font-bold">✕</button>}
                </div>
              </Field>
              <div className="grid grid-cols-4 gap-3">
                <Color label="Background from" v={draft.bgFrom} onChange={(v) => set("bgFrom", v as never)} />
                <Color label="Background to" v={draft.bgTo} onChange={(v) => set("bgTo", v as never)} />
                <Color label="Accent" v={draft.accentColor} onChange={(v) => set("accentColor", v as never)} />
                <Color label="Text" v={draft.textColor} onChange={(v) => set("textColor", v as never)} />
              </div>
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
              {ITEM_TEMPLATES.includes(draft.template) && (
                <ItemsEditor
                  items={(draft.items as Scene["items"]) || []}
                  template={draft.template}
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
              {assets.length > 0 && (
                <div className="mt-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                  <div className="mb-2 text-[11px] font-black tracking-widest text-white/50">QUICK-SET IMAGE FROM LIBRARY</div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {assets.slice(0, 12).map((a) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={a.id} src={a.url} alt="" onClick={() => set("imageUrl", a.url as never)} className="h-14 w-20 cursor-pointer rounded-lg object-cover ring-1 ring-white/20 hover:ring-white" title={a.name} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PLAYLISTS ── */}
        {tab === "playlists" && (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
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
                    <div className="flex gap-2">
                      <Link href={`/display?playlistId=${playlist.id}`} target="_blank" className="rounded-full bg-red-500 px-4 py-2 text-xs font-black">▶ Play</Link>
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
                        <input type="number" min={6} max={30} value={s._durationOverride || s.durationSec} title="Duration override"
                          onChange={async (e) => { await fetch("/api/playlist-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s._itemId, durationOverride: Number(e.target.value) }) }); load(); }}
                          className="w-16 rounded-lg bg-black/40 px-2 py-1.5 text-center text-sm font-bold ring-1 ring-white/15" />
                        <button onClick={async () => { const order = playlist.items.map((x) => x.id); const pos = order.indexOf(s._itemId!); if (pos > 0) { [order[pos - 1], order[pos]] = [order[pos], order[pos - 1]]; await fetch("/api/playlist-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId: playlist.id, order }) }); load(); } }} className="rounded-lg bg-white/10 px-2.5 py-1.5 font-black">↑</button>
                        <button onClick={async () => { const order = playlist.items.map((x) => x.id); const pos = order.indexOf(s._itemId!); if (pos < order.length - 1) { [order[pos + 1], order[pos]] = [order[pos], order[pos + 1]]; await fetch("/api/playlist-items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlistId: playlist.id, order }) }); load(); } }} className="rounded-lg bg-white/10 px-2.5 py-1.5 font-black">↓</button>
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
        {tab === "assets" && <AssetsPanel assets={assets} onReload={load} flash={flash} onUse={(url) => { set("imageUrl", url as never); setTab("scenes"); flash("Image set on current scene draft"); }} />}

        {/* ── DISPLAYS ── */}
        {tab === "displays" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
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
                    <div className="mt-3 flex gap-2 text-xs font-black">
                      <Link href={`/display?displayId=${x.id}`} target="_blank" className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-center hover:bg-red-400">▶ OPEN SCREEN</Link>
                      <button onClick={async () => { await navigator.clipboard.writeText(`${location.origin}/display?displayId=${x.id}`); flash("Screen URL copied"); }} className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20">COPY URL</button>
                      <button onClick={async () => { if (!confirm("Remove display?")) return; await fetch(`/api/displays/${x.id}`, { method: "DELETE" }); load(); }} className="rounded-xl bg-white/10 px-4 py-2.5 text-red-300 ring-1 ring-white/20">✕</button>
                    </div>
                    <PlayerControls displayId={x.id} fullyUrl={x.fullyUrl} hasFully={x.hasFully} onSaved={load} flash={flash} />
                    <div className="mt-2 text-[11px] text-white/40">Serving: {pl?.name || "—"} · Last seen: {x.lastSeen ? new Date(x.lastSeen).toLocaleString() : "never"}</div>
                  </div>
                );
              })}
              {displays.length === 0 && <p className="text-white/50">No displays — load the demo or add one.</p>}
            </div>
            <div className="h-fit rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
              <h3 className="font-black">Add a screen</h3>
              <p className="mt-1 text-sm text-white/50">Each TV gets its own URL, opened fullscreen by a player device (Fully Kiosk on an Android box, or a PC/Pi in kiosk mode).</p>
              <button onClick={async () => { const r = await fetch("/api/displays", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `Screen ${displays.length + 1}`, playlistId: selPlaylist }) }); await r.json(); load(); flash("Screen added — open its URL on the player device"); }} className="mt-4 w-full rounded-2xl bg-white px-5 py-3 text-sm font-black text-black">+ Register display</button>
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
              <h3 className="font-black">Campaign schedules <span className="text-sm font-normal text-white/50">— time windows override a display&apos;s default playlist</span></h3>
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
                  <span className="text-xs text-white/40">prio</span>
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
            assets={assets}
            onAssetsChanged={load}
            flash={flash}
          />
        )}

        {/* ── DATABASE / SUPABASE ── */}
        {tab === "database" && <DatabasePanel onFlash={flash} onSeed={seed} />}
      </div>

      <style jsx global>{`
        .lbl { display:block; font-size:11px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:6px; }
        .inp { width:100%; border-radius:12px; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.12); padding:10px 12px; font-size:14px; color:#fff; outline:none; }
        .inp:focus { border-color:#fff; }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="lbl">{label}</label>{children}</div>;
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
};

function ItemsEditor({ items, template, onChange }: { items: NonNullable<Scene["items"]>; template: TemplateId; onChange: (v: NonNullable<Scene["items"]>) => void }) {
  const list = items || [];
  const edit = (i: number, k: string, v: string) => onChange(list.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const showPrice = template === "food-menu" || template === "product-grid" || template === "price-list";
  // only these layouts draw a picture per row
  const showImage = template === "product-grid" || template === "brand-wall";
  return (
    <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black tracking-widest text-white/50">ROWS ({list.length})</span>
        <button onClick={() => onChange([...list, { name: "New row", price: "£9.99", desc: "", tag: "" }])} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">+ Add</button>
      </div>
      <p className="mb-2 text-[11px] text-white/40">{ITEM_HINTS[template] || "Rows for this template"}</p>
      <div className="space-y-2">
        {list.map((it, i) => (
          <div key={i} className="space-y-1.5 rounded-xl bg-white/[0.04] p-2 ring-1 ring-white/10">
            <div className="grid grid-cols-[1fr_84px_96px_26px] gap-1.5">
              <input value={it.name} onChange={(e) => edit(i, "name", e.target.value)} className="inp !py-2 text-xs" placeholder="Name / label" />
              {showPrice ? (
                <input value={it.price || ""} onChange={(e) => edit(i, "price", e.target.value)} className="inp !py-2 text-xs" placeholder="£0.00" />
              ) : (
                <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />
              )}
              {showPrice && <input value={it.tag || ""} onChange={(e) => edit(i, "tag", e.target.value)} className="inp !py-2 text-xs" placeholder="TAG" />}
              <button onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded-lg bg-white/10 text-red-300">✕</button>
            </div>
            <div className={`grid gap-1.5 ${showImage ? "grid-cols-[1fr_150px]" : "grid-cols-1"}`}>
              <input value={it.desc || ""} onChange={(e) => edit(i, "desc", e.target.value)} className="inp !py-2 text-xs" placeholder="Detail / spec value" />
              {showImage && <input value={it.image || ""} onChange={(e) => edit(i, "image", e.target.value)} className="inp !py-2 text-xs" placeholder={template === "brand-wall" ? "logo image URL" : "img URL"} />}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-xs text-white/40">No rows yet — add some above.</p>}
      </div>
    </div>
  );
}

function AssetsPanel({ assets, onReload, flash, onUse }: { assets: { id: string; name: string; url: string; type: string }[]; onReload: () => void; flash: (m: string) => void; onUse: (url: string) => void }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const upload = async (f: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setBusy(false);
    if (j.error) flash(j.error);
    else { onReload(); flash("Uploaded to library"); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <div className="h-fit space-y-4 rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
        <h3 className="font-black">Add media</h3>
        <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-white/20 p-6 text-center hover:border-white/50">
          <div className="text-3xl">⇪</div>
          <div className="mt-1 text-sm font-bold">{busy ? "Uploading…" : "Drop / click to upload"}</div>
          <div className="text-xs text-white/40">jpg · png · webp · gif · mp4 · webm · max 25 MB</div>
          <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
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
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && <p className="col-span-full text-sm text-white/50">Library empty — load the demo or upload images.</p>}
        </div>
      </div>
    </div>
  );
}

// keep TS happy about unused import guard
const _T: TemplateId = "retail-promo";
void _T;
