// Seasonal themes: the palette table is shared by the renderer, the brand layer and
// the admin picker, so it is checked here rather than in each of those places.
//
// The contracts that matter on a TV in a lit shop:
//  1. headline/body text stays readable on both ends of the background gradient;
//  2. muted text stays readable enough for a description line;
//  3. the second accent works as a *solid* block (it becomes the price plate /
//     sticker colour via scene.highlightColor) with black or white ink;
//  4. every animation class the decoration layer uses is actually defined in
//     globals.css — a class with no keyframes silently freezes the decoration;
//  5. reduced motion turns the whole decoration layer off.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contrast } from "../src/lib/color.ts";
import { THEMES, THEME_IDS, isLightTheme, themeDef, themePalette } from "../src/lib/themes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const decor = readFileSync(join(root, "src/components/scene/ThemeDecor.tsx"), "utf8");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const brand = readFileSync(join(root, "src/lib/brand.ts"), "utf8");

const INK = "#0f172a";

describe("themes: the table", () => {
  it("defines all eight seasons exactly once", () => {
    assert.deepEqual(THEME_IDS, ["none", "christmas", "easter", "halloween", "spring", "summer", "autumn", "winter"]);
    assert.equal(new Set(THEME_IDS).size, 8);
    assert.equal(THEMES.length, 8);
  });

  it("gives every theme a name, a blurb and a decoration summary for the picker", () => {
    for (const t of THEMES) {
      assert.ok(t.name.length > 2, `${t.id} has no display name`);
      assert.ok(t.blurb.length > 10, `${t.id} has no one-line description`);
      assert.ok(t.decor.length > 5, `${t.id} does not say what its decorations are`);
    }
  });

  it("falls back to the neutral theme for unknown or missing ids", () => {
    assert.equal(themeDef(undefined).id, "none");
    assert.equal(themeDef(null).id, "none");
    assert.equal(themeDef("midsummer").id, "none");
    assert.equal(themeDef("christmas").id, "christmas");
    assert.equal(themePalette("midsummer").accent, themePalette("none").accent);
  });

  it("keeps every colour a usable hex value", () => {
    for (const t of THEMES) {
      for (const [role, value] of Object.entries(t.palette)) {
        assert.match(value, /^#[0-9a-f]{6}$/i, `${t.id}.${role} is not a 6-digit hex colour: ${value}`);
      }
    }
  });
});

describe("themes: readability", () => {
  it("keeps body text above WCAG AA (4.5:1) on both ends of the background gradient", () => {
    for (const t of THEMES) {
      const from = contrast(t.palette.text, t.palette.bgFrom);
      const to = contrast(t.palette.text, t.palette.bgTo);
      assert.ok(from >= 4.5, `${t.id}: text on bgFrom is ${from.toFixed(1)}:1`);
      assert.ok(to >= 4.5, `${t.id}: text on bgTo is ${to.toFixed(1)}:1`);
    }
  });

  it("keeps muted text above 3:1 so descriptions and captions stay legible", () => {
    for (const t of THEMES) {
      const from = contrast(t.palette.muted, t.palette.bgFrom);
      const to = contrast(t.palette.muted, t.palette.bgTo);
      assert.ok(from >= 3, `${t.id}: muted on bgFrom is ${from.toFixed(1)}:1`);
      assert.ok(to >= 3, `${t.id}: muted on bgTo is ${to.toFixed(1)}:1`);
    }
  });

  it("keeps the two accents visibly different, not two shades of one hue", () => {
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (const t of THEMES) {
      if (t.id === "none") continue;
      const [a, b] = [rgb(t.palette.accent), rgb(t.palette.accent2)];
      const distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      // WCAG contrast is the wrong ruler here: a red and a violet can share a
      // luminance and still be obviously different on screen.
      assert.ok(distance >= 60, `${t.id}: accent and accent2 are too close (distance ${distance.toFixed(0)})`);
    }
  });

  it("makes accent2 usable as a solid price-plate colour with black or white ink", () => {
    for (const t of THEMES) {
      const best = Math.max(contrast(t.palette.accent2, INK), contrast(t.palette.accent2, "#ffffff"));
      assert.ok(best >= 4.5, `${t.id}: no ink reaches 4.5:1 on accent2 (best ${best.toFixed(1)}:1)`);
    }
  });

  it("marks exactly the pale themes as light", () => {
    const light = THEMES.filter((t) => t.light).map((t) => t.id);
    assert.deepEqual(light, ["easter", "spring"]);
    for (const t of THEMES) assert.equal(isLightTheme(t.id), Boolean(t.light));
  });
});

describe("themes: wired into the renderer", () => {
  it("brand mode writes the theme's second accent into highlightColor", () => {
    // The price plate / sticker colour comes from scene.highlightColor. Leaving it
    // unset made storeBoardParts.palette() fall back to the stock sale yellow on
    // every theme — plates ignored the theme entirely.
    assert.ok(brand.includes("out.highlightColor = tp.accent2"), "theme branch does not set highlightColor");
    assert.ok(!/function themePalette\s*\(/.test(brand), "brand.ts still carries its own palette table");
  });

  it("the decoration layer is present, keyed by theme, and reduced motion can kill it", () => {
    assert.ok(decor.includes("data-theme"), "decoration root is not tagged with the theme");
    assert.ok(decor.includes("export function ThemeDecor"), "ThemeDecor export missing");
    assert.ok(css.includes(".sg-reduced .sg-theme *"), "reduced motion does not stop theme animations");
    assert.ok(css.includes(".sg-reduced .sg-theme .sg-theme-falling"), "reduced motion still shows falling particles");
  });

  it("defines a keyframe for every animation class the decoration layer uses", () => {
    const used = [...new Set(decor.match(/sg-(?:fall|sway|twinkle|glow-pulse|drift|spin-slow|bob|snow)\b/g) ?? [])];
    assert.ok(used.length >= 5, `expected several decoration animations, found ${used.join(", ")}`);
    for (const name of used) {
      assert.ok(css.includes(`@keyframes ${name} `), `${name} has no @keyframes`);
      assert.ok(new RegExp(`\\.${name}\\s*\\{[^}]*animation-name:\\s*${name}`).test(css), `.${name} has no animation-name rule`);
    }
  });
});
