/* eslint-disable @next/next/no-img-element -- signage renders arbitrary user/remote URLs that can't be pre-allowlisted for next/image */
import type { CSSProperties, ReactNode } from "react";
import type { Scene } from "@/lib/signage";
import type { Delays } from "../parts";
import { HeadlineLines } from "../parts";
import { fitText, textWidth } from "./storeBoardKit";
import { A, clamp } from "./storeBoardParts";
import { alpha, stars, stepLabel, type Kit } from "./brandKit";

// Shared building blocks for the twelve branded templates (EasyGates Direct and
// Smart & Secure). Everything is laid out in px on the fixed 1920×1080 canvas and
// takes its colours from the Kit, so one component serves both brand families.

/** Content rows every branded template respects: below the logo/clock, above the ticker. */
export const TOP = 110;
export const BOTTOM = 64;
export const AREA_H = 1080 - TOP - BOTTOM; // 906
export const MARGIN = 56;
export const GAP = 24;

// ───────────────────────── icons ─────────────────────────

export type BrandIconId =
  | "gate"
  | "motor"
  | "barrier"
  | "key"
  | "shield"
  | "camera"
  | "bell"
  | "wifi"
  | "bulb"
  | "speaker"
  | "lock"
  | "plug"
  | "phone"
  | "van"
  | "tools"
  | "check"
  | "cross"
  | "clock"
  | "bolt"
  | "home"
  | "screen"
  | "sensor"
  | "arrow"
  | "star"
  | "pin";

const PATHS: Record<BrandIconId, ReactNode> = {
  gate: (
    <>
      <path d="M3 4v16M21 4v16" />
      <path d="M6 9h12M6 14h12" />
      <path d="M9 9v11M15 9v11" />
    </>
  ),
  motor: (
    <>
      <rect x="3" y="8" width="18" height="10" rx="3" />
      <path d="M7 12h6M17 12h1" />
      <path d="M12 8V4M9 4h6" />
    </>
  ),
  barrier: (
    <>
      <path d="M4 20V8a2 2 0 0 1 2-2h6" />
      <path d="M6 12h13" />
      <path d="M19 12v8" />
      <path d="M9 16h10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8 20 3M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="13" height="10" rx="2.5" />
      <path d="M16 11l5-3v8l-5-3z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5H4.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  wifi: (
    <>
      <path d="M4 9a12 12 0 0 1 16 0" />
      <path d="M7 12.5a8 8 0 0 1 10 0" />
      <path d="M10 16a4 4 0 0 1 4 0" />
      <path d="M12 19.5v.1" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1 .9 1.6h5.2c0-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z" />
    </>
  ),
  speaker: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="3" />
      <circle cx="12" cy="15" r="3.5" />
      <path d="M12 7.5v.1" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v5M15 3v5" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 17v4" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.2 1A16 16 0 0 1 4 5.2 1 1 0 0 1 5 4z" />
  ),
  van: (
    <>
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4.5l3.5 3.5V16h-8" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </>
  ),
  tools: (
    <>
      <path d="M14.5 6.5a4 4 0 1 0 3 6.7L21 17v3h-3l-3.8-3.8a4 4 0 0 1-5.4-5.4L5 7V4h3z" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  cross: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  bolt: <path d="M13.5 3 6 13.5h5L10.5 21 18 10.5h-5z" />,
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  screen: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </>
  ),
  sensor: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 16.5a6.4 6.4 0 0 0 0-9" />
      <path d="M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 19.5a10.6 10.6 0 0 0 0-15" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="M13.5 6.5 20 12l-6.5 5.5" />
    </>
  ),
  star: <path d="M12 3.5l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17.3 6.6 20.2l1.1-6.1-4.5-4.2 6.1-.8z" />,
  pin: (
    <>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
};

export function BrandIcon({ id, size = 48, color = "currentColor", stroke = 2.2 }: { id: BrandIconId; size?: number; color?: string; stroke?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flex: "none" }}
    >
      {PATHS[id]}
    </svg>
  );
}

/** Keyword → icon, so a row titled "CCTV" gets a camera without anyone picking one. */
const KEYWORDS: [BrandIconId, string[]][] = [
  ["gate", ["gate", "swing", "sliding", "bi-fold", "driveway"]],
  ["barrier", ["barrier", "bollard", "traffic", "car park", "parking"]],
  ["motor", ["motor", "ram", "underground", "actuator", "operator", "kit"]],
  ["key", ["key", "fob", "token", "code", "keypad"]],
  ["shield", ["safety", "safe", "compliance", "force", "edge", "ukca", "ce", "risk"]],
  ["camera", ["camera", "cctv", "video", "doorbell", "colourvu", "night"]],
  ["bell", ["alarm", "bell", "siren", "intruder", "alert"]],
  ["wifi", ["wifi", "wi-fi", "network", "mesh", "signal", "app"]],
  ["bulb", ["light", "bulb", "hue", "lamp", "lighting", "nanoleaf", "downlight"]],
  ["speaker", ["speaker", "audio", "sound", "sonos", "cinema", "music", "av"]],
  ["lock", ["lock", "smart lock", "deadbolt", "yale", "secure"]],
  ["plug", ["plug", "socket", "power", "ev charger", "charging"]],
  ["phone", ["phone", "call", "support", " helpline", "tel"]],
  ["van", ["deliver", "courier", "van", "next day", "shipping", "collect"]],
  ["tools", ["install", "fitting", "engineer", "service", "maintenance", "trade"]],
  ["home", ["home", "house", "showroom", "room", "garden"]],
  ["screen", ["tv", "screen", "display", "projector", "monitor"]],
  ["sensor", ["sensor", "detector", "pir", "motion", "radar"]],
  ["clock", ["hour", "open", "time", "cut-off", "cutoff", "closing"]],
  ["star", ["review", "rating", "trustpilot", "excellent", "star"]],
  ["pin", ["find", "visit", "address", "location", "where"]],
  ["bolt", ["power", "electric", "energy", "fast", "quick"]],
];

/** Icon for a row: its tag first, then words in the name, then by position. */
export function rowIcon(row: { tag?: string; name?: string; desc?: string }, index = 0): BrandIconId {
  const hay = ` ${`${row.tag || ""} ${row.name || ""}`.toLowerCase().trim()} `;
  if (hay.trim()) {
    for (const [id, words] of KEYWORDS) {
      if (words.some((w) => hay.includes(w))) return id;
    }
  }
  const order: BrandIconId[] = ["check", "shield", "tools", "star", "clock", "pin"];
  return order[((index % order.length) + order.length) % order.length];
}

// ───────────────────────── header ─────────────────────────

/**
 * The standard slide header: eyebrow rule + headline sized to fit the width.
 * Templates can pass `accent` to draw the eyebrow in the second colour instead.
 */
export function Head({
  scene,
  d,
  k,
  width,
  max = 96,
  min = 40,
  i = 0,
  align = "left",
  sub = true,
}: {
  scene: Scene;
  d: Delays;
  k: Kit;
  width: number;
  max?: number;
  min?: number;
  i?: number;
  align?: "left" | "center";
  /** false for templates that declare subheadline unused */
  sub?: boolean;
}) {
  const fit = fitText({ text: scene.headline || "", boxW: width, maxPx: max, minPx: min, maxLines: 2, lineHeight: 1.04, ls: -0.015 });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: align === "center" ? "center" : "stretch" }}>
      {scene.eyebrow ? (
        <A d={d} i={i} cls="sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ display: "block", width: 46, height: 8, borderRadius: 99, background: k.accent, flex: "none" }} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: k.accent }}>{scene.eyebrow}</span>
        </A>
      ) : null}
      <div className="sg-mask">
        <HeadlineLines
          text={scene.headline || ""}
          className="sg-display"
          style={{ fontSize: fit.px, lineHeight: 1.02, letterSpacing: "-0.015em", color: k.text, animationDelay: `${150 + d.s * (i + 1)}ms`, textAlign: align }}
        />
      </div>
      {sub && scene.subheadline ? (
        <A d={d} i={i + 1} cls="sg-fade-up" tag="p" style={{ margin: 0, fontSize: 28, fontWeight: 600, color: k.muted, textAlign: align, maxWidth: width }}>
          {scene.subheadline}
        </A>
      ) : null}
    </div>
  );
}

/** A wide call-to-action bar. Returns null when the slide has no CTA text. */
export function CtaBar({ scene, d, k, i = 6, width }: { scene: Scene; d: Delays; k: Kit; i?: number; width?: number }) {
  if (!scene.ctaText) return null;
  const px = fitText({ text: scene.ctaText, boxW: (width ?? 1200) - 120, maxPx: 44, minPx: 22, maxLines: 1, ls: 0.04, upper: true });
  return (
    <A d={d} i={i} cls="sg-pop" style={{ display: "inline-flex", alignSelf: "flex-start" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 18,
          padding: "18px 40px",
          borderRadius: 999,
          background: k.solid,
          color: k.solidInk,
          fontSize: px.px,
          fontWeight: 900,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          boxShadow: k.dark ? "0 18px 44px rgba(0,0,0,0.45)" : "0 14px 34px rgba(15,23,42,0.18)",
        }}
      >
        <span style={{ display: "block", width: 14, height: 14, borderRadius: 99, background: k.solidInk, animation: "sg-pulse 1.8s ease-in-out infinite" }} />
        {scene.ctaText}
      </span>
    </A>
  );
}

// ───────────────────────── panels, chips, lists ─────────────────────────

/** A panel: translucent fill, hairline border, optional accent edge on the left. */
export function Panel({
  k,
  children,
  style,
  edge,
  radius = 26,
  pad = 26,
}: {
  k: Kit;
  children: ReactNode;
  style?: CSSProperties;
  /** draw a coloured edge down the left side */
  edge?: string;
  radius?: number;
  pad?: number;
}) {
  return (
    <div
      style={{
        background: k.panel,
        border: `1px solid ${k.line}`,
        borderRadius: radius,
        padding: pad,
        boxShadow: k.dark ? "0 18px 44px rgba(0,0,0,0.32)" : "0 14px 34px rgba(15,23,42,0.10)",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {edge ? <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: edge }} /> : null}
      {children}
    </div>
  );
}

/** A small rounded label (category, badge, tick). */
export function Chip({
  k,
  text,
  fill,
  ink,
  px = 24,
  icon,
}: {
  k: Kit;
  text: string;
  fill?: string;
  ink?: string;
  px?: number;
  icon?: BrandIconId;
}) {
  const bg = fill ?? alpha(k.accent, k.dark ? 0.22 : 0.16);
  const fg = ink ?? k.accent;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 18px",
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: px,
        fontWeight: 900,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {icon ? <BrandIcon id={icon} size={px * 0.95} color={fg} stroke={2.6} /> : null}
      {text}
    </span>
  );
}

/** A ticked list. `lines` comes from `bullets()` — one line per point. */
export function TickList({
  k,
  lines,
  d,
  start = 0,
  px = 30,
  gap = 14,
}: {
  k: Kit;
  lines: string[];
  d: Delays;
  start?: number;
  px?: number;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {lines.map((line, i) => (
        <A key={i} d={d} i={start + i} cls="sg-slide-r" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <span
            style={{
              flex: "none",
              display: "grid",
              placeItems: "center",
              width: px + 14,
              height: px + 14,
              borderRadius: 999,
              background: k.solid,
              marginTop: 2,
            }}
          >
            <BrandIcon id="check" size={px * 0.72} color={k.solidInk} stroke={3} />
          </span>
          <span style={{ fontSize: px, fontWeight: 700, lineHeight: 1.24, color: k.text }}>{line}</span>
        </A>
      ))}
    </div>
  );
}

/** A product photo window: never cropped, always centred, with a soft inner frame. */
export function Frame({
  src,
  alt,
  w,
  h,
  k,
  radius = 24,
  fit = "contain",
}: {
  src?: string;
  alt?: string;
  w: number | string;
  h: number | string;
  k: Kit;
  radius?: number;
  fit?: "cover" | "contain";
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        flex: "none",
        borderRadius: radius,
        overflow: "hidden",
        background: fit === "contain" ? (k.dark ? alpha("#ffffff", 0.06) : "#ffffff") : k.line,
        border: `1px solid ${k.line}`,
        display: "grid",
        placeItems: "center",
      }}
    >
      {src ? (
        <img src={src} alt={alt || ""} draggable={false} style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />
      ) : (
        <BrandIcon id="home" size={Math.min(Number(w) || 240, Number(h) || 240) * 0.3} color={alpha(k.text, 0.25)} stroke={1.6} />
      )}
    </div>
  );
}

/** Star rating, sized to match the type around it. */
export function Stars({ rating, k, px = 34 }: { rating?: string; k: Kit; px?: number }) {
  if (!rating) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: px, color: k.solid2, letterSpacing: "0.04em" }}>
      {stars(rating)}
    </span>
  );
}

/** Big mono/technical number plate — the EasyGates catalogue look. */
export function SpecRow({
  k,
  label,
  value,
  px = 30,
  zebra = false,
}: {
  k: Kit;
  label: string;
  value: string;
  px?: number;
  zebra?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 18,
        padding: `${Math.round(px * 0.42)}px ${Math.round(px * 0.6)}px`,
        background: zebra ? alpha(k.text, k.dark ? 0.06 : 0.04) : "transparent",
        borderRadius: 12,
      }}
    >
      <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: px, fontWeight: 700, color: k.muted, letterSpacing: "0.02em", overflowWrap: "anywhere" }}>{label}</span>
      <span aria-hidden="true" style={{ flex: "0 1 60px", borderTop: `4px dotted ${alpha(k.muted, 0.45)}`, transform: "translateY(-6px)" }} />
      <span style={{ flex: "none", fontSize: Math.round(px * 1.1), fontWeight: 900, color: k.text, letterSpacing: "-0.01em" }}>{value}</span>
    </div>
  );
}

/** Measure text and give back a font size that fits — thin wrapper so templates stay short. */
export function fitPx(text: string, boxW: number, maxPx: number, minPx: number, maxLines = 1, ls = -0.01): number {
  return fitText({ text, boxW, maxPx, minPx, maxLines, lineHeight: 1.1, ls }).px;
}

export { A, clamp, textWidth, fitText, stepLabel };
