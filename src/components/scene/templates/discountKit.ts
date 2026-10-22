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

/** A slide field as trimmed text: "" for empty, null or missing, and numbers are tolerated. */
export function clean(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

// ── Text measuring ───────────────────────────────────────────────────────────
// Advance widths in em of Inter Black (weight 900), the widest weight the slides use, measured in the
// browser, plus a 5% margin so a slightly wider system font still fits. Letter-spacing is passed in
// separately (`tracking`, in em per character). Fonts much wider than Inter are caught at run time by
// useFitShrink (discountShapes.tsx), which steps the sizes down if the slide overflows.

const WIDTH_FUDGE = 1.05;
const FALLBACK_EM = 0.66;
const EM_CHARS = "0123456789!\"#$%&'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~£€·–—’‘“”…×½ ";
const EM_WIDTHS = [0.711, 0.452, 0.646, 0.669, 0.702, 0.666, 0.675, 0.595, 0.679, 0.675, 0.381, 0.625, 0.662, 0.666, 1.044, 0.695, 0.372, 0.388, 0.388, 0.608, 0.693, 0.373, 0.475, 0.373, 0.412, 0.373, 0.378, 0.693, 0.693, 0.693, 0.601, 1.059, 0.795, 0.668, 0.748, 0.723, 0.613, 0.584, 0.754, 0.75, 0.291, 0.596, 0.759, 0.565, 0.956, 0.77, 0.775, 0.656, 0.787, 0.668, 0.666, 0.687, 0.722, 0.795, 1.082, 0.786, 0.775, 0.694, 0.388, 0.412, 0.388, 0.5, 0.493, 0.401, 0.597, 0.646, 0.603, 0.646, 0.606, 0.422, 0.647, 0.649, 0.296, 0.296, 0.606, 0.296, 0.943, 0.649, 0.625, 0.646, 0.646, 0.434, 0.588, 0.399, 0.649, 0.632, 0.877, 0.609, 0.636, 0.59, 0.505, 0.405, 0.505, 0.693, 0.662, 0.7, 0.373, 0.5, 1, 0.353, 0.353, 0.625, 0.61, 1.119, 0.693, 0.91, 0.199];
const EM = new Map<string, number>(Array.from(EM_CHARS).map((c, i) => [c, EM_WIDTHS[i]]));

export function charEm(ch: string): number {
  return WIDTH_FUDGE * (EM.get(ch) ?? FALLBACK_EM);
}

/** Width of `text` in em on a single line, with `tracking` em of letter-spacing per character. */
export function textEm(text: string, tracking = 0): number {
  let w = 0;
  for (const ch of text) w += charEm(ch) + tracking;
  return w;
}

/** How many lines `text` takes at `size` px inside `width` px (greedy word wrap). */
export function lineCount(text: string, size: number, width: number, tracking = 0): number {
  const t = (text || "").trim();
  if (!t) return 0;
  const room = Math.max(1, width / size);
  const space = charEm(" ") + tracking;
  let lines = 1;
  let used = 0;
  for (const word of t.split(/\s+/)) {
    const w = textEm(word, tracking);
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
  o: { width: number; maxHeight?: number; maxLines?: number; sizes: number[]; lineHeight?: number; tracking?: number }
): Fit {
  const lh = o.lineHeight ?? 1;
  const sizes = [...o.sizes].sort((a, b) => b - a);
  let last: Fit = { size: sizes[sizes.length - 1], lines: 0, height: 0 };
  for (const size of sizes) {
    const lines = lineCount(text, size, o.width, o.tracking ?? 0);
    last = { size, lines, height: Math.ceil(lines * size * lh) };
    if (lines <= (o.maxLines ?? 99) && last.height <= (o.maxHeight ?? Infinity)) return last;
  }
  return last;
}

/** Biggest single-line size (px) for `text` inside `width`, clamped to [min, max]. */
export function fitLine(text: string, width: number, max: number, min: number, tracking = 0): number {
  const em = textEm((text || "").trim(), tracking);
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
export function burstLines(text: string, box = 232, height = 196): BurstLine[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const MAX = 112;
  const MIN = 30; // smallest size we like; below this a layout only wins if nothing better fits
  const HARD_MIN = 20;
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
    let smallest = Infinity;
    for (let i = 0; i < edges.length - 1; i++) {
      const part = words.slice(edges[i], edges[i + 1]).join(" ");
      const raw = Math.floor(box / textEm(part, -0.03));
      smallest = Math.min(smallest, raw);
      lines.push({ text: part, size: Math.max(HARD_MIN, Math.min(emphasise(part) ? MAX : 76, raw)) });
    }
    const total = lines.reduce((sum, l) => sum + l.size * 0.95, 0);
    // biggest smallest-line wins, but fewer lines are better and a stranded little word ("TO") is ugly
    const orphans = lines.filter((l) => !emphasise(l.text) && l.text.length <= 2).length;
    let score = Math.min(...lines.map((l) => l.size)) - 8 * (lines.length - 1) - 12 * orphans;
    if (total > height) score -= (total - height) * 2;
    if (smallest < MIN) score -= 1000 - smallest; // spills out of the sticker: last resort only
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
