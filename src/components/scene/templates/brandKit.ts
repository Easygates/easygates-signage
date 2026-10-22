// Pure helpers shared by the twelve branded templates (six EasyGates Direct,
// six Smart & Secure). No imports from React and no JSX, so this file can be
// unit-tested straight from Node (tests/brand-templates.test.mjs).
//
// Every helper is palette-driven: it derives its colours from the slide's own
// colours, so the same template renders correctly for a dark industrial brand
// (EasyGates: deep navy, red, blue, safety amber) and for a light showroom brand
// (Smart & Secure: charcoal-teal, teal, coral, cream) without a second code path.

// Relative imports (not the "@/…" alias) so this file can also be imported
// straight from `node --test`, like storeBoardKit and tradeCounterKit.
import type { Scene } from "../../../lib/signage.ts";
import { contrast, hexToRgb, luminance, mixHex, rgbToHex } from "../../../lib/color.ts";

// ───────────────────────── colour helpers ─────────────────────────

const WHITE = "#ffffff";
const INK = "#0b1620";

function validHex(v: string | undefined, fallback: string): string {
  const rgb = v ? hexToRgb(v) : null;
  return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : fallback;
}

/** Hex → rgba() string, for hairlines and translucent panels. */
export function alpha(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${a})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

/** Push `fg` towards black or white until it reads on `bg` at `min` contrast. */
export function nudge(fg: string, bg: string, min = 7): string {
  if (contrast(fg, bg) >= min) return fg;
  const target = luminance(bg) > 0.35 ? "#000000" : WHITE;
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const c = mixHex(fg, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}

/** Ink for text sitting *on* a solid fill: dark on light fills, white on dark ones. */
export function inkOn(fill: string): string {
  return contrast(INK, fill) >= contrast(WHITE, fill) ? INK : WHITE;
}

/**
 * A fill derived from `accent` that any text stays readable on.
 * Light accents (amber, cream, pale teal) keep dark ink and are nudged a touch
 * lighter; dark accents keep white ink and deepen into a richer shade rather
 * than going pastel.
 */
export function solidFill(accent: string, min = 4.5): { fill: string; ink: string } {
  const light = luminance(accent) >= 0.34;
  const ink = light ? INK : WHITE;
  const target = light ? WHITE : INK;
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const fill = mixHex(accent, target, t);
    if (contrast(ink, fill) >= min) return { fill, ink };
  }
  return { fill: light ? WHITE : INK, ink: light ? INK : WHITE };
}

/** A second accent the slide has not set: rotate the hue rather than invent a clashing one. */
export function fallbackAccent2(accent: string): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return "#1a7bbf";
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // greys / near-greys go to a dependable blue; saturated hues rotate by a third
  if (max - min < 26) return "#1a7bbf";
  return rgbToHex(b, r, g);
}

// ───────────────────────── the kit itself ─────────────────────────

export interface Kit {
  /** true when the slide background is dark — panels, hairlines and shadows follow it */
  dark: boolean;
  /** the slide's accent, validated */
  accent: string;
  /** second accent: the slide's highlight colour, or one derived from the accent */
  accent2: string;
  /** accent and accent2 as readable solid fills */
  solid: string;
  solidInk: string;
  solid2: string;
  solid2Ink: string;
  bgFrom: string;
  bgTo: string;
  /** body text, guaranteed readable on the background */
  text: string;
  /** secondary text, at least 4.5:1 on the background */
  muted: string;
  /** a solid panel/card colour */
  card: string;
  /** a translucent panel over the background */
  panel: string;
  /** hairline / border colour */
  line: string;
  /** the accent washed over the background (tints, glows) */
  wash: string;
}

/** Everything a branded template needs, derived from the slide. Never trusts the stored text colour. */
export function kit(scene: Scene): Kit {
  const bgFrom = validHex(scene.bgFrom, "#07131f");
  const bgTo = validHex(scene.bgTo, "#0f2636");
  const dark = (luminance(bgFrom) + luminance(bgTo)) / 2 < 0.35;

  const accent = validHex(scene.accentColor, dark ? "#ff3b43" : "#0d7283");
  const highlight = scene.highlightColor ? hexToRgb(scene.highlightColor) : null;
  const accent2 = highlight ? rgbToHex(highlight[0], highlight[1], highlight[2]) : fallbackAccent2(accent);

  const s1 = solidFill(accent);
  const s2 = solidFill(accent2);
  const text = nudge(validHex(scene.textColor, dark ? WHITE : INK), bgFrom, 7);
  const mutedBase = validHex(scene.mutedColor, dark ? mixHex(WHITE, bgFrom, 0.32) : mixHex(INK, bgFrom, 0.42));
  const muted = nudge(mutedBase, bgFrom, 4.5);

  const card = dark ? mixHex(bgFrom, WHITE, 0.09) : WHITE;
  const line = dark ? mixHex(bgFrom, WHITE, 0.24) : mixHex(bgFrom, INK, 0.14);

  return {
    dark,
    accent: nudge(accent, bgFrom, 4.5),
    accent2: nudge(accent2, bgFrom, 4.5),
    solid: s1.fill,
    solidInk: s1.ink,
    solid2: s2.fill,
    solid2Ink: s2.ink,
    bgFrom,
    bgTo,
    text,
    muted,
    card,
    panel: dark ? mixHex(bgFrom, WHITE, 0.08) : mixHex(WHITE, bgFrom, 0.55),
    line,
    wash: alpha(accent, dark ? 0.22 : 0.16),
  };
}

// ───────────────────────── rows & text ─────────────────────────

export interface Row {
  name: string;
  price?: string;
  desc?: string;
  tag?: string;
  image?: string;
}

/** `scene.items[]` tidied: anything can be stored in JSON, so nothing is trusted. */
export function rows(scene: Scene, max = 12): Row[] {
  const raw = scene.items;
  if (!Array.isArray(raw)) return [];
  const out: Row[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as unknown as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : "");
    const row: Row = { name: str(r.name) };
    for (const k of ["price", "desc", "tag", "image"] as const) {
      const v = str(r[k]);
      if (v) row[k] = v;
    }
    if (row.name || row.price || row.desc) out.push(row);
    if (out.length >= max) break;
  }
  return out;
}

/** A details field written as one line per point: newline, " · ", " • " or " | ". */
export function bullets(text: string | undefined | null, max = 6): string[] {
  if (!text) return [];
  return text
    .split(/\s*[\r\n]+\s*|\s+[·•|]\s+/)
    .map((s) => s.replace(/^[-–—]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

/** Split a comma / " + " list into chips. */
export function chips(text: string | undefined | null, max = 8): string[] {
  if (!text) return [];
  return text
    .split(/\s*[,]\s*|\s*\+\s*|\s*[·•|]\s*|\s*[\r\n]+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/** "4.8" → "★★★★★"; anything non-numeric gives the same number of stars. */
export function stars(rating: string | undefined, outOf = 5): string {
  const n = Number.parseFloat((rating || "").replace(/[^0-9.]/g, ""));
  const value = Number.isFinite(n) ? Math.max(0, Math.min(outOf, Math.round(n))) : outOf;
  return "★".repeat(value) + "☆".repeat(Math.max(0, outOf - value));
}

/** Two-digit step label: 0 → "01". */
export function stepLabel(i: number): string {
  return String(i + 1).padStart(2, "0");
}

/** Read a cut-off like "3PM", "15:00" or "4.30pm" into a 24-hour time. */
export function clockHand(text: string): { hour: number; minute: number } {
  const t = (text || "").toLowerCase();
  const m = t.match(/(\d{1,2})(?::|\.)?(\d{2})?/);
  if (!m) return { hour: 15, minute: 0 };
  let hour = Number.parseInt(m[1], 10);
  const minute = Number.parseInt(m[2] || "0", 10);
  if (!Number.isFinite(hour)) return { hour: 15, minute: 0 };
  // "3pm" needs 12 added; "15:00" is already 24-hour
  if (/pm/.test(t) && hour < 12) hour += 12;
  if (/am/.test(t) && hour === 12) hour = 0;
  hour = ((hour % 24) + 24) % 24;
  return { hour, minute: Number.isFinite(minute) ? Math.min(59, minute) : 0 };
}

/** Degrees clockwise from 12 o'clock for the hour and minute hands. */
export function handAngle(hour: number, minute: number): { hourDeg: number; minuteDeg: number } {
  return {
    hourDeg: ((hour % 12) + minute / 60) * 30,
    minuteDeg: minute * 6,
  };
}

// ───────────────────────── layout ─────────────────────────

/** Columns for n cards: 1 → 1, 2 → 2, 3 → 3, 4 → 2×2, 5-6 → 3×2. */
export function columnCount(n: number): number {
  if (n <= 3) return Math.max(1, n);
  if (n === 4) return 2;
  return 3;
}

/** Even column widths for `cols` columns inside `width`, with `gap` between them. */
export function columnWidth(width: number, cols: number, gap: number): number {
  if (cols <= 0) return width;
  return Math.floor((width - gap * (cols - 1)) / cols);
}

/** Rounded-corner radius that scales with card size, so small cards stay soft. */
export function radiusFor(w: number): number {
  return Math.max(14, Math.min(34, Math.round(w * 0.035)));
}

/**
 * Deterministic diagonal stripe pattern for hazard / technical tape.
 * Same input always gives the same angle, so a slide looks identical every loop.
 */
export function tapeAngle(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

/**
 * A phone-number-ish string made legible from across a room: digits spaced out.
 * Anything that is not mostly digits is returned untouched.
 */
export function spaceNumber(text: string): string {
  const t = (text || "").trim();
  if (!/^[\d\s+()-]{5,}$/.test(t)) return t;
  return t.replace(/\s+/g, " ").trim();
}
