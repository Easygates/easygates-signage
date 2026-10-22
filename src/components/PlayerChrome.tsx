"use client";

import { useEffect, useState } from "react";
import { isLightTheme, themePalette } from "@/lib/themes";
import { contrast, mixHex } from "@/lib/color";
import { TICKER_SIZES, type BrandSettings, type TickerSize } from "@/lib/brand";

/** Top corners of every screen: business logo (or name) left, optional clock right. */
/** hideLogo: the slide already shows the logo large (splash), so only the clock is drawn. */
export function BrandBar({
  brand,
  hideLogo = false,
  theme,
}: {
  brand: BrandSettings;
  hideLogo?: boolean;
  /** the scene's theme — the bar sits on top of the theme background, not on the card */
  theme?: string;
}) {
  if (!brand.showBrandBar && !brand.showClock) return null;
  const name = brand.businessName;
  const showName = Boolean(name) && (brand.showName || !brand.logoUrl);
  const light = isLightTheme(theme);
  const ink = themePalette(theme).text;
  // The bar is drawn over the theme background, so its colours follow the theme
  // rather than the slide: on the pale Easter/Spring backgrounds white-on-white
  // was invisible. `logoOnWhite` still wins — that badge is what keeps a coloured
  // logo readable — but on a pale background it gains a ring so white-on-white
  // does not disappear into the page.
  const logoPlate = brand.logoOnWhite ? "bg-white" : light ? "bg-black/80" : "bg-black/30";
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between px-8 pt-7">
      {brand.showBrandBar && !hideLogo ? (
        <div className="flex items-center gap-4">
          {brand.logoUrl ? (
            <span
              className={`flex h-16 items-center rounded-2xl px-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)] ring-1 backdrop-blur-sm ${logoPlate} ${brand.logoOnWhite ? "ring-black/10" : "ring-white/15"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logoUrl} alt={name} className="h-10 w-auto max-w-[360px] object-contain" draggable={false} />
            </span>
          ) : (
            name && (
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black text-black ring-1 ring-black/10">
                {name.charAt(0).toUpperCase()}
              </span>
            )
          )}
          {showName && (
            <span
              className="text-[22px] font-black uppercase tracking-[0.2em]"
              style={{ color: ink, textShadow: light ? "0 1px 10px rgba(255,255,255,0.9)" : "0 2px 8px rgba(0,0,0,0.6)" }}
            >
              {name}
            </span>
          )}
        </div>
      ) : (
        <span />
      )}
      {brand.showClock && <LiveClock theme={theme} />}
    </div>
  );
}

export function LiveClock({ theme }: { theme?: string }) {
  const light = isLightTheme(theme);
  return (
    <span
      className={`rounded-full px-5 py-2 font-mono text-[20px] font-bold tracking-widest backdrop-blur ring-1 ${light ? "bg-white/70 ring-black/10" : "bg-black/45 ring-white/15"}`}
      style={light ? { color: themePalette(theme).text } : undefined}
      suppressHydrationWarning
    >
      <ClockInner />
    </span>
  );
}

function ClockInner() {
  const [t, setT] = useState("--:--");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    f();
    const i = setInterval(f, 10000);
    return () => clearInterval(i);
  }, []);
  return <>{t}</>;
}

export function ProgressBar({ durationSec, animKey, color, theme }: { durationSec: number; animKey: string | number; color: string; theme?: string }) {
  const light = isLightTheme(theme);
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 h-1.5" style={{ background: light ? "rgba(15,23,42,0.14)" : "rgba(255,255,255,0.12)" }}>
      <div
        key={animKey}
        className="h-full origin-left"
        style={{ background: color, animation: `sg-progress ${durationSec}s linear both` }}
      />
    </div>
  );
}

/**
 * The ticker is part of the frame, not the slide, so it follows the theme: a black
 * bar on a pale Easter background broke the illusion that the whole screen was
 * dressed. The bar is always a deep tint, so its text stays white.
 */
export function Ticker({ text, color, theme, size = "md" }: { text?: string; color: string; theme?: string; size?: TickerSize }) {
  if (!text) return null;
  const pal = themePalette(theme);
  const light = isLightTheme(theme);
  const bar = light ? mixHex(pal.text, "#000000", 0.15) : mixHex(pal.bgTo, "#000000", 0.4);
  const accent = contrast(color, bar) >= 4.5 ? color : contrast(pal.accent2, bar) >= 4.5 ? pal.accent2 : "#ffffff";
  const line = `${text} `.repeat(4);
  const t = TICKER_SIZES[size] ?? TICKER_SIZES.md;
  // Same pixels-per-second at every size: the loop grows with the type instead of
  // making a large ticker race past.
  const duration = (28 * t.fontSize) / TICKER_SIZES.md.fontSize;
  return (
    <div
      className="absolute bottom-1.5 left-0 right-0 z-30 overflow-hidden border-t backdrop-blur"
      style={{
        background: `${bar}e6`,
        borderColor: light ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.10)",
        paddingTop: t.padY,
        paddingBottom: t.padY,
      }}
    >
      <div
        className="flex w-max whitespace-nowrap font-bold text-white"
        style={{ fontSize: t.fontSize, letterSpacing: `${t.tracking}em`, animation: `sg-ticker ${duration}s linear infinite` }}
      >
        <span className="pr-8">{line}</span>
        <span className="pr-8" style={{ color: accent }}>{line}</span>
      </div>
    </div>
  );
}
