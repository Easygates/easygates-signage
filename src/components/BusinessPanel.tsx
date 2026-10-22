"use client";
/* eslint-disable @next/next/no-img-element -- admin previews and media-library thumbnails render arbitrary upload/storage URLs; next/image allowlist can't cover user content */

import { useState, type ReactNode } from "react";
import ScreenView from "@/components/ScreenView";
import type { BrandSettings } from "@/lib/brand";
import type { Scene } from "@/lib/signage";

type Asset = { id: string; name: string; url: string; type: string };

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
  draft: BrandSettings;
  onChange: <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => void;
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
  const previewScene = scenes.find((s) => s.id === previewId) ?? scenes[0];
  const images = assets.filter((a) => a.type !== "video");

  const uploadLogo = async (f: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setUploading(false);
    if (j.error) { flash(j.error); return; }
    const url = j.asset?.url || j.url;
    if (url) { onChange("logoUrl", url); onAssetsChanged(); flash("Logo uploaded — press Save to use it on the screens"); }
  };

  const uploadBackground = async (f: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setUploading(false);
    if (j.error) { flash(j.error); return; }
    const url = j.asset?.url || j.url;
    if (url) { onChange("defaultBgImageUrl", url); onAssetsChanged(); flash("Default background uploaded — press Save to use it on the screens"); }
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

        <Section title="Your business" hint={<>Type <code>{"{phone}"}</code> or <code>{"{business}"}</code> in any slide text and the screens show these details. Change them here and every slide updates.</>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="lbl">Business name</label>
              <input value={draft.businessName} onChange={(e) => onChange("businessName", e.target.value)} className="inp" placeholder="Easygates" />
            </div>
            <div>
              <label className="lbl">Phone number</label>
              <input value={draft.phone} onChange={(e) => onChange("phone", e.target.value)} className="inp" placeholder="01234 567 890" />
            </div>
          </div>
        </Section>

        <Section title="Logo" hint="PNG with a transparent background works best. Leave it empty to show the business name instead.">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex h-16 min-w-[120px] items-center justify-center rounded-2xl px-4 ring-1 ring-white/15 ${draft.logoOnWhite ? "bg-white" : "bg-black/40"}`}>
              {draft.logoUrl ? (
                <img src={draft.logoUrl} alt="Logo" className="h-10 w-auto max-w-[260px] object-contain" />
              ) : (
                <span className={`text-xs font-bold ${draft.logoOnWhite ? "text-black/50" : "text-white/50"}`}>No logo</span>
              )}
            </span>
            <label className="cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-white/90">
              {uploading ? "Uploading…" : "Upload logo"}
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); e.target.value = ""; }} />
            </label>
            {draft.logoUrl && <button onClick={() => onChange("logoUrl", "")} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20">Remove logo</button>}
          </div>
          <div className="mt-3">
            <label className="lbl">Logo address</label>
            <input value={draft.logoUrl} onChange={(e) => onChange("logoUrl", e.target.value)} className="inp" placeholder="https://… or /trade/easygates-logo.svg" />
          </div>
          {images.length > 0 && (
            <div className="mt-3">
              <label className="lbl">Or pick from your media library</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 16).map((a) => (
                  <img key={a.id} src={a.url} alt={a.name} title={a.name} onClick={() => onChange("logoUrl", a.url)} className="h-14 w-20 shrink-0 cursor-pointer rounded-lg bg-white object-contain ring-1 ring-white/20 hover:ring-white" />
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 space-y-2">
            <Check checked={draft.logoOnWhite} onChange={(v) => onChange("logoOnWhite", v)} label="Put the logo on a white badge" hint="Keeps coloured logos readable on dark slides." />
            <Check checked={draft.showName} onChange={(v) => onChange("showName", v)} label="Show the business name next to the logo" />
          </div>
        </Section>

        <Section title="Default background image" hint={<>Slides that do not have a background image of their own show this one on every screen. Leave empty to use each slide&apos;s own background.</>}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex h-16 min-w-[120px] items-center justify-center rounded-2xl px-4 ring-1 ring-white/15 bg-black/40`}>
              {draft.defaultBgImageUrl ? (
                <img src={draft.defaultBgImageUrl} alt="Default background" className="h-10 w-auto max-w-[260px] object-cover" />
              ) : (
                <span className="text-xs font-bold text-white/50">No default background</span>
              )}
            </span>
            <label className="cursor-pointer rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-white/90">
              {uploading ? "Uploading…" : "Upload background"}
              <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBackground(f); e.target.value = ""; }} />
            </label>
            {draft.defaultBgImageUrl && <button onClick={() => onChange("defaultBgImageUrl", "")} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold ring-1 ring-white/20">Remove</button>}
          </div>
          <div className="mt-3">
            <label className="lbl">Background image address</label>
            <input value={draft.defaultBgImageUrl} onChange={(e) => onChange("defaultBgImageUrl", e.target.value)} className="inp" placeholder="https://…" />
          </div>
          {images.length > 0 && (
            <div className="mt-3">
              <label className="lbl">Or pick from your media library</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 16).map((a) => (
                  <img key={a.id} src={a.url} alt={a.name} title={a.name} onClick={() => onChange("defaultBgImageUrl", a.url)} className="h-14 w-20 shrink-0 cursor-pointer rounded-lg object-cover ring-1 ring-white/20 hover:ring-white" />
                ))}
              </div>
            </div>
          )}
        </Section>

        <Section title="Screen corners">
          <div className="space-y-2">
            <Check checked={draft.showBrandBar} onChange={(v) => onChange("showBrandBar", v)} label="Show the logo in the top-left corner" />
            <Check checked={draft.showClock} onChange={(v) => onChange("showClock", v)} label="Show a clock in the top-right corner" />
          </div>
        </Section>

        <Section title="Brand colours">
          <div className="grid gap-3 sm:grid-cols-2">
            <ColorInput label="Main colour (prices, buttons, highlights)" value={draft.accentColor} onChange={(v) => onChange("accentColor", v)} />
            <ColorInput label="Background colour" value={draft.backgroundColor} onChange={(v) => onChange("backgroundColor", v)} />
          </div>
          <div className="mt-3">
            <Check checked={draft.applyColors} onChange={(v) => onChange("applyColors", v)} label="Use these colours on every slide" hint="Replaces each slide's own colours, so all screens look like one brand." />
          </div>
        </Section>

        <Section title="Scrolling ticker">
          <label className="lbl">Ticker text</label>
          <input value={draft.tickerText} onChange={(e) => onChange("tickerText", e.target.value)} className="inp" placeholder="FREE SITE SURVEYS — CALL {phone} —" />
          <div className="mt-3">
            <Check checked={draft.tickerOnAll} onChange={(v) => onChange("tickerOnAll", v)} label="Show it on every slide" hint="Otherwise it only appears on slides that don't have a ticker of their own." />
          </div>
        </Section>

        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-2xl bg-[#0a0f1f]/95 p-3 ring-1 ring-white/15 backdrop-blur">
          <button onClick={onSave} disabled={saving || !dirty || !ready} className="rounded-xl bg-green-500 px-6 py-3 text-sm font-black text-black disabled:opacity-40">
            {saving ? "Saving…" : "Save business settings"}
          </button>
          {dirty && <button onClick={onUndo} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/20">Undo changes</button>}
          <span className="text-xs text-white/50">{dirty ? "Unsaved changes — the preview shows them already." : "Saved. Screens pick up changes within 30 seconds."}</span>
        </div>
      </div>

      <div className="lg:sticky lg:top-32 lg:self-start">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black tracking-widest text-white/50">
          <span>PREVIEW</span>
          <button onClick={() => setReplay((k) => k + 1)} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/20">↻ REPLAY</button>
        </div>
        <div className="sg-stage relative overflow-hidden rounded-3xl bg-black shadow-2xl ring-1 ring-white/20">
          {previewScene && <ScreenView scene={previewScene} brand={draft} animKey={`${previewScene.id}-${replay}`} progressKey={`${previewScene.id}-${replay}`} preview />}
        </div>
        {scenes.length > 0 && (
          <div className="mt-3">
            <label className="lbl">Preview with slide</label>
            <select value={previewScene?.id ?? ""} onChange={(e) => setPreviewId(e.target.value)} className="inp bg-[#141b33]">
              {scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/[0.04] p-5 ring-1 ring-white/10">
      <h3 className="font-black">{title}</h3>
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
