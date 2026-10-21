// Pure helpers shared by the four value-store "board" templates (deals-grid, top-sellers,
// aisle-guide, store-services). No imports on purpose: this file is unit-tested straight from
// Node (tests/store-board.test.mjs) and runs unchanged in the browser.

// ───────────────────────── text measuring ─────────────────────────
// The slides use an Inter-like heavy sans. Browsers are the only real judge of text width, but
// templates need to pick a font size *before* they render, so we estimate with deliberately
// generous (slightly wide) per-character widths. Better a touch smaller than clipped.

const NARROW = new Set("iIl|!.,:;'`’‘’‘");
const SLIM = new Set("fjrt()[]/\\-–—");
const WIDE = new Set("mwMW@%&");

/** Approximate advance width of one character, in em (heavy weight, Inter-like). */
export function charEm(ch: string, upper = false): number {
  if (ch === " ") return 0.3;
  if (NARROW.has(ch)) return upper && ch === "I" ? 0.36 : 0.34;
  if (/[0-9]/.test(ch)) return 0.66;
  if ("£€$".includes(ch)) return 0.68;
  if (WIDE.has(ch)) return upper ? 0.98 : 0.96;
  if (SLIM.has(ch)) return upper ? 0.5 : 0.46;
  const isUpperLetter = ch !== ch.toLowerCase() || (upper && /[a-z]/i.test(ch));
  return isUpperLetter ? 0.76 : 0.62;
}

export interface TextOpts {
  /** text will be shown upper-case (CSS text-transform) */
  upper?: boolean;
  /** letter-spacing in em (negative = tighter) */
  ls?: number;
}

/** Estimated width of `text` on one line, in px at `px` font size. */
export function textWidth(text: string, px: number, o: TextOpts = {}): number {
  const ls = o.ls ?? 0;
  let em = 0;
  for (const ch of text) em += charEm(ch, o.upper) + ls;
  return Math.max(0, em) * px;
}

/** How many lines `text` needs in a box `boxW` px wide (greedy word wrap, long words break). */
export function countLines(text: string, px: number, boxW: number, o: TextOpts = {}): number {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return 0;
  const space = (charEm(" ") + (o.ls ?? 0)) * px;
  let lines = 1;
  let used = 0;
  for (const word of clean.split(" ")) {
    const w = textWidth(word, px, o);
    if (w > boxW) {
      // a word wider than the box breaks across lines
      if (used > 0) lines += 1;
      const extra = Math.ceil(w / boxW) - 1;
      lines += extra;
      used = w - extra * boxW;
      continue;
    }
    if (used === 0) used = w;
    else if (used + space + w <= boxW) used += space + w;
    else {
      lines += 1;
      used = w;
    }
  }
  return lines;
}

export interface FitOpts extends TextOpts {
  text: string;
  boxW: number;
  maxPx: number;
  minPx: number;
  maxLines?: number;
  /** line height as a multiple of the font size (default 1) */
  lineHeight?: number;
  /** available height in px, if the text must also fit vertically */
  boxH?: number;
}

export interface Fit {
  px: number;
  lines: number;
  /** false when even `minPx` does not fit (caller should clamp / ellipsis as a last resort) */
  fits: boolean;
}

/** Largest font size in [minPx, maxPx] at which `text` fits the box. */
export function fitText(o: FitOpts): Fit {
  const maxLines = o.maxLines ?? 1;
  const lh = o.lineHeight ?? 1;
  const text = (o.text || "").trim();
  if (!text) return { px: o.maxPx, lines: 0, fits: true };
  const top = Math.max(o.minPx, o.maxPx);
  for (let px = top; px >= o.minPx; px -= 2) {
    const lines = countLines(text, px, o.boxW, o);
    const okLines = lines <= maxLines;
    const okH = o.boxH === undefined || lines * px * lh <= o.boxH;
    if (okLines && okH) return { px, lines, fits: true };
  }
  return { px: o.minPx, lines: countLines(text, o.minPx, o.boxW, o), fits: false };
}

// ───────────────────────── safe input ─────────────────────────

export interface CleanItem {
  name: string;
  price?: string;
  desc?: string;
  tag?: string;
  image?: string;
}

function text(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

/**
 * Items come from stored JSON, so anything can be in there (numbers, nulls, a missing list).
 * Returns tidy items with every field a trimmed string; empty optional fields are left out.
 */
export function cleanItems(raw: unknown): CleanItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CleanItem[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as Record<string, unknown>;
    const item: CleanItem = { name: text(r.name) };
    for (const k of ["price", "desc", "tag", "image"] as const) {
      const v = text(r[k]);
      if (v) item[k] = v;
    }
    out.push(item);
  }
  return out;
}

// ───────────────────────── small text helpers ─────────────────────────

/** Split a details field into separate short lines: newline, or " · " / " • " / " | " separators. */
export function splitLines(text?: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\s*[\r\n]+\s*|\s+[·•|]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A tag that is only a rank number ("#1", "2", "No.3") adds nothing next to a rank badge. */
export function isRankTag(tag?: string | null): boolean {
  return /^(no\.?\s*)?#?\s*\d{1,2}$/i.test((tag || "").trim());
}

// ───────────────────────── grid layout ─────────────────────────

/** Tiles per row for n cards on a 6-column grid: no holes, widest rows first. */
export function gridRows(n: number): number[] {
  const count = Math.max(0, Math.min(6, Math.floor(n)));
  const table: number[][] = [[], [1], [2], [3], [2, 2], [3, 2], [3, 3]];
  return table[count];
}

/** Column span (out of 6) for every tile, in reading order. */
export function gridSpans(n: number): number[] {
  return gridRows(n).flatMap((perRow) => Array<number>(perRow).fill(6 / perRow));
}

// ───────────────────────── aisle guide ─────────────────────────

export type Arrow = "left" | "right" | "ahead";

/** layoutVariant → arrow direction. Anything unknown (including legacy "A"/"B" and empty) means ahead. */
export function arrowDirection(variant?: string | null): Arrow {
  const v = (variant || "").trim().toLowerCase();
  return v === "left" || v === "right" ? v : "ahead";
}

export interface AisleText {
  /** text for the big circle */
  label: string;
  /** small word above a number-like label ("AISLE"), or "" */
  caption: string;
  /** department name (the big heading) */
  department: string;
}

const AISLE_HEAD = /^(aisle|isle|bay|zone|section|row)\s*[-:#]?\s*([A-Za-z0-9]{1,6})$/i;
const NUMBER_LIKE = /^\d{1,3}\s?[A-Za-z]?$/;

/**
 * Works out what goes in the circle and what the big heading says.
 * Contract: productName = aisle label, headline = department.
 * Older slides stored it the other way round (headline "AISLE 7", productName "Tinned Goods");
 * if the headline looks like "AISLE 7" and the label is a long department-like name, swap them.
 */
export function aisleText(productName?: string | null, headline?: string | null): AisleText {
  const name = (productName || "").trim();
  const head = (headline || "").trim();
  const m = AISLE_HEAD.exec(head);
  if (m && name.length > 6) {
    const word = m[1].toUpperCase();
    return { label: m[2].toUpperCase(), caption: word === "ISLE" ? "AISLE" : word, department: name };
  }
  const label = name;
  return { label, caption: NUMBER_LIKE.test(label) ? "AISLE" : "", department: head };
}

/** Lines + font size for the label inside the circle (shrinks so up to 6 characters fit, wraps long names). */
export function aisleLabelLayout(label: string, innerW: number, maxPx = 330): { lines: string[]; px: number } {
  const clean = label.trim();
  if (!clean) return { lines: [], px: maxPx };
  const words = clean.split(/\s+/);
  const oneLine = clean.length <= 6 || words.length === 1;
  const lines = oneLine ? [clean] : words.length <= 3 ? words : [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  const fit = fitText({ text: longest, boxW: innerW, maxPx: lines.length > 1 ? Math.min(maxPx, 150) : maxPx, minPx: 40, upper: true, ls: -0.02 });
  return { lines, px: fit.px };
}

// ───────────────────────── store services icons ─────────────────────────

export const SERVICE_ICONS = [
  "collect", "returns", "hours", "help", "customer", "delivery", "photo", "pharmacy",
  "cafe", "parking", "trolley", "gift", "key", "pound", "info", "phone", "wifi", "tag", "glasses", "bag",
] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

/** Keyword → icon. Checked in order, so more specific words come first. */
const ICON_KEYWORDS: [ServiceIcon, string[]][] = [
  ["collect", ["collect", "click", "pick up", "pick-up", "pickup", "locker", "online"]],
  ["returns", ["return", "refund", "exchange", "swap"]],
  ["hours", ["hour", "open", "clock", "time", "late night", "closing"]],
  ["delivery", ["deliver", "courier", " van ", "shipping", "postage", " post "]],
  ["photo", ["photo", "print", "camera", "passport"]],
  ["pharmacy", ["pharm", "chemist", "prescription", "medicine", "health"]],
  ["glasses", ["optic", "glasses", "eye test", "eyecare"]],
  ["cafe", ["cafe", "café", "coffee", "restaurant", "food court", "tea room", "kitchen"]],
  ["parking", ["parking", "car park", " park "]],
  ["trolley", ["trolley", "basket", "shopping"]],
  ["gift", ["gift", "voucher", "gift card"]],
  ["key", ["key cut", " keys ", " key "]],
  ["wifi", ["wifi", "wi-fi", "internet"]],
  ["phone", ["phone", "call us", "ring us", " tel ", "mobile top"]],
  ["pound", ["price match", "cash", "money", "pay", "finance", "credit", "atm", "cashback", "£"]],
  ["tag", ["offer", "deal", "promo", "discount", "saving", "price"]],
  ["bag", ["bag", "carrier"]],
  ["customer", ["customer", "service desk", "support", "contact", "reception", "enquir", "desk"]],
  ["help", ["help", "assist", "advice", "question", "faq", "guide"]],
  ["info", ["info", "notice", "about"]],
];

const FALLBACK_ORDER: ServiceIcon[] = ["collect", "returns", "hours", "help", "delivery", "info"];

function iconFromWords(text: string): ServiceIcon | null {
  const t = ` ${text.toLowerCase().trim()} `;
  if (!t.trim()) return null;
  // an exact icon keyword wins ("collect", "photo" …)
  const exact = SERVICE_ICONS.find((id) => t.trim() === id);
  if (exact) return exact;
  for (const [icon, words] of ICON_KEYWORDS) {
    if (words.some((w) => t.includes(w))) return icon;
  }
  return null;
}

/** Icon for a service card: item.tag keyword first, then words in the title, then by position. */
export function serviceIcon(tag?: string | null, name?: string | null, index = 0): ServiceIcon {
  return iconFromWords(tag || "") ?? iconFromWords(name || "") ?? FALLBACK_ORDER[((index % FALLBACK_ORDER.length) + FALLBACK_ORDER.length) % FALLBACK_ORDER.length];
}

// ───────────────────────── top sellers rank styling ─────────────────────────

export interface RankTone {
  /** gradient start / end of the rank slab */
  from: string;
  to: string;
  /** numeral colour */
  ink: string;
}

/** Gold, silver and bronze for 1-3; strong neutral navy for the rest. Every ink reaches 7:1 on both ends. */
export function rankTone(rank: number): RankTone {
  if (rank === 1) return { from: "#ffe27a", to: "#f5b50a", ink: "#1a1204" };
  if (rank === 2) return { from: "#f8fafc", to: "#cbd5e1", ink: "#0f172a" };
  if (rank === 3) return { from: "#ffc58f", to: "#e68a3e", ink: "#1f0f02" };
  return { from: "#1e293b", to: "#0f172a", ink: "#ffffff" };
}
