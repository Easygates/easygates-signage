// The splash family: the logo plate and the accent bar were hard-coded before —
// the plate was always white and the bar could only be changed by changing the
// whole slide palette. These tests lock in the two per-slide settings, the two
// extra splash layouts and the wiring in the renderer, player and editor.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_PLATE,
  accentBar,
  logoSource,
  plateColor,
  plateInk,
  readPlate,
  splashDetails,
} from "../src/components/scene/templates/splashKit.ts";
import {
  SPLASH_TEMPLATES,
  TEMPLATE_FIELDS,
  templateImageMode,
  templateIsSplash,
  templateRows,
  templateUses,
} from "../src/lib/templateFields.ts";
import { ITEM_TEMPLATES, TEMPLATES, TEMPLATE_CATEGORIES, templateCategory, TRADE_DEMO_SCENES } from "../src/lib/signage.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const ALL_SPLASH = ["splash", "splash-split", "splash-rail"];

describe("splash kit: the logo plate", () => {
  it("reads any stored value safely", () => {
    assert.deepEqual(readPlate(undefined), { mode: "auto", color: "" });
    assert.deepEqual(readPlate(""), { mode: "auto", color: "" });
    assert.deepEqual(readPlate("auto"), { mode: "auto", color: "" });
    assert.deepEqual(readPlate("NONE"), { mode: "none", color: "" });
    assert.deepEqual(readPlate("transparent"), { mode: "none", color: "" });
    assert.deepEqual(readPlate("#123456"), { mode: "custom", color: "#123456" });
    assert.deepEqual(readPlate("nonsense"), { mode: "auto", color: "" }, "a bad hex falls back to the business setting");
  });

  it("auto follows the business logo badge, both ways", () => {
    assert.equal(plateColor({ logoPlateColor: "", brandLogoOnWhite: true }), DEFAULT_PLATE);
    assert.equal(plateColor({ logoPlateColor: "", brandLogoOnWhite: false }), null, "a silver mark needs no plate");
  });

  it("defaults to the historical white plate when there is no business information", () => {
    assert.equal(plateColor({}), DEFAULT_PLATE);
  });

  it("none removes the plate and a custom colour wins over the business setting", () => {
    assert.equal(plateColor({ logoPlateColor: "none", brandLogoOnWhite: true }), null);
    assert.equal(plateColor({ logoPlateColor: "#07131f", brandLogoOnWhite: true }), "#07131f");
  });

  it("picks ink that reads on the plate", () => {
    assert.equal(plateInk("#ffffff", "#ffffff"), "#0b1620");
    assert.equal(plateInk("#07131f", "#ffffff"), "#ffffff");
    assert.equal(plateInk(null, "#ffffff"), "#ffffff", "no plate → the slide's own text colour");
  });
});

describe("splash kit: the accent bar", () => {
  it("uses the slide accent until a bar colour is set", () => {
    assert.equal(accentBar({}, "#f5a623"), "#f5a623");
    assert.equal(accentBar({ barColor: "" }, "#f5a623"), "#f5a623");
    assert.equal(accentBar({ barColor: "#ff0000" }, "#f5a623"), "#ff0000");
    assert.equal(accentBar({ barColor: "not-a-colour" }, "#f5a623"), "#f5a623");
  });
});

describe("splash kit: logo + details", () => {
  it("prefers the slide logo, then the business logo", () => {
    assert.equal(logoSource({ imageUrl: "/a.png", brandLogoUrl: "/b.png" }), "/a.png");
    assert.equal(logoSource({ imageUrl: "  ", brandLogoUrl: "/b.png" }), "/b.png");
    assert.equal(logoSource({}), "");
  });

  it("tidies the contact rows", () => {
    const scene = {
      items: [
        { name: "Call us", desc: "{phone}" },
        null,
        { name: "  " },
        { desc: "no label" },
        { name: "Find us", desc: "Add your address", tag: "pin" },
        { name: "Extra", desc: "fifth row is dropped" },
      ],
    };
    assert.deepEqual(splashDetails(scene, 4), [
      { name: "Call us", desc: "{phone}" },
      { name: "", desc: "no label" },
      { name: "Find us", desc: "Add your address", tag: "pin" },
      { name: "Extra", desc: "fifth row is dropped" },
    ]);
    assert.equal(splashDetails(scene, 2).length, 2, "the cap is respected");
    assert.deepEqual(splashDetails({ items: [{ name: "  " }, { desc: "" }] }), [], "empty rows are dropped");
    assert.deepEqual(splashDetails({}), []);
  });
});

describe("splash templates are wired everywhere", () => {
  it("all three are catalogued, grouped and editable", () => {
    for (const id of ALL_SPLASH) {
      assert.ok(TEMPLATES.some((t) => t.id === id), `${id} missing from the catalogue`);
      assert.equal(templateCategory(id), "brand", `${id} must sit in Brand & welcome`);
      assert.ok(ITEM_TEMPLATES.includes(id), `${id} must edit rows`);
      assert.equal(templateRows(id)[0], "name");
      assert.ok(TEMPLATE_FIELDS[id], `${id} missing from the field table`);
      assert.equal(templateImageMode(id), "logo", `${id} draws the image as a logo`);
      assert.equal(templateIsSplash(id), true);
      assert.equal(templateUses(id, "imageUrl"), true);
      assert.equal(templateUses(id, "ctaText"), true);
      assert.equal(templateUses(id, "promoPrice"), false);
    }
    assert.deepEqual(SPLASH_TEMPLATES, ALL_SPLASH);
    const brand = TEMPLATE_CATEGORIES.find((c) => c.id === "brand");
    assert.deepEqual(brand.templates, ALL_SPLASH);
  });

  it("the renderer draws all three", () => {
    const renderer = read("src/components/SceneRenderer.tsx");
    assert.ok(renderer.includes('t === "splash"'), "splash missing");
    assert.ok(renderer.includes('t === "splash-split"'), "splash-split missing");
    assert.ok(renderer.includes('t === "splash-rail"'), "splash-rail missing");
    assert.ok(renderer.includes("SplashSplitTemplate") && renderer.includes("SplashRailTemplate"));
  });

  it("each splash file documents its id and unused fields", () => {
    for (const [id, file] of [["splash", "Splash"], ["splash-split", "SplashSplit"], ["splash-rail", "SplashRail"]]) {
      const src = read(`src/components/scene/templates/${file}.tsx`);
      assert.match(src, new RegExp(`Template "${id}"`), `${file}.tsx should name the template id`);
      assert.match(src, /Not used:/, `${file}.tsx should list fields it does not draw`);
      assert.match(src, /logoPlateColor/, `${file}.tsx should document the plate setting`);
      assert.match(src, /barColor/, `${file}.tsx should document the bar setting`);
    }
  });

  it("the player hides its corner logo for every splash", () => {
    const screenView = read("src/components/ScreenView.tsx");
    assert.ok(screenView.includes("templateIsSplash(shown.template)"), "ScreenView must use the splash family helper");
    assert.ok(!screenView.includes('shown.template === "splash"'), "a single-template check would miss the new layouts");
  });

  it("the accent bar also colours the ticker + progress strip", () => {
    const screenView = read("src/components/ScreenView.tsx");
    assert.ok(screenView.includes("shown.barColor || shown.accentColor"), "the frame colour must respect barColor");
    assert.ok((screenView.match(/color=\{frameColor\}/g) || []).length === 2, "ticker and progress bar both take the frame colour");
  });

  it("the editor offers both settings and starter content", () => {
    const admin = read("src/app/admin/page.tsx");
    assert.ok(admin.includes("templateIsSplash(draft.template)"), "the controls must be gated on the splash family");
    assert.ok(admin.includes("Logo background"), "the logo-background control is missing");
    assert.ok(admin.includes("No plate"), "there must be a no-plate option");
    assert.ok(admin.includes("Plate colour"), "a custom plate colour is promised");
    assert.ok(admin.includes("Accent bar"), "the accent-bar control is missing");
    assert.ok(admin.includes("Match accent"), "the accent-bar reset is missing");
    for (const id of ALL_SPLASH) {
      // keys may be quoted ("splash-split":) or bare (splash:)
      assert.ok(admin.match(new RegExp(`["']?${id}["']?\\s*:\\s*\\{`)), `TEMPLATE_STARTERS is missing ${id}`);
    }
  });

  it("the trade demo shows all three layouts, so the selftest still covers every template", () => {
    const used = new Set(TRADE_DEMO_SCENES.map((s) => s.template));
    for (const id of ALL_SPLASH) assert.ok(used.has(id), `the trade demo is missing ${id}`);
    const scene = TRADE_DEMO_SCENES.find((s) => s.template === "splash-split");
    assert.ok(scene.items.length >= 3, "the split welcome needs contact rows");
    assert.ok(TRADE_DEMO_SCENES.find((s) => s.template === "splash-rail").barColor, "the rail demo shows the bar colour setting");
  });
});
