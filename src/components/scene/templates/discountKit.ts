// Pure helpers shared by the three "big-box discount" templates (Price Drop, Multi-Buy, Clearance).
// No React and no imports, so node can test it directly (tests/discount-kit.test.mjs). The colour
// maths from src/lib/color.ts is passed in instead of imported, for the same reason.

/** Dark ink for text on light surfaces: 17:1 on white. */
export const INK = "#0f172a";
/** Secondary ink on white: 10:1. */
export const INK_SOFT = "#334155";
export const WHITE = "#ffffff";

const YELLOW = "#ffd60a";
const NAVY = "#1e3a8a";
const FALLBACK_ACCENT = "#dc2626";
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** The subset of src/lib/color.ts these helpers need. */
export interface ColourFns {
  contrast: (a: string, b: string) => number;
  mixHex: (a: string, b: string, t: number) => string;
  luminance: (hex: string) => number;
}

/**
 * A solid fill built from `accent` plus the text colour that reads on it at `min`:1 or better.
 * Dark-ish accents (red, blue, green) stay as saturated as possible and get white text, darkened
 * only as far as needed. Light accents (yellow, amber, sky) get dark text and are lightened if needed.
 */
export function solidFor(accent: string, min: number, c: ColourFns): { bg: string; ink: string } {
  const base = HEX.test(accent) ? accent : FALLBACK_ACCENT;
  const light = c.luminance(base) > 0.28;
  const ink = light ? INK : WHITE;
  const [h, s, l] = hexToHsl(base);
  // Move only the lightness: keeps the hue and saturation, so red stays red instead of turning brown.
  for (let i = 0; i <= 100; i++) {
    const bg = i === 0 ? base : hslToHex(h, s, light ? l + ((1 - l) * i) / 100 : l * (1 - i / 100));
    if (c.contrast(bg, ink) >= min) return { bg, ink };
  }
  return { bg: light ? WHITE : "#000000", ink };
}

/** "#rrggbb" / "#rgb" to [hue 0-360, saturation 0-1, lightness 0-1]. */
export function hexToHsl(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  return [(hue * 60 + 360) % 360, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export interface DiscountPalette {
  /** the accent as a solid (>= 7:1 against `mainInk`) */
  main: string;
  mainInk: string;
  /** a darker shade of main, for extruded edges and shadows */
  deep: string;
  /** the second colour: sale yellow, or deep blue when the accent itself is light */
  pop: string;
  popInk: string;
}

export function discountPalette(accent: string, c: ColourFns): DiscountPalette {
  const { bg, ink } = solidFor(accent, 7, c);
  const lightMain = c.luminance(bg) > 0.35;
  return {
    main: bg,
    mainInk: ink,
    deep: c.mixHex(bg, "#000000", 0.3),
    pop: lightMain ? NAVY : YELLOW,
    popInk: lightMain ? WHITE : INK,
  };
}

// ── Text measuring ───────────────────────────────────────────────────────────
// Widths in em for a heavy (800-900) Inter-like face with the tight tracking the slides use, about 7%
// wider than measured so a slightly wider system font still fits. Wider fonts than that are caught at
// run time by useFitShrink (discountShapes.tsx), which steps the sizes down if the slide overflows.

const WIDTH_FUDGE = 0.94;

export function charEm(ch: string): number {
  return WIDTH_FUDGE * rawEm(ch);
}

function rawEm(ch: string): number {
  if (ch === " ") return 0.3;
  if (ch === "%") return 1.08;
  if (ch === "£" || ch === "$" || ch === "€") return 0.68;
  if (/[0-9]/.test(ch)) return 0.67;
  if (/[A-Z]/.test(ch)) return ch === "I" ? 0.4 : ch === "W" || ch === "M" ? 0.92 : 0.74;
  if (/[a-z]/.test(ch)) return ch === "i" || ch === "l" || ch === "j" ? 0.34 : ch === "m" || ch === "w" ? 0.92 : 0.6;
  if (/[.,:;!'’|]/.test(ch)) return 0.36;
  return 0.66;
}

/** Width of `text` in em on a single line. */
export function textEm(text: string): number {
  let w = 0;
  for (const ch of text) w += charEm(ch);
  return w;
}

/** How many lines `text` takes at `size` px inside `width` px (greedy word wrap). */
export function lineCount(text: string, size: number, width: number): number {
  const t = (text || "").trim();
  if (!t) return 0;
  const room = Math.max(1, width / size);
  const space = charEm(" ");
  let lines = 1;
  let used = 0;
  for (const word of t.split(/\s+/)) {
    const w = textEm(word);
    if (w > room) {
      // a word wider than the box gets broken over several lines
      const extra = Math.ceil(w / room);
      lines += used > 0 ? extra : extra - 1;
      used = w - (extra - 1) * room;
      continue;
    }
    if (used === 0) used = w;
    else if (used + space + w <= room) used += space + w;
    else {
      lines++;
      used = w;
    }
  }
  return lines;
}

export interface Fit {
  size: number;
  lines: number;
  /** estimated block height in px */
  height: number;
}

/**
 * Largest size from `sizes` (any order) at which `text` wraps into at most `maxLines` lines and fits
 * `maxHeight`. If nothing fits, the smallest size is returned so the text always renders.
 */
export function fitBlock(
  text: string,
  o: { width: number; maxHeight?: number; maxLines?: number; sizes: number[]; lineHeight?: number }
): Fit {
  const lh = o.lineHeight ?? 1;
  const sizes = [...o.sizes].sort((a, b) => b - a);
  let last: Fit = { size: sizes[sizes.length - 1], lines: 0, height: 0 };
  for (const size of sizes) {
    const lines = lineCount(text, size, o.width);
    last = { size, lines, height: Math.ceil(lines * size * lh) };
    if (lines <= (o.maxLines ?? 99) && last.height <= (o.maxHeight ?? Infinity)) return last;
  }
  return last;
}

/** Biggest single-line size (px) for `text` inside `width`, clamped to [min, max]. */
export function fitLine(text: string, width: number, max: number, min: number): number {
  const em = textEm((text || "").trim());
  if (em <= 0) return max;
  return Math.max(min, Math.min(max, Math.floor(width / em)));
}

// ── Vertical budgets ─────────────────────────────────────────────────────────

/** Shrink steps tried, in order, when a slide's text does not fit the 1080px canvas. */
export const SCALES = [1, 0.9, 0.8, 0.7, 0.6];

/** First scale in SCALES at which `needed(scale)` px fits in `avail` px (the smallest if none does). */
export function pickScale(needed: (scale: number) => number, avail: number): number {
  for (const k of SCALES) if (needed(k) <= avail) return k;
  return SCALES[SCALES.length - 1];
}

/** `k` moved `steps` places further down SCALES (never past the smallest). */
export function stepScale(k: number, steps: number): number {
  const at = Math.max(0, SCALES.indexOf(k));
  return SCALES[Math.min(SCALES.length - 1, at + Math.max(0, steps))];
}

/** `sizes` shrunk by `k` but never below `floor`, without duplicates. */
export function scaleSizes(sizes: number[], k: number, floor: number): number[] {
  const out = new Set<number>();
  for (const s of sizes) out.add(Math.max(floor, Math.round(s * k)));
  return [...out];
}

// ── Burst sticker text ───────────────────────────────────────────────────────

export interface BurstLine {
  text: string;
  size: number;
}

/**
 * Splits a sticker message ("SAVE £2", "-40%", "UP TO 50% OFF") into 1-3 lines sized to fill a
 * `box` px wide, `height` px tall area. Picks the split whose smallest line is as big as possible,
 * and gives the numeric line the most weight.
 */
export function burstLines(text: string, box = 220, height = 190): BurstLine[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const MAX = 112;
  const MIN = 30;
  const emphasise = (s: string) => /[0-9£$€%]/.test(s);
  const n = words.length;
  // every way of cutting the words into 1-3 consecutive lines
  const cutSets: number[][] = [[]];
  for (let a = 1; a < n; a++) {
    cutSets.push([a]);
    for (let b = a + 1; b < n; b++) cutSets.push([a, b]);
  }
  let best: { lines: BurstLine[]; score: number } | null = null;
  for (const cuts of cutSets) {
    const edges = [0, ...cuts, n];
    const lines: BurstLine[] = [];
    for (let i = 0; i < edges.length - 1; i++) {
      const part = words.slice(edges[i], edges[i + 1]).join(" ");
      const cap = emphasise(part) ? MAX : 76;
      lines.push({ text: part, size: Math.max(MIN, Math.min(cap, Math.floor(box / textEm(part)))) });
    }
    const total = lines.reduce((s, l) => s + l.size * 0.95, 0);
    let score = Math.min(...lines.map((l) => l.size));
    if (total > height) score -= (total - height) * 2;
    if (!best || score > best.score + 0.5) best = { lines, score };
  }
  return best ? best.lines : [];
}

// ── Item layout ──────────────────────────────────────────────────────────────

/** Card width in px for `count` cards sharing `room` px with `gap` between them. */
export function cardWidth(count: number, room: number, gap: number, max: number): number {
  if (count <= 0) return max;
  return Math.min(max, Math.floor((room - gap * (count - 1)) / count));
}

/** Points string for an SVG starburst polygon centred on (cx, cy). */
export function burstPoints(cx: number, cy: number, outer: number, inner: number, spikes: number, rotateDeg = 0): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes + (rotateDeg * Math.PI) / 180 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}
