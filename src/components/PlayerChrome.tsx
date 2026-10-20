"use client";

import { BRAND } from "@/lib/signage";

export function BrandBar({ playlistName, index, total }: { playlistName: string; index: number; total: number }) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 items-center rounded-xl bg-white px-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={BRAND.logo} alt="" className="h-5 w-auto" draggable={false} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-black tracking-[0.22em]">{BRAND.name.toUpperCase()}</div>
          <div className="text-[11px] font-medium tracking-widest opacity-70">{playlistName}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LiveClock />
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-widest ring-1 ring-white/20 backdrop-blur">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}

export function LiveClock() {
  return (
    <span className="rounded-full bg-black/40 px-4 py-1.5 font-mono text-sm font-bold tracking-widest ring-1 ring-white/15 backdrop-blur" suppressHydrationWarning>
      <ClockInner />
    </span>
  );
}

import { useEffect, useState } from "react";
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
      <div className="flex w-max whitespace-nowrap text-[13px] font-bold tracking-[0.18em]" style={{ animation: "sg-ticker 28s linear infinite" }}>
        <span className="pr-8">{line}</span>
        <span className="pr-8" style={{ color }}>{line}</span>
      </div>
    </div>
  );
}

export function Dots({ total, index, color }: { total: number; index: number; color: string }) {
  return (
    <div className="absolute bottom-12 right-6 z-30 flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === index ? 28 : 8, background: i === index ? color : "#ffffff44" }} />
      ))}
    </div>
  );
}
