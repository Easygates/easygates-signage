"use client";
/* eslint-disable @next/next/no-img-element -- admin previews and media-library thumbnails render arbitrary upload/storage URLs; next/image allowlist can't cover user content */

import { useState, type ReactNode } from "react";
import ScreenView from "@/components/ScreenView";
import {
  BUSINESS_PRESETS,
  TICKER_SIZES,
  TICKER_SIZE_IDS,
  profileSlug,
  type BrandSettings,
  type BusinessCollection,
  type BusinessProfile,
} from "@/lib/brand";
import type { Scene } from "@/lib/signage";

type Asset = { id: string; name: string; url: string; type: string };

/** Deep copy so editing a draft never mutates the saved collection. */
const clone = (c: BusinessCollection): BusinessCollection => ({
  profiles: c.profiles.map((p) => ({ ...p })),
  activeId: c.activeId,
});

export default function BusinessPanel({
  draft,
  onChange,
  dirty,
  saving,
  ready,
  onSave,
  onUndo,
  scenes,
  assets,
  onAssetsChanged,
  flash,
}: {
  draft: BusinessCollection;
  onChange: (next: BusinessCollection) => void;
  dirty: boolean;
  saving: boolean;
  ready: boolean;
  onSave: () => void;
  onUndo: () => void;
  scenes: Scene[];
  assets: Asset[];
  onAssetsChanged: () => void;
  flash: (m: string) => void;
}) {
  const [previewId, setPreviewId] = useState("");
  const [replay, setReplay] = useState(0);
  const [uploading, setUploading] = useState(false);
  const images = assets.filter((a) => a.type !== "video");

  // Which business the form on the left is editing. Follows the default until the
  // user picks another one, and recovers if that business is deleted.
  const [editingId, setEditingId] = useState(draft.activeId);
  // No effect needed: if that business has been deleted (or the list was replaced
  // by a load), fall back to the first one and let the next click correct it.
  const editing = draft.profiles.find((p) => p.id === editingId) ?? draft.profiles[0];
  const previewScene = scenes.find((s) => s.id === previewId) ?? scenes[0];

  /** Replace the business being edited (and keep the id). */
  const patch = (changes: Partial<BusinessProfile>) =>
    onChange({ ...draft, profiles: draft.profiles.map((p) => (p.id === editing.id ? { ...p, ...changes } : p)) });

  const set = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => patch({ [key]: value } as Partial<BusinessProfile>);

  const setActive = (id: string) => onChange({ ...draft, activeId: id });

  const addBusiness = () => {
    // Use the shipped presets first (the two real brands), then a blank one.
    const taken = draft.profiles.map((p) => p.id);
    const preset = BUSINESS_PRESETS[draft.profiles.length];
    const base: Omit<BusinessProfile, "id"> = preset ?? {
      ...BUSINESS_PRESETS[BUSINESS_PRESETS.length - 1],
      profileName: "New business",
      businessName: "New business",
      tagline: "",
      website: "",
      logoUrl: "",
    };
    const id = profileSlug(base.profileName, taken);
    onChange({ profiles: [...draft.profiles, { ...base, id }], activeId: draft.activeId });
    setEditingId(id);
    flash("Business added — fill in its details, then Save");
  };

  const duplicate = () => {
    const taken = draft.profiles.map((p) => p.id);
    const id = profileSlug(`${editing.profileName} copy`, taken);
    onChange({ ...draft, profiles: [...draft.profiles, { ...editing, id, profileName: `${editing.profileName} copy` }] });
    setEditingId(id);
    flash("Business duplicated — rename it, then Save");
  };

  const remove = () => {
    if (draft.profiles.length <= 1) {
      flash("At least one business is needed — screens have to show something");
      return;
    }
    if (!confirm(`Remove “${editing.profileName}”? Screens assigned to it fall back to the default business.`)) return;
    const profiles = draft.profiles.filter((p) => p.id !== editing.id);
    const activeId = draft.activeId === editing.id ? profiles[0].id : draft.activeId;
    onChange({ profiles, activeId });
    setEditingId(activeId);
    flash("Business removed — press Save to confirm");
  };

  const uploadTo = async (f: File, key: "logoUrl" | "defaultBgImageUrl", message: string) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setUploading(false);
    if (j.error) {
      flash(j.error);
      return;
    }
    const url = j.asset?.url || j.url;
    if (url) {
      set(key, url);
      onAssetsChanged();
      flash(message);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_560px]">
      <div className="min-w-0 space-y-4">
        {!ready && (
          <p className="rounded-2xl bg-amber-400/15 p-4 text-sm text-amber-200 ring-1 ring-amber-300/30">
            These settings can&apos;t be saved yet: the database has no <code>settings</code> table. Run{" "}
            <code>supabase/schema.sql</code> in the Supabase SQL Editor (safe to re-run), then reload this page.
          </p>
        )}

        {/* ── the list of businesses ── */}
        <Section
          title="Your businesses"
          hint={
            <>
              Every business keeps its own logo, phone number, colours and ticker. Pick one as the <b>default</b> for new
              screens, and assign the others to individual screens in the <b>Displays</b> tab.
            </>
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {draft.profiles.map((p) => {
              const active = p.id === draft.activeId;
              const selected = p.id === editing.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setEditingId(p.id)}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition ${selected ? "bg-white text-black ring-white" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"}`}
                >
                  <span className={`grid h-12 w-16 shrink-0 place-items-center rounded-xl ${p.logoOnWhite ? "bg-white" : "bg-black/50"} p-1`}>
                    {p.logoUrl ? (
                      <img src={p.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className={`text-[10px] font-bold ${p.logoOnWhite ? "text-black/40" : "text-white/40"}`}>no logo</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{p.profileName || "Untitled"}</span>
                    <span className={`block truncate text-[11px] ${selected ? "text-black/60" : "text-white/50"}`}>
                      {p.tagline || p.businessName || "—"}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {active && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selected ? "bg-black text-white" : "bg-green-500/20 text-green-300"}`}>
                          DEFAULT
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${selected ? "bg-black/10 text-black/70" : "bg-white/10 text-white/60"}`}>
                        {p.phone || "no phone"}
                      </span>
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="ml-auto h-8 w-2 shrink-0 rounded-full"
                    style={{ background: p.accentColor }}
                    title={p.accentColor}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={addBusiness} className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-white/90">
              + Add business
            </button>
            <button onClick={duplicate} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20">
              ⧉ Duplicate
            </button>
            {editing && editing.id !== draft.activeId && (
              <button onClick={() => setActive(editing.id)} className="rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-black">
                ★ Make default
              </button>
            )}
            {draft.profiles.length > 1 && (
              <button onClick={remove} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-red-300 ring-1 ring-white/20">
                🗑 Remove
              </button>
            )}
          </div>
        </Section>

        {editing && (
          <div className="rounded-3xl ring-1 ring-white/15">
            <div className="flex items-center gap-3 rounded-t-3xl bg-white/[0.07] px-5 py-3">
              <span className="text-sm font-black tracking-widest text-white/60">EDITING</span>
              <span className="text-lg font-black">{editing.profileName || "Untitled business"}</span>
              {editing.id === draft.activeId && (
                <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-black tracking-widest text-green-300">DEFAULT</span>
              )}
            </div>
            <div className="space-y-4 rounded-b-3xl bg-white/[0.02] p-5">
              <Section
                bare
                hint={
                  <>
                    Type <code>{"{phone}"}</code> or <code>{"{business}"}</code> in any slide text and that screen shows
                    this business&apos;s details.
                  </>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="lbl">Name in this list</label>
                    <input value={editing.profileName} onChange={(e) => patch({ profileName: e.target.value })} className="inp" placeholder="EasyGates Direct" />
                  </div>
                  <div>
                    <label className="lbl">Business name (shown on screen)</label>
                    <input value={editing.businessName} onChange={(e) => set("businessName", e.target.value)} className="inp" placeholder="EasyGates Direct" />
                  </div>
                  <div>
                    <label className="lbl">Phone number</label>
                    <input value={editing.phone} onChange={(e) => set("phone", e.target.value)} className="inp" placeholder="01234 567 890" />
                  </div>
                  <div>
                    <label className="lbl">Website</label>
                    <input value={editing.website} onChange={(e) => patch({ website: e.target.value })} className="inp" placeholder="https://…" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="lbl">Short description</label>
                    <input value={editing.tagline} onChange={(e) => patch({ tagline: e.target.value })} className="inp" placeholder="Gate automation · access control · safety" />
                  </div>
                </div>
              </Section>

              <Section title="Logo" hint="PNG with a transparent background works best. Leave it empty to show the business name instead.">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`flex h-16 min-w-[120px] items-center justify-center rounded-2xl px-4 ring-1 ring-white/15 ${editing.logoOnWhite ? "bg-white" : "bg-black/40"}`}>
                    {editing.logoUrl ? (
                      <img src={editing.logoUrl} alt="Logo" className="h-10 w-auto max-w-[260px] object-contain" />
                    ) : (
                      <span className={`text-xs font-bold ${editing.logoOnWhite ? "text-black/50" : "text-white/50"}`}>No logo</span>
                    )}
                  </span>
                  <label className="cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-white/90">
                    {uploading ? "Uploading…" : "Upload logo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadTo(f, "logoUrl", "Logo uploaded — press Save to use it on the screens");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {editing.logoUrl && (
                    <button onClick={() => set("logoUrl", "")} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20">
                      Remove logo
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <label className="lbl">Logo address</label>
                  <input value={editing.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} className="inp" placeholder="https://… or /brands/easygates-direct-logo.png" />
                </div>
                {images.length > 0 && (
                  <div className="mt-3">
                    <label className="lbl">Or pick from your media library</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.slice(0, 16).map((a) => (
                        <img
                          key={a.id}
                          src={a.url}
                          alt={a.name}
                          title={a.name}
                          onClick={() => set("logoUrl", a.url)}
                          className="h-14 w-20 shrink-0 cursor-pointer rounded-lg bg-white object-contain ring-1 ring-white/20 hover:ring-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  <Check
                    checked={editing.logoOnWhite}
                    onChange={(v) => set("logoOnWhite", v)}
                    label="Put the logo on a white badge"
                    hint="Keeps coloured logos readable on dark slides. Turn it off for white or silver logos."
                  />
                  <Check checked={editing.showName} onChange={(v) => set("showName", v)} label="Show the business name next to the logo" />
                </div>
              </Section>

              <Section title="Default background image" hint={<>Slides that do not have a background image of their own show this one on this business&apos;s screens.</>}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-16 min-w-[120px] items-center justify-center rounded-2xl bg-black/40 px-4 ring-1 ring-white/15">
                    {editing.defaultBgImageUrl ? (
                      <img src={editing.defaultBgImageUrl} alt="Default background" className="h-10 w-auto max-w-[260px] object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white/50">No default background</span>
                    )}
                  </span>
                  <label className="cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-white/90">
                    {uploading ? "Uploading…" : "Upload background"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadTo(f, "defaultBgImageUrl", "Default background uploaded — press Save to use it on the screens");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {editing.defaultBgImageUrl && (
                    <button onClick={() => set("defaultBgImageUrl", "")} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20">
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <label className="lbl">Background image address</label>
                  <input value={editing.defaultBgImageUrl} onChange={(e) => set("defaultBgImageUrl", e.target.value)} className="inp" placeholder="https://…" />
                </div>
                {images.length > 0 && (
                  <div className="mt-3">
                    <label className="lbl">Or pick from your media library</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {images.slice(0, 16).map((a) => (
                        <img
                          key={a.id}
                          src={a.url}
                          alt={a.name}
                          title={a.name}
                          onClick={() => set("defaultBgImageUrl", a.url)}
                          className="h-14 w-20 shrink-0 cursor-pointer rounded-lg object-cover ring-1 ring-white/20 hover:ring-white"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Screen corners">
                <div className="space-y-2">
                  <Check checked={editing.showBrandBar} onChange={(v) => set("showBrandBar", v)} label="Show the logo in the top-left corner" />
                  <Check checked={editing.showClock} onChange={(v) => set("showClock", v)} label="Show a clock in the top-right corner" />
                </div>
              </Section>

              <Section title="Brand colours">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorInput label="Main colour (prices, buttons, highlights)" value={editing.accentColor} onChange={(v) => set("accentColor", v)} />
                  <ColorInput label="Background colour" value={editing.backgroundColor} onChange={(v) => set("backgroundColor", v)} />
                </div>
                <div className="mt-3">
                  <Check
                    checked={editing.applyColors}
                    onChange={(v) => set("applyColors", v)}
                    label="Use these colours on every slide"
                    hint="Replaces each slide's own colours, so all screens look like one brand."
                  />
                </div>
              </Section>

              <Section title="Scrolling ticker">
                <label className="lbl">Ticker text</label>
                <input value={editing.tickerText} onChange={(e) => set("tickerText", e.target.value)} className="inp" placeholder="FREE SITE SURVEYS — CALL {phone} —" />
                <div className="mt-3">
                  <Check
                    checked={editing.tickerOnAll}
                    onChange={(v) => set("tickerOnAll", v)}
                    label="Show it on every slide"
                    hint="Otherwise it only appears on slides that don't have a ticker of their own."
                  />
                </div>
                <div className="mt-4">
                  <label className="lbl">Ticker size</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TICKER_SIZE_IDS.map((id) => {
                      const size = TICKER_SIZES[id];
                      const active = editing.tickerSize === id;
                      return (
                        <button
                          key={id}
                          onClick={() => set("tickerSize", id)}
                          aria-pressed={active}
                          title={size.blurb}
                          className={`rounded-xl p-2 text-left ring-1 ${active ? "bg-white text-black ring-white" : "bg-white/5 text-white ring-white/10 hover:bg-white/10"}`}
                        >
                          <span className="block overflow-hidden whitespace-nowrap font-bold" style={{ fontSize: Math.round(size.fontSize * 0.6), letterSpacing: `${size.tracking}em` }}>
                            Aa · {size.name}
                          </span>
                          <span className={`mt-0.5 block text-[10px] font-normal ${active ? "text-black/60" : "text-white/50"}`}>{size.blurb}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">
                    Applies to the strip at the bottom of every screen, including tickers set on individual slides. The preview on the right shows the real size.
                  </p>
                </div>
              </Section>
            </div>
          </div>
        )}

        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl bg-[#0a0f1f]/95 p-3 ring-1 ring-white/15 backdrop-blur">
          <button onClick={onSave} disabled={saving || !dirty || !ready} className="rounded-xl bg-green-500 px-6 py-3 text-sm font-black text-black disabled:opacity-40">
            {saving ? "Saving…" : "Save businesses"}
          </button>
          {dirty && <button onClick={onUndo} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/20">Undo changes</button>}
          <span className="text-xs text-white/50">
            {dirty ? "Unsaved changes — the preview shows them already." : "Saved. Screens pick up changes within 30 seconds."}
          </span>
        </div>
      </div>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black tracking-widest text-white/50">
          <span>PREVIEW · {(editing?.profileName || "").toUpperCase()}</span>
          <button onClick={() => setReplay((k) => k + 1)} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">↻ REPLAY</button>
        </div>
        <div className="sg-stage relative overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/20">
          {previewScene && editing && (
            <ScreenView scene={previewScene} brand={editing} animKey={`${previewScene.id}-${replay}-${editing.id}`} progressKey={`${previewScene.id}-${replay}-${editing.id}`} preview />
          )}
        </div>
        {editing && (
          <div className="mt-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
            <label className="lbl">Switch preview business</label>
            <div className="flex flex-wrap gap-2">
              {draft.profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setEditingId(p.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ${p.id === editing.id ? "bg-white text-black ring-white" : "bg-white/5 text-white ring-white/15 hover:bg-white/10"}`}
                >
                  {p.profileName}
                </button>
              ))}
            </div>
          </div>
        )}
        {scenes.length > 0 && (
          <div className="mt-3">
            <label className="lbl">Preview with slide</label>
            <select value={previewScene?.id ?? ""} onChange={(e) => setPreviewId(e.target.value)} className="inp bg-[#141b33]">
              {scenes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, hint, children, bare = false }: { title?: string; hint?: ReactNode; children: ReactNode; bare?: boolean }) {
  if (bare) return <div>{hint ? <p className="text-sm text-white/50">{hint}</p> : null}<div className="mt-3">{children}</div></div>;
  return (
    <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      {title && <h3 className="font-black">{title}</h3>}
      {hint && <p className="mt-1 text-sm text-white/50">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Check({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-green-500" />
      <span>
        <span className="font-bold">{label}</span>
        {hint && <span className="block text-xs text-white/50">{hint}</span>}
      </span>
    </label>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="flex items-center gap-2 rounded-xl bg-black/40 p-2 ring-1 ring-white/10">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
        <span className="font-mono text-xs text-white/70">{value}</span>
      </div>
    </div>
  );
}

export { clone as cloneBusinesses };
