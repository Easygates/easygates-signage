"use client";

import type { CSSProperties } from "react";
import type { Scene } from "@/lib/signage";
import { ANIMATION_PRESETS } from "@/lib/signage";

interface Props {
  scene: Scene;
  reducedMotion?: boolean;
  /** unique key seed so animations restart per scene */
  animKey?: string | number;
  /** compact mode for admin thumbnails */
  mini?: boolean;
}

function delays(scene: Scene) {
  const preset = ANIMATION_PRESETS[scene.animationPreset] ?? ANIMATION_PRESETS.smooth;
  const s = scene.staggerMs || preset.staggerMs;
  const b = preset.baseMs;
  const style = (i: number, extra = 0): CSSProperties => ({
    animationDelay: `${150 + i * s + extra}ms`,
    animationDuration: `${b}ms`,
  });
  return { s, b, style };
}

function kbClass(kb: string) {
  if (kb === "zoom-out") return "sg-kb-zoom-out";
  if (kb === "pan-left") return "sg-kb-pan-left";
  if (kb === "pan-right") return "sg-kb-pan-right";
  if (kb === "static") return "";
  return "sg-kb-zoom-in";
}

function BgDecor({ scene }: { scene: Scene }) {
  const bg = `linear-gradient(${scene.bgAngle}deg, ${scene.bgFrom}, ${scene.bgTo})`;
  return (
    <div className="absolute inset-0" style={{ background: bg }}>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `radial-gradient(60% 50% at 15% 10%, ${scene.accentColor}55 0%, transparent 60%), radial-gradient(50% 45% at 90% 85%, #ffffff22 0%, transparent 60%)`,
          backgroundSize: "200% 200%",
          animation: "sg-pan-bg 14s ease-in-out infinite",
        }}
      />
      {/* geometric accents */}
      <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full opacity-25 blur-2xl" style={{ background: scene.accentColor, animation: "sg-blob 9s ease-in-out infinite" }} />
      <div className="absolute -left-28 bottom-[-120px] h-[380px] w-[380px] rounded-full bg-white/10 blur-2xl" style={{ animation: "sg-blob 11s ease-in-out infinite" }} />
      <div className="absolute right-[8%] top-[12%] hidden h-24 w-24 rotate-12 border-[6px] opacity-30 lg:block" style={{ borderColor: scene.accentColor }} />
      <div className="absolute bottom-[10%] left-[46%] hidden h-4 w-40 rounded-full opacity-40 lg:block" style={{ background: scene.accentColor }} />
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(70% 70% at 50% 40%, black, transparent)" }}
      />
    </div>
  );
}

function Eyebrow({ scene, d }: { scene: Scene; d: ReturnType<typeof delays> }) {
  if (!scene.eyebrow) return null;
  return (
    <div className="sg-anim sg-fade-down flex items-center gap-3" style={d.style(0)}>
      <span className="inline-block h-[10px] w-[42px] rounded-full" style={{ background: scene.accentColor }} />
      <span className="text-[clamp(0.7rem,1.4vw,1.05rem)] font-bold tracking-[0.28em] uppercase" style={{ color: scene.accentColor }}>
        {scene.eyebrow}
      </span>
    </div>
  );
}

function PriceBlock({ scene, d, light = false }: { scene: Scene; d: ReturnType<typeof delays>; light?: boolean }) {
  if (!scene.promoPrice && !scene.originalPrice) return null;
  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
      {scene.originalPrice && (
        <div className="sg-anim sg-fade relative" style={d.style(2)}>
          <span className="text-[clamp(1.1rem,2.2vw,1.9rem)] font-bold line-through decoration-[3px]" style={{ color: light ? "#7a5a3a" : scene.mutedColor }}>
            {scene.originalPrice}
          </span>
          <span className="absolute left-0 top-1/2 h-[3px] w-full origin-left" style={{ background: scene.accentColor, animation: "sg-strike 0.6s 0.9s var(--sg-ease) both" }} />
          <span className="ml-2 text-[0.8rem] font-bold tracking-widest uppercase opacity-70">was</span>
        </div>
      )}
      {scene.promoPrice && (
        <div className="sg-anim sg-price" style={{ ...d.style(3), animationDuration: "650ms" }}>
          <span className="sg-display text-[clamp(3rem,7vw,6.2rem)]" style={{ color: scene.accentColor, textShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            {scene.promoPrice}
          </span>
        </div>
      )}
      {scene.discountBadge && (
        <div className="sg-anim sg-pop pb-3" style={{ ...d.style(4), animationDuration: "600ms" }}>
          <span className="relative inline-flex items-center rounded-2xl px-5 py-3 text-[clamp(1rem,2vw,1.6rem)] font-black tracking-tight text-white shadow-2xl" style={{ background: scene.accentColor }}>
            <span className="absolute inset-0 rounded-2xl" style={{ border: "2px solid #ffffff66" }} />
            {scene.discountBadge}
          </span>
        </div>
      )}
    </div>
  );
}

function Cta({ scene, d }: { scene: Scene; d: ReturnType<typeof delays> }) {
  if (!scene.ctaText) return null;
  return (
    <div className="sg-anim sg-fade-up" style={d.style(5)}>
      <span className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-[clamp(0.85rem,1.5vw,1.15rem)] font-black tracking-wide text-black shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: scene.accentColor }} />
        {scene.ctaText}
      </span>
    </div>
  );
}

function ProductImage({
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={scene.imageUrl}
          alt={scene.productName || scene.headline || "promotion"}
          className="h-full w-full object-cover"
          style={{ objectPosition: scene.imagePosition || "center" }}
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 55%, rgba(0,0,0,${(scene.overlayOpacity ?? 40) / 160}) 100%)` }} />
      </div>
      {badge && scene.discountBadge && (
        <div className="sg-anim sg-pop absolute -left-5 -top-5" style={d.style(4, 150)}>
          <div className="relative grid h-24 w-24 place-items-center rounded-full text-xl font-black text-white shadow-2xl lg:h-28 lg:w-28" style={{ background: scene.accentColor }}>
            <span className="absolute inset-0 rounded-full" style={{ border: "3px dashed #ffffffaa", animation: "sg-spin-slow 14s linear infinite" }} />
            {scene.discountBadge}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SceneRenderer({ scene, reducedMotion, animKey, mini }: Props) {
  const d = delays(scene);
  const t = scene.template;
  const fg = { color: scene.textColor };
  const scale = mini ? "pointer-events-none select-none" : "";

  return (
    <div key={String(animKey ?? scene.id)} className={`sg-play ${reducedMotion ? "sg-reduced" : ""} absolute inset-0 overflow-hidden ${scale}`} style={fg}>
      <BgDecor scene={scene} />

      {/* ═══ 1 · RETAIL PROMO ═══ */}
      {t === "retail-promo" && (
        <div className="relative z-10 mx-auto grid h-full max-w-[1600px] grid-cols-1 items-center gap-8 px-[5%] py-[3%] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Eyebrow scene={scene} d={d} />
            <div className="sg-mask">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(2.6rem,6.5vw,5.6rem)]">
                {scene.productName || scene.headline}
              </span>
            </div>
            <div className="sg-anim sg-fade-up text-[clamp(1.6rem,3vw,2.7rem)] font-extrabold opacity-95" style={d.style(2)}>
              {scene.headline}
            </div>
            <PriceBlock scene={scene} d={d} />
            {scene.description && (
              <p className="sg-anim sg-fade-up max-w-xl text-[clamp(0.95rem,1.6vw,1.25rem)] leading-relaxed" style={{ ...d.style(5), color: scene.mutedColor }}>
                {scene.description}
              </p>
            )}
            <Cta scene={scene} d={d} />
          </div>
          <ProductImage scene={scene} d={d} className="mx-auto w-full max-w-[640px]" badge={false} />
        </div>
      )}

      {/* ═══ 2 · FOOD MENU ═══ */}
      {t === "food-menu" && (
        <div className="relative z-10 mx-auto grid h-full max-w-[1700px] grid-cols-1 gap-6 px-[4%] py-[2.5%] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-0 flex-col justify-center gap-4">
            <Eyebrow scene={scene} d={d} />
            <div className="sg-mask">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(2.4rem,5.5vw,4.8rem)]" dangerouslySetInnerHTML={{ __html: (scene.headline || "").replace(".", ".<br/>") }} />
            </div>
            <div className={`relative mt-2 overflow-hidden rounded-[24px] ring-1 ring-white/20 ${kbClass(scene.kenBurns)} sg-anim sg-scale-in`} style={d.style(1)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {scene.imageUrl && <img src={scene.imageUrl} alt="featured dish" className="h-[30vh] w-full object-cover lg:h-[38vh]" draggable={false} />}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="rounded-full px-4 py-2 text-sm font-black text-black" style={{ background: scene.accentColor }}>★ FEATURED</span>
                {scene.ctaText && <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white backdrop-blur">{scene.ctaText}</span>}
              </div>
            </div>
          </div>
          <div className="flex min-h-0 flex-col justify-center rounded-[24px] bg-black/35 p-[3%] backdrop-blur-sm ring-1 ring-white/15">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black tracking-[0.25em] opacity-80">MENU</span>
              <span className="rounded-full px-3 py-1 text-xs font-black text-black" style={{ background: scene.accentColor }}>TAP TO ORDER · KIOSK 04</span>
            </div>
            <div className="space-y-2.5 overflow-hidden">
              {(scene.items || []).slice(0, 5).map((it, i) => (
                <div key={i} className={`sg-anim ${i % 2 ? "sg-slide-l" : "sg-slide-r"} flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ${it.tag === "FEATURED" ? "" : "bg-white/[0.06]"}`} style={{ ...d.style(2 + i), ...(it.tag === "FEATURED" ? { background: `${scene.accentColor}26`, border: `2px solid ${scene.accentColor}` } : {}) }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[clamp(1rem,1.9vw,1.5rem)] font-extrabold">{it.name}</span>
                      {it.tag && <span className="rounded-md px-2 py-0.5 text-[0.7rem] font-black text-black" style={{ background: scene.accentColor }}>{it.tag}</span>}
                    </div>
                    {it.desc && <div className="truncate text-sm opacity-70">{it.desc}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full opacity-40 bg-white" />
                    <span className="text-[clamp(1.2rem,2.2vw,1.9rem)] font-black" style={{ color: scene.accentColor }}>{it.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 3 · PRODUCT SHOWCASE ═══ */}
      {t === "product-showcase" && (
        <div className="relative z-10 h-full">
          <div className={`absolute inset-0 ${kbClass(scene.kenBurns)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {scene.imageUrl && <img src={scene.imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />}
          </div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(100deg, ${scene.bgFrom} 20%, transparent 60%), linear-gradient(0deg, ${scene.bgFrom} 5%, transparent 55%)`, opacity: (scene.overlayOpacity ?? 45) / 60 + 0.35 }} />
          <div className="relative z-10 flex h-full max-w-[1500px] flex-col justify-end px-[5%] pb-[4%]">
            <Eyebrow scene={scene} d={d} />
            <div className="sg-mask mt-3">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(3rem,8vw,7.5rem)]">{scene.headline}</span>
            </div>
            <div className="sg-anim sg-fade-up mt-2 flex flex-wrap items-center gap-4" style={d.style(2)}>
              <span className="text-[clamp(1.3rem,2.6vw,2.2rem)] font-bold">{scene.productName}</span>
              {scene.originalPrice && <span className="text-xl font-bold line-through opacity-60">{scene.originalPrice}</span>}
              {scene.promoPrice && <span className="rounded-xl px-4 py-1.5 text-2xl font-black text-black" style={{ background: scene.accentColor }}>{scene.promoPrice}</span>}
              {scene.discountBadge && <span className="sg-anim sg-pop rounded-full border-2 border-white/60 px-4 py-1.5 text-sm font-black tracking-widest" style={d.style(4)}>{scene.discountBadge}</span>}
            </div>
            {scene.description && <p className="sg-anim sg-fade-up mt-3 max-w-2xl text-[clamp(1rem,1.7vw,1.3rem)]" style={{ ...d.style(4), color: scene.mutedColor }}>{scene.description}</p>}
            <div className="sg-anim sg-fade-up mt-4 flex flex-wrap gap-2.5" style={d.style(5)}>
              {["AMOLED DISPLAY", "14-DAY BATTERY", "5ATM WATERPROOF", "BT 5.3"].map((c) => (
                <span key={c} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold tracking-widest ring-1 ring-white/25 backdrop-blur">{c}</span>
              ))}
              {scene.ctaText && <span className="rounded-full px-5 py-2 text-xs font-black tracking-widest text-black" style={{ background: scene.accentColor }}>{scene.ctaText}</span>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 4 · PRODUCT GRID ═══ */}
      {t === "product-grid" && (
        <div className="relative z-10 mx-auto flex h-full max-w-[1700px] flex-col justify-center px-[4%] py-[2.5%]">
          <div className="mb-4 text-center">
            <div className="sg-anim sg-fade-down mb-2 text-[clamp(0.7rem,1.3vw,1rem)] font-bold tracking-[0.3em]" style={{ ...d.style(0), color: scene.accentColor }}>{scene.eyebrow}</div>
            <div className="sg-mask">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(2.4rem,5.5vw,4.6rem)]">{scene.headline}</span>
            </div>
            {scene.subheadline && <div className="sg-anim sg-fade mt-1 text-lg opacity-80" style={d.style(2)}>{scene.subheadline}</div>}
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(scene.items || []).slice(0, 4).map((it, i) => (
              <div key={i} className="sg-anim sg-scale-in overflow-hidden rounded-[22px] bg-white/[0.07] ring-1 ring-white/15 backdrop-blur" style={d.style(2 + i)}>
                <div className="relative h-[22vh] overflow-hidden lg:h-[30vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" draggable={false} />}
                  {it.tag && <span className="absolute left-3 top-3 rounded-lg px-3 py-1 text-sm font-black text-white shadow-lg" style={{ background: scene.accentColor }}>{it.tag}</span>}
                </div>
                <div className="p-4">
                  <div className="truncate text-[clamp(1rem,1.8vw,1.35rem)] font-extrabold">{it.name}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[clamp(1.3rem,2.4vw,2rem)] font-black" style={{ color: scene.accentColor }}>{it.price}</span>
                    {it.desc && <span className="text-sm line-through opacity-60">{it.desc}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {scene.ctaText && (
            <div className="sg-anim sg-fade-up mt-4 text-center" style={d.style(6)}>
              <span className="inline-block rounded-full px-8 py-3 font-black tracking-widest text-black" style={{ background: scene.accentColor }}>{scene.ctaText}</span>
            </div>
          )}
        </div>
      )}

      {/* ═══ 5 · ANNOUNCEMENT ═══ */}
      {t === "announcement" && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-[6%] text-center">
          <div className="sg-anim sg-scale-in mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-4xl shadow-2xl" style={{ ...d.style(0), background: scene.accentColor }}>◷</div>
          <div className="sg-anim sg-fade-down text-[clamp(0.8rem,1.5vw,1.1rem)] font-bold tracking-[0.35em]" style={{ ...d.style(1), color: scene.accentColor }}>{scene.eyebrow}</div>
          <div className="sg-mask mt-4 max-w-6xl">
            <span style={{ animationDelay: `${250 + d.s}ms` }} className="sg-display text-[clamp(2.8rem,7.5vw,6.8rem)]">{scene.headline}</span>
          </div>
          {scene.subheadline && <p className="sg-anim sg-fade-up mt-5 max-w-3xl text-[clamp(1.05rem,2vw,1.6rem)] leading-relaxed" style={{ ...d.style(3), color: scene.mutedColor }}>{scene.subheadline}</p>}
          {scene.ctaText && (
            <div className="sg-anim sg-pop mt-7" style={d.style(4)}>
              <span className="inline-block rounded-2xl px-8 py-4 text-lg font-black tracking-wide text-black shadow-2xl" style={{ background: scene.accentColor }}>{scene.ctaText}</span>
            </div>
          )}
          {scene.imageUrl && (
            <div className="sg-anim sg-fade mt-6 hidden w-full max-w-3xl overflow-hidden rounded-2xl opacity-80 ring-1 ring-white/20 lg:block" style={d.style(5)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scene.imageUrl} alt="" className="h-36 w-full object-cover" draggable={false} />
            </div>
          )}
        </div>
      )}

      {/* ═══ 6 · FULLSCREEN CAMPAIGN ═══ */}
      {t === "fullscreen-campaign" && (
        <div className="relative z-10 h-full">
          <div className={`absolute inset-0 ${kbClass(scene.kenBurns)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {scene.imageUrl && <img src={scene.imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />}
          </div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(200deg, transparent 30%, ${scene.bgFrom} 92%), linear-gradient(90deg, ${scene.bgFrom} 0%, transparent 65%)`, opacity: 0.92 }} />
          <div className="sg-anim sg-fade pointer-events-none absolute right-[2%] top-[6%] hidden select-none xl:block" style={d.style(0)}>
            <span className="sg-outline sg-display text-[9rem] opacity-30">NOIR</span>
          </div>
          <div className="relative z-10 flex h-full max-w-[1500px] flex-col justify-center px-[5%]">
            <Eyebrow scene={scene} d={d} />
            <div className="sg-mask mt-2">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(3.4rem,9vw,8.5rem)]" >{scene.headline}</span>
            </div>
            <div className="sg-anim sg-slide-r mt-2 text-[clamp(1.1rem,2.2vw,1.8rem)] font-light italic tracking-wide" style={{ ...d.style(2), color: scene.mutedColor }}>{scene.subheadline}</div>
            <div className="sg-anim sg-fade-up mt-5 flex flex-wrap items-center gap-5" style={d.style(3)}>
              {scene.promoPrice && <span className="sg-display text-[clamp(2.6rem,5.5vw,4.8rem)]" style={{ color: scene.accentColor }}>{scene.promoPrice}</span>}
              {scene.originalPrice && <span className="text-2xl font-bold line-through opacity-60">{scene.originalPrice}</span>}
              {scene.discountBadge && <span className="sg-anim sg-pop rounded-full px-5 py-2 text-sm font-black tracking-[0.2em] text-black" style={{ ...d.style(4), background: scene.accentColor }}>{scene.discountBadge}</span>}
            </div>
            {scene.description && <p className="sg-anim sg-fade-up mt-3 max-w-xl text-lg" style={{ ...d.style(4), color: scene.mutedColor }}>{scene.description}</p>}
            {scene.ctaText && (
              <div className="sg-anim sg-fade-up mt-6" style={d.style(5)}>
                <span className="inline-flex items-center gap-3 border-b-4 pb-1 text-lg font-black tracking-[0.2em]" style={{ borderColor: scene.accentColor }}>{scene.ctaText} <span>→</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 7 · SPLIT PROMO ═══ */}
      {t === "split-promo" && (
        <div className="relative z-10 grid h-full grid-cols-1 lg:grid-cols-2">
          <div className={`relative overflow-hidden ${kbClass(scene.kenBurns)}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {scene.imageUrl && <img src={scene.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
            <div className="sg-anim sg-wipe-x absolute bottom-6 left-6 hidden lg:block" style={{ ...d.style(2), background: scene.accentColor }}>
              <span className="block px-5 py-2.5 text-sm font-black tracking-widest text-white" style={{ background: "transparent" }}>{scene.discountBadge} · LIMITED TIME</span>
            </div>
            <div className="absolute inset-y-0 right-0 hidden w-2 lg:block" style={{ background: scene.accentColor }} />
          </div>
          <div className="flex flex-col justify-center gap-4 px-[6%] py-[4%]" style={{ background: `linear-gradient(${scene.bgAngle}deg, ${scene.bgFrom}, ${scene.bgTo})`, color: scene.textColor }}>
            <Eyebrow scene={scene} d={d} />
            <div className="sg-mask">
              <span style={{ animationDelay: `${150 + d.s}ms` }} className="sg-display text-[clamp(2.2rem,4.8vw,4.4rem)]">{scene.headline}</span>
            </div>
            {scene.productName && <div className="sg-anim sg-fade text-xl font-bold opacity-80" style={d.style(2)}>{scene.productName}</div>}
            <PriceBlock scene={scene} d={d} light={scene.bgFrom.startsWith("#f")} />
            {scene.description && <p className="sg-anim sg-fade-up max-w-lg leading-relaxed opacity-80" style={d.style(5)}>{scene.description}</p>}
            <div className="sg-anim sg-fade-up" style={d.style(6)}>
              <span className="inline-block rounded-xl px-7 py-3.5 font-black tracking-wide text-white shadow-xl" style={{ background: scene.accentColor }}>{scene.ctaText}</span>
            </div>
          </div>
        </div>
      )}

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0 z-20" style={{ boxShadow: "inset 0 0 180px rgba(0,0,0,0.45)" }} />
    </div>
  );
}
