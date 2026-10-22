"use client";

import { useEffect, useState } from "react";
import type { BrandSettings } from "@/lib/brand";

/** Top corners of every screen: business logo (or name) left, optional clock right. */
/** hideLogo: the slide already shows the logo large (splash), so only the clock is drawn. */
export function BrandBar({ brand, hideLogo = false }: { brand: BrandSettings; hideLogo?: boolean }) {
  if (!brand.showBrandBar && !brand.showClock) return null;
  const name = brand.businessName;
  const showName = Boolean(name) && (brand.showName || !brand.logoUrl);
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-start justify-between px-8 pt-7">
      {brand.showBrandBar && !hideLogo ? (
        <div className="flex items-center gap-4">
          {brand.logoUrl ? (
            <span className={`flex h-16 items-center ${brand.logoOnWhite ? "rounded-2xl bg-white px-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.logoUrl} alt={name} className="h-10 w-auto max-w-[360px] object-contain" draggable={false} />
            </span>
          ) : (
            name && <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black text-black">{name.charAt(0).toUpperCase()}</span>
          )}
          {showName && <span className="text-[22px] font-black uppercase tracking-[0.2em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">{name}</span>}
        </div>
      ) : (
        <span />
      )}
      {brand.showClock && <LiveClock />}
    </div>
  );
}

export function LiveClock() {
  return (
    <span className="rounded-full bg-black/45 px-5 py-2 font-mono text-[20px] font-bold tracking-widest ring-1 ring-white/15 backdrop-blur" suppressHydrationWarning>
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

export function ProgressBar({ durationSec, animKey, color }: { durationSec: number; animKey: string | number; color: string }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-white/10">
      <div
        key={animKey}
        className="h-full origin-left"
        style={{ background: color, animation: `sg-progress ${durationSec}s linear both` }}
      />
    </div>
  );
}

export function Ticker({ text, color }: { text?: string; color: string }) {
  if (!text) return null;
  const line = `${text} `.repeat(4);
  return (
    <div className="absolute bottom-1.5 left-0 right-0 z-30 overflow-hidden border-t border-white/10 bg-black/55 py-2 backdrop-blur">
      <div className="flex w-max whitespace-nowrap text-[20px] font-bold tracking-[0.18em]" style={{ animation: "sg-ticker 28s linear infinite" }}>
        <span className="pr-8">{line}</span>
        <span className="pr-8" style={{ color }}>{line}</span>
      </div>
    </div>
  );
}
