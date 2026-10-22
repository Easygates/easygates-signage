/* eslint-disable @next/next/no-img-element -- signage renders arbitrary user/remote URLs (uploads, Supabase storage, external media) that can't be pre-allowlisted for next/image; <img> is intentional here */
import type { CSSProperties } from "react";
import type { Scene } from "@/lib/signage";
import { ANIMATION_PRESETS } from "@/lib/signage";

// Shared building blocks for slide templates. Template components receive
// { scene, d } where `d` is the per-scene animation timing (see delays()).

export function delays(scene: Scene) {
  const preset = ANIMATION_PRESETS[scene.animationPreset] ?? ANIMATION_PRESETS.smooth;
  const s = scene.staggerMs || preset.staggerMs;
  const b = preset.baseMs;
  const style = (i: number, extra = 0): CSSProperties => ({
    animationDelay: `${150 + i * s + extra}ms`,
    animationDuration: `${b}ms`,
  });
  return { s, b, style };
}

export type Delays = ReturnType<typeof delays>;

export interface TemplateProps {
  scene: Scene;
  d: Delays;
}

export function kbClass(kb: string) {
  if (kb === "zoom-out") return "sg-kb-zoom-out";
  if (kb === "pan-left") return "sg-kb-pan-left";
  if (kb === "pan-right") return "sg-kb-pan-right";
  if (kb === "static") return "";
  return "sg-kb-zoom-in";
}

/** Headline broken into sentence lines as React elements (never injected as HTML). */
export function HeadlineLines({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  // New line only after a full stop that is followed by a space ("SMASHED. STACKED."); nothing is
  // added or removed, so "£9.95" and "BURGERS & FRIES" stay exactly as typed. It is a span so the
  // .sg-mask > span reveal animation still applies.
  const lines = (text || "").replace(/\.\s+/g, ".\n").split("\n").filter(Boolean);
  return (
    <span className={className || undefined} style={style}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </span>
  );
}

/** Hero media: a muted looping video takes precedence over an image. */
export function HeroMedia({
  scene,
  className = "",
  imageOnly = false,
}: {
  scene: Scene;
  className?: string;
  imageOnly?: boolean;
}) {
  const src = imageOnly ? undefined : scene.videoUrl;
  const alt = scene.productName || scene.headline || "promotion";
  // "contain" = show the whole picture (nothing cropped); anything else fills the box.
  const fit = scene.imageFit === "contain" ? "contain" : "cover";
  if (src) {
    return (
      <video
        src={src}
        aria-label={alt}
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
        style={{ objectPosition: scene.imagePosition || "center" }}
        autoPlay
        muted
        loop
        playsInline
        draggable={false}
      />
    );
  }
  if (scene.imageUrl) {
    return (
      <img
        src={scene.imageUrl}
        alt={alt}
        className={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
        style={{ objectPosition: scene.imagePosition || "center" }}
        draggable={false}
      />
    );
  }
  return null;
}

export function Eyebrow({ scene, d }: { scene: Scene; d: ReturnType<typeof delays> }) {
  if (!scene.eyebrow) return null;
  return (
    <div className="sg-anim sg-fade-down flex items-center gap-3" style={d.style(0)}>
      <span className="inline-block h-[10px] w-[42px] rounded-full" style={{ background: scene.accentColor }} />
      <span className="text-[20px] font-bold tracking-[0.28em] uppercase" style={{ color: scene.accentColor }}>
        {scene.eyebrow}
      </span>
    </div>
  );
}

export function PriceBlock({ scene, d, light = false }: { scene: Scene; d: ReturnType<typeof delays>; light?: boolean }) {
  if (!scene.promoPrice && !scene.originalPrice) return null;
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      {scene.originalPrice && (
        <div className="sg-anim sg-fade relative" style={d.style(2)}>
          <span className="text-[30px] font-bold line-through decoration-[3px]" style={{ color: light ? "#7a5a3a" : scene.mutedColor }}>
            {scene.originalPrice}
          </span>
          <span className="absolute left-0 top-1/2 h-[3px] w-full origin-left" style={{ background: scene.accentColor, animation: "sg-strike 0.6s 0.9s var(--sg-ease) both" }} />
          <span className="ml-2 text-[20px] font-bold tracking-widest uppercase opacity-70">was</span>
        </div>
      )}
      {scene.promoPrice && (
        <div className="sg-anim sg-price" style={{ ...d.style(3), animationDuration: "650ms" }}>
          <span className="sg-display text-[99px]" style={{ color: scene.accentColor, textShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            {scene.promoPrice}
          </span>
        </div>
      )}
      {scene.discountBadge && (
        <div className="sg-anim sg-pop pb-3" style={{ ...d.style(4), animationDuration: "600ms" }}>
          <span className="relative inline-flex items-center rounded-2xl px-5 py-3 text-[26px] font-black tracking-tight text-white shadow-2xl" style={{ background: scene.accentColor }}>
            <span className="absolute inset-0 rounded-2xl" style={{ border: "2px solid #ffffff66" }} />
            {scene.discountBadge}
          </span>
        </div>
      )}
    </div>
  );
}

export function Cta({ scene, d }: { scene: Scene; d: ReturnType<typeof delays> }) {
  if (!scene.ctaText) return null;
  return (
    <div className="sg-anim sg-fade-up" style={d.style(5)}>
      <span className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-[18px] font-black tracking-wide text-black shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: scene.accentColor }} />
        {scene.ctaText}
      </span>
    </div>
  );
}

export function ProductImage({
  scene,
  d,
  className = "",
  badge = true,
}: {
  scene: Scene;
  d: ReturnType<typeof delays>;
  className?: string;
  badge?: boolean;
}) {
  if (!scene.imageUrl) return null;
  return (
    <div className={`sg-anim sg-scale-in relative ${className}`} style={d.style(1, 60)}>
      <div className={`relative overflow-hidden rounded-[28px] shadow-[0_40px_90px_rgba(0,0,0,0.5)] ring-1 ring-white/20 ${kbClass(scene.kenBurns)}`}>
        <img
          src={scene.imageUrl}
          alt={scene.productName || scene.headline || "promotion"}
          className={`h-full w-full ${scene.imageFit === "contain" ? "object-contain" : "object-cover"}`}
          style={{ objectPosition: scene.imagePosition || "center" }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 55%, rgba(0,0,0,${(scene.overlayOpacity ?? 40) / 160}) 100%)` }} />
      </div>
      {badge && scene.discountBadge && (
        <div className="sg-anim sg-pop absolute -left-5 -top-5" style={d.style(4, 150)}>
          <div className="relative grid h-28 w-28 place-items-center rounded-full text-xl font-black text-white shadow-2xl" style={{ background: scene.accentColor }}>
            <span className="absolute inset-0 rounded-full" style={{ border: "3px dashed #ffffffaa", animation: "sg-spin-slow 14s linear infinite" }} />
            {scene.discountBadge}
          </div>
        </div>
      )}
    </div>
  );
}
