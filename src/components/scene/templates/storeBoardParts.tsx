import type { CSSProperties, ReactNode } from "react";
import type { Scene } from "@/lib/signage";
import type { Delays } from "../parts";
import { contrast, hexToRgb, luminance, mixHex, rgbToHex } from "@/lib/color";
import { countLines, fitText, textWidth, type Arrow, type ServiceIcon } from "./storeBoardKit";

// Building blocks shared by the four value-store "board" templates:
// header banner + info strip, price flag, tag flag, product picture window, icons, big arrow.
// Everything is laid out in px on the fixed 1920x1080 canvas.

export const INK = "#0f172a";
export const SLATE = "#334155";

/** Canvas rows every board template respects: content starts below the logo/clock, ends above the ticker. */
export const TOP = 110;
export const BOTTOM = 64;
export const AREA_H = 1080 - TOP - BOTTOM; // 906

export interface Pal {
  /** the slide's accent colour as set in the editor (for fills that carry no text) */
  accent: string;
  /** accent nudged so text on it reaches 7:1 */
  solid: string;
  /** text colour to use on `solid` (white or navy) */
  solidInk: string;
  /** accent as text on a white card (>= 7:1) */
  onWhite: string;
  navy: string;
  pop: string;
  popDeep: string;
  popInk: string;
}

function validHex(v: string | undefined, fallback: string): string {
  const rgb = v ? hexToRgb(v) : null;
  return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : fallback;
}

/**
 * A version of the accent that text can sit on at `min` contrast (default 7:1, "hero text").
 * Moves the accent the shortest way towards navy (white text) or towards white (navy text).
 */
function solidFor(accent: string, min = 7): { solid: string; ink: string } {
  const WHITE = "#ffffff";
  // light accents (yellow, amber, sky) keep dark text and lighten a touch; the rest keep white
  // text and deepen into a rich, saturated shade rather than going pastel.
  const [ink, target] = luminance(accent) >= 0.3 ? ([INK, WHITE] as const) : ([WHITE, INK] as const);
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const solid = mixHex(accent, target, t);
    if (contrast(ink, solid) >= min) return { solid, ink };
  }
  return { solid: INK, ink: WHITE };
}

/** Colours every board template derives from the slide. Never trusts the slide's text colour. */
export function palette(scene: Scene): Pal {
  const accent = validHex(scene.accentColor, "#e11d48");
  const { solid, ink } = solidFor(accent);
  let onWhite = accent;
  for (let t = 0; t <= 1.0001 && contrast(onWhite, "#ffffff") < 7; t += 0.05) onWhite = mixHex(accent, INK, t);
  return { accent, solid, solidInk: ink, onWhite, navy: INK, pop: "#ffd60a", popDeep: "#e0a800", popInk: INK };
}

// ───────────────────────── animation wrapper ─────────────────────────

/** An animated block. Always carries an entrance class (sg-anim alone would stay invisible). */
export function A({
  d,
  i = 0,
  extra = 0,
  cls = "sg-fade-up",
  className = "",
  style,
  children,
  tag = "div",
  slow,
}: {
  d: Delays;
  i?: number;
  extra?: number;
  cls?: "sg-fade-up" | "sg-fade-down" | "sg-fade" | "sg-scale-in" | "sg-pop" | "sg-price" | "sg-slide-l" | "sg-slide-r";
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  tag?: "div" | "span" | "h1" | "p";
  slow?: boolean;
}) {
  const Tag = tag;
  return (
    <Tag className={`sg-anim ${cls} ${className}`.trim()} style={{ ...d.style(i, extra), ...(slow ? { animationDuration: "650ms" } : {}), ...style }}>
      {children}
    </Tag>
  );
}

/** Last-resort clamp so absurdly long text never pushes a layout apart. */
export function clamp(lines: number): CSSProperties {
  return { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" };
}

// ───────────────────────── icons ─────────────────────────

type IconId = ServiceIcon | "chevron" | "trophy" | "pin" | "check";

const ICONS: Record<IconId, ReactNode> = {
  collect: (
    <>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  returns: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  hours: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  help: (
    <>
      <path d="M4 4.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1z" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2.9-1.2 1.8" />
      <path d="M12 14.7v.1" />
    </>
  ),
  customer: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
      <path d="M19 20c0 1.4-2 2-5 2" />
    </>
  ),
  delivery: (
    <>
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4.5l3.5 3.5V16h-8" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17.5" cy="17.5" r="2" />
    </>
  ),
  photo: (
    <>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.8" />
    </>
  ),
  pharmacy: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 7.5v9M7.5 12h9" />
    </>
  ),
  cafe: (
    <>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3v3M12 3v3" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M9.5 17V7H13a3 3 0 0 1 0 6H9.5" />
    </>
  ),
  trolley: (
    <>
      <path d="M2 4h3l2.5 11h10.5L20.5 8H6" />
      <circle cx="9" cy="19.5" r="1.6" />
      <circle cx="17" cy="19.5" r="1.6" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="9" width="18" height="4" rx="1" />
      <path d="M5 13v7h14v-7M12 9v11" />
      <path d="M12 9S9.2 9 8.2 7.6 9 4 10.5 5 12 9 12 9zM12 9s2.8 0 3.8-1.4S15 4 13.5 5 12 9 12 9z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="M11.2 11.8 20 3M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  pound: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8.6a3.1 3.1 0 0 0-5.6 1.8V16M7.8 16h8.6M7.8 12.4h5.6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <path d="M12 7.6v.1" />
    </>
  ),
  phone: <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />,
  wifi: (
    <>
      <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a10 10 0 0 1 13 0M8.5 16a5.5 5.5 0 0 1 7 0" />
      <path d="M12 19.6v.1" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  glasses: (
    <>
      <circle cx="6.5" cy="14" r="3.5" />
      <circle cx="17.5" cy="14" r="3.5" />
      <path d="M10 14h4M3 14l2-7M21 14l-2-7" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l1 13H4z" />
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
    </>
  ),
  chevron: <path d="M9 5l7 7-7 7" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 14v4M8 21h8M9 18h6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
};

export function Icon({ id, size = 48, color = "currentColor", stroke = 2 }: { id: IconId; size?: number; color?: string; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flex: "none" }}
    >
      {ICONS[id]}
    </svg>
  );
}

/** Chunky block arrow for wayfinding. Drawn pointing up, rotated for left / right. */
export function BigArrow({ dir, size, color }: { dir: Arrow; size: number; color: string }) {
  const rot = dir === "left" ? -90 : dir === "right" ? 90 : 0;
  const label = dir === "left" ? "Turn left" : dir === "right" ? "Turn right" : "Straight ahead";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={label} style={{ display: "block", flex: "none", transform: `rotate(${rot}deg)` }}>
      <polygon points="100,14 182,100 130,100 130,186 70,186 70,100 18,100" fill={color} stroke={color} strokeWidth="14" strokeLinejoin="round" />
    </svg>
  );
}

// ───────────────────────── flags and pictures ─────────────────────────

/** Width in px of a price flag showing `text` at font size `px`. */
export function priceFlagWidth(text: string, px: number): number {
  return textWidth(text, px, { ls: -0.04 }) + px * 0.34 + px * 0.28 + px * 0.2;
}

/** Height in px of a price flag at font size `px` (digits are ~0.73em tall, so the box is snug). */
export function priceFlagHeight(px: number): number {
  return Math.round(px * 0.98) + 8;
}

/** Chunky price flag (tag shape with an eyelet). `px` is the price font size. */
export function PriceFlag({ pal, text, px }: { pal: Pal; text: string; px: number }) {
  const notch = Math.round(px * 0.34);
  const eye = Math.max(5, Math.round(px * 0.065));
  const eyeX = Math.round(notch * 0.62);
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        background: `radial-gradient(circle at ${eyeX}px 50%, #ffffff 0 ${eye}px, ${pal.navy} ${eye}px ${eye + 3}px, transparent ${eye + 3.5}px), linear-gradient(180deg, ${pal.pop} calc(100% - 8px), ${pal.popDeep} calc(100% - 8px))`,
        clipPath: `polygon(0 50%, ${notch}px 0, 100% 0, 100% 100%, ${notch}px 100%)`,
        color: pal.popInk,
        fontSize: px,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        lineHeight: 0.78,
        padding: `${Math.round(px * 0.1)}px ${Math.round(px * 0.2)}px ${Math.round(px * 0.1) + 8}px ${notch + Math.round(px * 0.28)}px`,
      }}
    >
      {text}
    </span>
  );
}

/** Small accent label ("-20%", "NEW"). */
export function TagFlag({ pal, text, px = 30 }: { pal: Pal; text: string; px?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: pal.solid,
        color: pal.solidInk,
        fontSize: px,
        fontWeight: 900,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        lineHeight: 1.05,
        padding: `${Math.round(px * 0.2)}px ${Math.round(px * 0.5)}px`,
        borderRadius: 10,
        boxShadow: `0 4px 0 ${pal.navy}`,
        overflowWrap: "anywhere",
      }}
    >
      {text}
    </span>
  );
}

/**
 * Product picture, shown whole (never cropped). `w` x `h` is the window; the photo sits in the
 * biggest 16:9 box that fits, multiplied onto the card and feathered at the edges so the studio
 * background melts into white instead of showing a grey rectangle.
 */
export function Pic({
  src,
  alt,
  w,
  h,
  className = "",
  style,
  children,
}: {
  src: string;
  alt: string;
  w: number;
  h: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const iw = Math.max(1, Math.min(w, (h * 16) / 9));
  const ih = (iw * 9) / 16;
  const feather =
    "linear-gradient(90deg, transparent 0, #000 7%, #000 93%, transparent 100%), linear-gradient(180deg, transparent 0, #000 9%, #000 91%, transparent 100%)";
  return (
    <div className={`relative ${className}`} style={{ width: w, height: h, flex: "none", ...style }}>
      <div style={{ position: "absolute", left: (w - iw) / 2, top: (h - ih) / 2, width: iw, height: ih }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "multiply",
            WebkitMaskImage: feather,
            maskImage: feather,
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        />
      </div>
      {children}
    </div>
  );
}

// ───────────────────────── header banner + info strip ─────────────────────────

const CTA_PX = 28;
const CTA_MAX_W = 760;
const CTA_EXTRA_W = 50 + Math.round(CTA_PX * 1.1) + 12; // padding + chevron + gap

export interface BannerMetrics {
  headPx: number;
  headLines: number;
  eyebrowLines: number;
  subPx: number;
  subLines: number;
  ctaLines: number;
  ctaW: number;
  /** estimated total height of banner + strip in px (borders included) */
  height: number;
}

/** Same fitting the Banner uses, so templates can size the area below it. */
export function bannerMetrics(scene: Scene, leadW = 0): BannerMetrics {
  const headline = (scene.headline || "").trim();
  const eyebrow = (scene.eyebrow || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const headW = 1808 - (leadW ? leadW + 28 : 0);
  const head = fitText({ text: headline, boxW: headW, maxPx: 72, minPx: 64, maxLines: 2, upper: true, ls: -0.02, lineHeight: 0.98 });
  const eyebrowLines = eyebrow ? countLines(eyebrow, 22, headW - 32, { upper: true, ls: 0.14 }) : 0;
  const ctaTextW = CTA_MAX_W - CTA_EXTRA_W;
  const ctaLines = cta ? countLines(cta, CTA_PX, ctaTextW, { upper: true, ls: 0.03 }) : 0;
  const ctaW = cta ? Math.min(CTA_MAX_W, ctaLines > 1 ? CTA_MAX_W : textWidth(cta, CTA_PX, { upper: true, ls: 0.03 }) + CTA_EXTRA_W + 6) : 0;
  const subFit = fitText({ text: sub, boxW: 1808 - (cta ? ctaW + 32 : 0), maxPx: 30, minPx: 26, maxLines: 3, upper: true, ls: 0.02, lineHeight: 1.12 });

  const eyebrowH = eyebrowLines ? eyebrowLines * 22 * 1.15 + 10 + 4 : 0;
  const hasBand = Boolean(headline || eyebrow);
  const bannerH = hasBand ? 10 + eyebrowH + (headline ? head.lines * head.px * 0.98 : 0) + 12 + 6 : 0;
  const ctaH = ctaLines ? ctaLines * CTA_PX * 1.1 + 22 : 0;
  const subH = sub ? subFit.lines * subFit.px * 1.12 : 0;
  const stripH = sub || cta ? Math.max(ctaH, subH) + 14 + 6 : 0;
  return { headPx: head.px, headLines: head.lines, eyebrowLines, subPx: subFit.px, subLines: subFit.lines, ctaLines, ctaW, height: Math.round(bannerH + stripH) };
}

export function CtaPill({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        background: bg,
        color: fg,
        fontSize: CTA_PX,
        fontWeight: 900,
        letterSpacing: "0.03em",
        textTransform: "uppercase",
        lineHeight: 1.1,
        padding: "11px 22px 11px 28px",
        borderRadius: 999,
        boxShadow: "0 4px 0 rgba(15,23,42,0.35)",
      }}
    >
      <span style={{ overflowWrap: "anywhere" }}>{text}</span>
      <Icon id="chevron" size={Math.round(CTA_PX * 1.1)} color={fg} stroke={3.2} />
    </span>
  );
}

/**
 * Full-width header: optional eyebrow pill, big headline, then a yellow strip holding the
 * sub-headline (left) and the call-to-action pill (right). Starts below the logo / clock zone.
 */
export function Banner({
  scene,
  d,
  pal,
  tone = "accent",
  lead,
  leadW = 0,
}: {
  scene: Scene;
  d: Delays;
  pal: Pal;
  tone?: "accent" | "navy";
  lead?: ReactNode;
  leadW?: number;
}) {
  const bg = tone === "navy" ? pal.navy : pal.solid;
  const fg = tone === "navy" ? "#ffffff" : pal.solidInk;
  const chipBg = tone === "navy" ? pal.solid : pal.navy;
  const chipFg = tone === "navy" ? pal.solidInk : "#ffffff";
  const headline = (scene.headline || "").trim();
  const eyebrow = (scene.eyebrow || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const m = bannerMetrics(scene, lead ? leadW : 0);

  const hasBand = Boolean(headline || eyebrow);

  return (
    <div style={{ flex: "none" }}>
      {hasBand && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: bg,
            color: fg,
            padding: "10px 56px 12px",
            display: "flex",
            alignItems: "center",
            gap: 28,
            borderBottom: `6px solid ${pal.navy}`,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 620,
              background: "repeating-linear-gradient(115deg, rgba(255,255,255,0.12) 0 28px, transparent 28px 56px)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 70%)",
              maskImage: "linear-gradient(90deg, transparent, #000 70%)",
            }}
          />
          {lead && (
            <A d={d} i={0} cls="sg-pop" className="relative" style={{ width: leadW, flex: "none" }}>
              {lead}
            </A>
          )}
          <div className="relative flex min-w-0 flex-1 flex-col items-start" style={{ gap: 4 }}>
            {eyebrow && (
              <A
                d={d}
                i={0}
                cls="sg-fade-down"
                style={{
                  background: chipBg,
                  color: chipFg,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  lineHeight: 1.15,
                  padding: "5px 16px",
                  borderRadius: 8,
                  overflowWrap: "anywhere",
                }}
              >
                {eyebrow}
              </A>
            )}
            {headline && (
              <A
                d={d}
                i={1}
                cls="sg-fade-up"
                tag="h1"
                className="sg-display"
                style={{ margin: 0, fontSize: m.headPx, lineHeight: 0.98, letterSpacing: "-0.02em", textTransform: "uppercase", overflowWrap: "anywhere" }}
              >
                {headline}
              </A>
            )}
          </div>
        </div>
      )}
      {(sub || cta) && (
        <div
          style={{
            background: pal.pop,
            color: pal.popInk,
            padding: "7px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: sub ? "space-between" : "flex-end",
            gap: 32,
            borderBottom: `6px solid ${pal.navy}`,
          }}
        >
          {sub && (
            <A
              d={d}
              i={2}
              cls="sg-fade"
              className="min-w-0 flex-1"
              style={{ fontSize: m.subPx, fontWeight: 900, letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1.12, overflowWrap: "anywhere" }}
            >
              {sub}
            </A>
          )}
          {cta && (
            <A d={d} i={3} cls="sg-pop" style={{ flex: "none", maxWidth: CTA_MAX_W }}>
              <CtaPill text={cta} bg={pal.navy} fg="#ffffff" />
            </A>
          )}
        </div>
      )}
    </div>
  );
}
