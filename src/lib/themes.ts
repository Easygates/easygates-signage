// ─── Seasonal themes ────────────────────────────────────────────────────────
//
// One definition per theme, used by both the renderer (colours + decorations)
// and the admin picker (swatch + name). Before this file existed the palettes
// were duplicated in ThemeDecor.tsx and brand.ts, and the admin carried a third
// hand-written list of swatch colours.
//
// Palette rules (enforced by tests/themes.test.mjs):
//  - text on bgFrom and on bgTo must reach WCAG AA (4.5:1) — slides are read
//    from across a shop;
//  - muted text must reach 3:1;
//  - every theme has a second accent (accent2) so decorations can be two-tone;
//  - backgrounds are deep, not flat primaries: a TV in a lit shop washes out
//    pure #dc2626 / #0ea5e9, and a single hue reads as "someone changed the
//    background colour" rather than a seasonal skin.
//
// The contrast checks live in tests/themes.test.mjs (this file stays data-only
// so it can be imported by both the browser bundle and plain `node --test`).

export type ThemeId = "none" | "christmas" | "easter" | "halloween" | "spring" | "summer" | "autumn" | "winter";

export interface ThemePalette {
  /** Hero colour: flags, stickers, price plates. */
  accent: string;
  /**
   * Second colour. Doubles as the sale/highlight colour (price plates, stickers, tape),
   * so it must work as a large solid block with black or white ink — not only as a
   * petal tint. Picked to stay in the theme's family rather than fight the accent.
   */
  accent2: string;
  bgFrom: string;
  bgTo: string;
  /** Body text on the background. */
  text: string;
  /** Secondary text on the background. */
  muted: string;
}

export interface ThemeDef {
  id: ThemeId;
  name: string;
  /** One line shown in the admin picker. */
  blurb: string;
  /** What the decoration layer draws, for the admin/tooltips. */
  decor: string;
  /** true = pale background, so decoration layers blend differently. */
  light?: boolean;
  palette: ThemePalette;
}

export const THEMES: ThemeDef[] = [
  {
    id: "none",
    name: "None",
    blurb: "Clean brand background, no seasonal props",
    decor: "Nothing drawn — the plain gradient background",
    palette: { accent: "#ff3b30", accent2: "#ffd60a", bgFrom: "#0b1020", bgTo: "#1e2a5a", text: "#ffffff", muted: "#c7cede" },
  },
  {
    id: "christmas",
    name: "Christmas",
    blurb: "Evergreen night, gold lights, snowfall",
    decor: "String lights, bunting, drifting snow, pine sprigs",
    palette: { accent: "#e11d48", accent2: "#f5c542", bgFrom: "#07150f", bgTo: "#3b0d18", text: "#fff6f3", muted: "#f0c2b8" },
  },
  {
    id: "easter",
    name: "Easter",
    blurb: "Pale dawn, blossom, painted eggs",
    decor: "Blossom branches, falling petals, painted eggs",
    light: true,
    palette: { accent: "#d6336c", accent2: "#7c3aed", bgFrom: "#fff8fb", bgTo: "#ffe1ec", text: "#4a1130", muted: "#8a2b57" },
  },
  {
    id: "halloween",
    name: "Halloween",
    blurb: "Violet night, moon, glowing pumpkins",
    decor: "Moon, bats, cobweb, lit pumpkins, fog",
    palette: { accent: "#fb923c", accent2: "#a855f7", bgFrom: "#12081c", bgTo: "#3a1338", text: "#fff2e0", muted: "#e0a072" },
  },
  {
    id: "spring",
    name: "Spring",
    blurb: "Fresh daylight, grass, falling blossom",
    decor: "Blossom branch, petals, grass tufts, butterflies",
    light: true,
    palette: { accent: "#16a34a", accent2: "#facc15", bgFrom: "#f3fbf4", bgTo: "#d5efdc", text: "#0f3520", muted: "#2f6b42" },
  },
  {
    id: "summer",
    name: "Summer",
    blurb: "Deep sea to sky, sun and waves",
    decor: "Sun with rays, layered waves and foam, gulls",
    palette: { accent: "#06b6d4", accent2: "#fbbf24", bgFrom: "#03243a", bgTo: "#0b6a8a", text: "#f2fbff", muted: "#a5e0f2" },
  },
  {
    id: "autumn",
    name: "Autumn",
    blurb: "Low amber light, leaves, mist",
    decor: "Falling leaves, low sun glow, drifting mist, tree",
    palette: { accent: "#f59e0b", accent2: "#b45309", bgFrom: "#241003", bgTo: "#6b2c0c", text: "#fff4e6", muted: "#f0b98f" },
  },
  {
    id: "winter",
    name: "Winter",
    blurb: "Glacier blue, aurora, deep snow",
    decor: "Aurora bands, snow with sparkle, frozen corners",
    palette: { accent: "#38bdf8", accent2: "#a5b4fc", bgFrom: "#04121f", bgTo: "#1b4a64", text: "#f2fbff", muted: "#b6dcf0" },
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

/** Palette for a theme id; unknown / missing ids fall back to "none". */
export function themePalette(id: string | undefined | null): ThemePalette {
  return (BY_ID.get((id ?? "none") as ThemeId) ?? BY_ID.get("none")!).palette;
}

/** Full definition (name, blurb, decor) for a theme id. */
export function themeDef(id: string | undefined | null): ThemeDef {
  return BY_ID.get((id ?? "none") as ThemeId) ?? BY_ID.get("none")!;
}

export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id);

/** true when the theme's background is pale (decor blends in "multiply" mode). */
export function isLightTheme(id: string | undefined | null): boolean {
  return Boolean(themeDef(id).light);
}
