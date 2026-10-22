// ─── Trade-counter kit ───────────────────────────────────────────────────────
// Pure helpers shared by the five Screwfix-style templates (bulk-buy, shelf-edge,
// flash-sale, click-collect, trade-account). No imports on purpose: this file is
// unit-tested straight from Node (tests/trade-counter.test.mjs), so the colour
// maths is passed in by the caller exactly like discountKit.ts.

export const COUNTER_PAPER = "#f6f4ef";
export const COUNTER_INK = "#111827";
export const COUNTER_MUTED = "#64748b";
export const COUNTER_HAZARD = "#ffd60a";
export const COUNTER_RED = "#e11d2e";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export interface ColourFns {
  contrast: (a: string, b: string) => number;
  luminance: (hex: string) => number;
  mixHex: (a: string, b: string, t: number) => string;
}

export interface CounterPalette {
  /** accent deepened/lightened until text on it reads at 7:1 */
  accent: string;
  accentInk: string;
  /** a darker accent for extruded edges and shadows */
  deep: string;
  /** the second colour (safety yellow by default) */
  pop: string;
  popInk: string;
  /** the accent as readable text on the paper cards */
  onPaper: string;
}

export function counterPalette(
  accent: string,
  highlight: string | undefined,
  c: ColourFns,
  min = 7
): CounterPalette {
  const base = HEX.test(accent) ? accent : COUNTER_RED;
  const light = c.luminance(base) > 0.32;
  const ink = light ? COUNTER_INK : "#ffffff";
  const target = light ? "#ffffff" : "#000000";

  let solid = base;
  for (let t = 0; t <= 1.0001; t += 0.04) {
    solid = c.mixHex(base, target, t);
    if (c.contrast(solid, ink) >= min) break;
  }

  const pop = highlight && HEX.test(highlight) ? highlight : COUNTER_HAZARD;
  const popInk =
    c.contrast(pop, COUNTER_INK) >= c.contrast(pop, "#ffffff") ? COUNTER_INK : "#ffffff";

  let onPaper = base;
  for (let t = 0; t <= 1.0001 && c.contrast(onPaper, COUNTER_PAPER) < min; t += 0.05) {
    onPaper = c.mixHex(base, COUNTER_INK, t);
  }

  return {
    accent: solid,
    accentInk: ink,
    deep: c.mixHex(solid, "#000000", 0.35),
    pop,
    popInk,
    onPaper,
  };
}

// ───────────────────────── deterministic workshop details ─────────────────────────

/** FNV-1a — stable across renders, so a product keeps the same cat number. */
export function hashSeed(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** A five-digit catalogue number, e.g. "RF48213". */
export function catCode(seed: string, prefix = "RF"): string {
  return `${prefix}${(hashSeed(seed || prefix) % 90000) + 10000}`;
}

/** Bar widths (1–3 modules) for a barcode seeded from the product name. */
export function barcodeBars(seed: string, count = 40): number[] {
  let x = hashSeed(seed || "barcode") || 1;
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    bars.push(1 + (x % 3));
  }
  return bars;
}

/** Pixel width of a barcode: bars plus the gaps between them. */
export function barcodeWidth(bars: number[], unit = 3, gap = 2): number {
  if (!bars.length) return 0;
  return bars.reduce((total, bar) => total + bar * unit, 0) + (bars.length - 1) * gap;
}

/** A 5-digit run number for the trade card, e.g. "04821". */
export function cardNumber(seed: string): string {
  return String(hashSeed(seed || "trade") % 100000).padStart(5, "0");
}

// ───────────────────────── pricing ─────────────────────────

function toNumber(value?: string | null): number | null {
  const match = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

/**
 * The saving between an old price and a new one, e.g. "SAVE £50" for £149.99 → £99.99,
 * or "-33%" when the saving is not a neat amount. Empty when there is nothing to compare,
 * so a caller can fall back to the editor's own discountBadge.
 */
export function savingLabel(original?: string | null, promo?: string | null): string {
  const was = toNumber(original);
  const now = toNumber(promo);
  if (was === null || now === null || now <= 0 || was <= now) return "";
  const diff = Math.round((was - now) * 100) / 100;
  const pct = Math.round((diff / was) * 100);
  const symbol = (String(original).match(/[£$€]/) || String(promo).match(/[£$€]/) || [""])[0];
  if (symbol && Number.isInteger(diff) && pct >= 5) {
    return `SAVE ${symbol}${diff.toLocaleString("en-GB")}`;
  }
  return `-${pct}%`;
}

// ───────────────────────── layout ─────────────────────────

export interface ShelfGrid {
  /** columns in the 6-column shelf grid */
  columns: number;
  /** items per row */
  rows: number[];
  /** column span of each label, in the same order as the rows */
  spans: number[];
}

/**
 * Label sizes for 1–6 shelf-edge deals. Every row fills the six columns exactly:
 * one hero label, two halves, three thirds, two half-width rows, a 3+2 mix, or a 3×2 grid.
 */
export function shelfGrid(count: number): ShelfGrid {
  const n = Math.max(0, Math.min(6, Math.floor(count)));
  if (n === 0) return { columns: 0, rows: [], spans: [] };
  if (n === 1) return { columns: 1, rows: [1], spans: [6] };
  if (n === 2) return { columns: 2, rows: [2], spans: [3, 3] };
  if (n === 3) return { columns: 3, rows: [3], spans: [2, 2, 2] };
  if (n === 4) return { columns: 2, rows: [2, 2], spans: [3, 3, 3, 3] };
  if (n === 5) return { columns: 6, rows: [3, 2], spans: [2, 2, 2, 3, 3] };
  return { columns: 3, rows: [3, 3], spans: [2, 2, 2, 2, 2, 2] };
}

/** Width of a tile spanning `span` of `columns`, for a grid `totalW` wide with `gap` between. */
export function spanWidth(span: number, totalW: number, gap = 20, columns = 6): number {
  const unit = (totalW - gap * (columns - 1)) / columns;
  return Math.max(0, unit * span + gap * (span - 1));
}

/** Two-digit step label: "01", "02"… */
export function stepLabel(index: number): string {
  return String(Math.max(0, Math.floor(index)) + 1).padStart(2, "0");
}

/**
 * Points for a jagged "flash sale" burst, alternating between the outer and inner
 * radius. Deterministic so the SVG is identical on the server and after hydration.
 */
export function starburstPoints(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  spokes = 16
): string {
  const pts: string[] = [];
  const total = Math.max(6, Math.floor(spokes)) * 2;
  for (let i = 0; i < total; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / Math.max(6, Math.floor(spokes)) - Math.PI / 2;
    pts.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return pts.join(" ");
}
