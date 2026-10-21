// Colour helpers for slide templates: pick text colours that stay readable on any background.
// Pure functions, no imports — safe in client components and node tests.

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

/** "#abc" / "#aabbcc" → [r,g,b] (0-255), or null if it isn't a hex colour. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const h = (hex || "").trim();
  let m = HEX6.exec(h);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  m = HEX3.exec(h);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return [r, g, b];
  }
  return null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** WCAG relative luminance, 0 (black) – 1 (white). Unknown colours count as mid-dark. */
export function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.1;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 – 21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Whichever of `dark` / `light` reads better on `bg`. */
export function readableOn(bg: string, dark = "#0f172a", light = "#ffffff"): string {
  return contrast(bg, dark) >= contrast(bg, light) ? dark : light;
}

/** Mix a→b by t (0 = a, 1 = b). */
export function mixHex(a: string, b: string, t: number): string {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return a;
  return rgbToHex(ra[0] + (rb[0] - ra[0]) * t, ra[1] + (rb[1] - ra[1]) * t, ra[2] + (rb[2] - ra[2]) * t);
}

/**
 * Nudge `fg` towards black or white until it has at least `min` contrast against `bg`
 * (e.g. an accent colour used as text on a white card). Returns `fg` unchanged if it already passes.
 */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  if (!hexToRgb(fg) || !hexToRgb(bg) || contrast(fg, bg) >= min) return fg;
  const target = luminance(bg) > 0.4 ? "#000000" : "#ffffff";
  for (let t = 0.1; t <= 1.0001; t += 0.1) {
    const c = mixHex(fg, target, t);
    if (contrast(c, bg) >= min) return c;
  }
  return target;
}
