// Pure helpers shared by the three splash / welcome templates.
// No React and no JSX, so `node --test` can import this file directly (like
// brandKit and storeBoardKit).
//
// Two slide settings were missing from the first splash template — the plate
// behind the logo was hard-coded white and the accent bar could only be changed
// by changing the whole slide palette. Both now resolve here:
//
//   logoPlateColor  "" / "auto"  → follow the Business setting (logoOnWhite)
//                   "none"       → no plate at all (the logo floats)
//                   "#rrggbb"    → that colour
//   barColor        ""           → the slide's accent colour
//                   "#rrggbb"    → that colour
//
// Relative imports (not the "@/…" alias) so the file also loads from plain Node.

import type { Scene } from "../../../lib/signage.ts";
import { contrast, hexToRgb, rgbToHex } from "../../../lib/color.ts";
import { fitText, textWidth } from "./storeBoardKit.ts";

/** The plate colour the splash has always used when the business wants one. */
export const DEFAULT_PLATE = "#ffffff";
/** Ink used on a light plate. */
const PLATE_INK = "#0b1620";

export type PlateMode = "auto" | "none" | "custom";

/** Read a stored `logoPlateColor` value without trusting it. */
export function readPlate(value: string | undefined | null): { mode: PlateMode; color: string } {
  const raw = (value || "").trim().toLowerCase();
  if (!raw || raw === "auto" || raw === "business") return { mode: "auto", color: "" };
  if (raw === "none" || raw === "off" || raw === "transparent") return { mode: "none", color: "" };
  const rgb = hexToRgb(raw);
  return rgb ? { mode: "custom", color: rgbToHex(rgb[0], rgb[1], rgb[2]) } : { mode: "auto", color: "" };
}

/**
 * The plate behind the logo, or `null` for "no plate".
 *
 * `auto` follows the business: the EasyGates Direct silver mark wants a dark
 * background (logoOnWhite = false) so it gets no plate, while a coloured mark
 * gets the white badge. When there is no business information at all (a scene
 * rendered outside the player) the historical white plate is kept.
 */
export function plateColor(scene: Scene): string | null {
  const { mode, color } = readPlate(scene.logoPlateColor);
  if (mode === "none") return null;
  if (mode === "custom") return color;
  if (typeof scene.brandLogoOnWhite === "boolean") return scene.brandLogoOnWhite ? DEFAULT_PLATE : null;
  return DEFAULT_PLATE;
}

/** Ink for text sitting on the plate (the wordmark when there is no logo file). */
export function plateInk(plate: string | null, fallback: string): string {
  if (!plate) return fallback;
  return contrast(PLATE_INK, plate) >= contrast("#ffffff", plate) ? PLATE_INK : "#ffffff";
}

/** The accent bar colour: the slide's accent unless the editor picked one. */
export function accentBar(scene: Scene, accent: string): string {
  const rgb = scene.barColor ? hexToRgb(scene.barColor) : null;
  return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : accent;
}

/** The logo for this slide: its own image, then the business logo. */
export function logoSource(scene: Scene): string {
  return (scene.imageUrl || "").trim() || (scene.brandLogoUrl || "").trim();
}

/** Contact / detail rows tidied and capped (the three splash templates share this). */
export function splashDetails(scene: Scene, max = 4): { name: string; desc?: string; tag?: string }[] {
  const raw = Array.isArray(scene.items) ? scene.items : [];
  const out: { name: string; desc?: string; tag?: string }[] = [];
  for (const it of raw) {
    if (!it || typeof it !== "object") continue;
    const r = it as unknown as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const row = { name: str(r.name), desc: str(r.desc), tag: str(r.tag) };
    if (!row.name && !row.desc) continue;
    out.push({ name: row.name, ...(row.desc ? { desc: row.desc } : {}), ...(row.tag ? { tag: row.tag } : {}) });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Split a headline in two at its separator (" · ", " | ", " – ", " — "), at the one nearest the
 * middle, dropping the separator at the break. "Gates · Automation · Electrical" becomes
 * "Gates · Automation" / "Electrical" instead of wrapping with a stray "·" at the end of line one.
 */
export function splitAtSeparator(text: string): [string, string] | null {
  const t = (text || "").trim();
  const seps = [...t.matchAll(/\s[·|•–—]\s/g)];
  if (!seps.length) return null;
  const mid = t.length / 2;
  let best = seps[0];
  for (const m of seps) if (Math.abs((m.index ?? 0) + 1 - mid) < Math.abs((best.index ?? 0) + 1 - mid)) best = m;
  const at = best.index ?? 0;
  const left = t.slice(0, at).trim();
  const right = t.slice(at + best[0].length).trim();
  return left && right ? [left, right] : null;
}

/**
 * How to set a splash headline: on one line if it fits at a good size; otherwise on two lines broken at
 * a separator when it has one, otherwise wrapped by width. Returns the font size and the lines.
 */
export function headlinePlan(
  text: string,
  boxW: number,
  o: { oneMax: number; oneMin: number; twoMax: number; twoMin: number; ls?: number }
): { px: number; lines: string[] } {
  const t = (text || "").trim();
  if (!t) return { px: o.oneMax, lines: [] };
  const ls = o.ls ?? -0.02;
  const one = fitText({ text: t, boxW, maxPx: o.oneMax, minPx: o.oneMin, maxLines: 1, ls });
  if (one.fits) return { px: one.px, lines: [t] };
  const cut = splitAtSeparator(t);
  if (cut) {
    const widest = textWidth(cut[0], 100, { ls }) >= textWidth(cut[1], 100, { ls }) ? cut[0] : cut[1];
    const f = fitText({ text: widest, boxW, maxPx: o.twoMax, minPx: o.twoMin, maxLines: 1, ls });
    if (f.fits) return { px: f.px, lines: cut };
  }
  const two = fitText({ text: t, boxW, maxPx: o.twoMax, minPx: o.twoMin, maxLines: 2, ls });
  return { px: two.px, lines: [t] };
}

/**
 * Keep a time or number range together: "Mon–Fri 8am–4.30pm" may wrap between words, but never
 * between "8am–" and "4.30pm" (a word joiner stops the line breaking after the dash).
 */
export function glueRanges(text: string): string {
  return (text || "").replace(/([0-9a-z])([–—])(?=[0-9a-z])/gi, "$1$2\u2060");
}
