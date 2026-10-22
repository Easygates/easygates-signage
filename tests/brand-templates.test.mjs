// The twelve branded templates (six EasyGates Direct, six Smart & Secure) and
// their two demo campaigns. They must be catalogued, field-declared, demo-covered,
// wired into the renderer and the admin, and the pure kit must keep every pairing
// readable on both a dark industrial palette and a light showroom one.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_DEMO_SCENES,
  BRANDED_TEMPLATES,
  EASYGATES_DEMO_SCENES,
  FAILSAFE_SCENES,
  ITEM_TEMPLATES,
  SMARTSECURE_DEMO_SCENES,
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  buildTimeline,
  templateCategory,
} from "../src/lib/signage.ts";
import { TEMPLATE_FIELDS, templateImageMode, templateRows, templateUses } from "../src/lib/templateFields.ts";
import { contrast } from "../src/lib/color.ts";
import {
  alpha,
  bullets,
  chips,
  clockHand,
  columnCount,
  columnWidth,
  fallbackAccent2,
  handAngle,
  inkOn,
  kit,
  nudge,
  rows,
  solidFill,
  stars,
  stepLabel,
} from "../src/components/scene/templates/brandKit.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const EASYGATES = ["eg-kit-builder", "eg-safety-check", "eg-trade-tiers", "eg-delivery-cutoff", "eg-compare", "eg-support-hub"];
const SMARTSECURE = ["ss-zone-guide", "ss-scene-cards", "ss-package-cards", "ss-works-with", "ss-book-demo", "ss-product-spotlight"];
const FILES = {
  "eg-kit-builder": "EgKitBuilder",
  "eg-safety-check": "EgSafetyCheck",
  "eg-trade-tiers": "EgTradeTiers",
  "eg-delivery-cutoff": "EgDeliveryCutoff",
  "eg-compare": "EgCompare",
  "eg-support-hub": "EgSupportHub",
  "ss-zone-guide": "SsZoneGuide",
  "ss-scene-cards": "SsSceneCards",
  "ss-package-cards": "SsPackageCards",
  "ss-works-with": "SsWorksWith",
  "ss-book-demo": "SsBookDemo",
  "ss-product-spotlight": "SsProductSpotlight",
};

const ALL = [...EASYGATES, ...SMARTSECURE];

describe("branded templates are in the catalogue", () => {
  it("all twelve are catalogued with unique ids and copy", () => {
    assert.deepEqual(BRANDED_TEMPLATES, ALL, "BRANDED_TEMPLATES must list all twelve, in catalogue order");
    assert.equal(new Set(ALL).size, 12, "ids must be unique");
    for (const id of ALL) {
      const t = TEMPLATES.find((x) => x.id === id);
      assert.ok(t, `${id} is missing from TEMPLATES`);
      assert.ok(t.name && t.blurb && t.bestFor, `${id} needs a name, blurb and bestFor`);
    }
    assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, TEMPLATES.length, "the whole catalogue must stay unique");
  });

  it("they sit in their own brand groups, not an “other” bucket", () => {
    for (const id of EASYGATES) assert.equal(templateCategory(id), "easygates", `${id} must be in the EasyGates group`);
    for (const id of SMARTSECURE) assert.equal(templateCategory(id), "smartsecure", `${id} must be in the Smart & Secure group`);
    const groups = Object.fromEntries(TEMPLATE_CATEGORIES.map((c) => [c.id, c.templates]));
    assert.deepEqual(groups.easygates, EASYGATES);
    assert.deepEqual(groups.smartsecure, SMARTSECURE);
    for (const c of TEMPLATE_CATEGORIES) {
      assert.ok(c.name.length > 0, `${c.id} needs a display name`);
    }
  });

  it("every one edits rows, with the name first", () => {
    for (const id of ALL) {
      assert.ok(ITEM_TEMPLATES.includes(id), `${id} must be an item template`);
      assert.equal(templateRows(id)[0], "name", `${id}: "name" must be the first row field`);
      assert.ok(Object.keys(TEMPLATE_FIELDS).includes(id), `${id} missing from TEMPLATE_FIELDS`);
    }
  });

  it("declares exactly the fields its renderer draws", () => {
    // EasyGates — hero photo on the two product boards and the support hub
    for (const id of ["eg-kit-builder", "eg-delivery-cutoff", "eg-support-hub", "ss-book-demo", "ss-product-spotlight"]) {
      assert.equal(templateImageMode(id), "hero", `${id} should draw the slide image`);
      assert.equal(templateUses(id, "imageUrl"), true, `${id} should use imageUrl`);
    }
    // everything else is picture-per-row
    for (const id of ["eg-safety-check", "eg-trade-tiers", "eg-compare", "ss-zone-guide", "ss-scene-cards", "ss-package-cards", "ss-works-with"]) {
      assert.equal(templateImageMode(id), "none", `${id} should be image mode "none"`);
      assert.equal(templateUses(id, "imageUrl"), false, `${id} must not claim to use imageUrl`);
    }
    // prices: only the two boards with a slide-level price plate (the tier and
    // package prices live on the rows)
    for (const id of ["eg-kit-builder", "ss-product-spotlight"]) {
      assert.equal(templateUses(id, "promoPrice"), true, `${id} draws a slide-level price`);
      assert.equal(templateUses(id, "originalPrice"), true, `${id} draws a was-price`);
    }
    for (const id of ["eg-safety-check", "eg-trade-tiers", "eg-compare", "eg-support-hub", "ss-zone-guide", "ss-scene-cards", "ss-package-cards", "ss-works-with", "ss-book-demo"]) {
      assert.equal(templateUses(id, "promoPrice"), false, `${id} has no slide-level price`);
    }
    // the second accent is only offered where it is drawn
    for (const id of ["eg-kit-builder", "eg-safety-check", "eg-trade-tiers", "eg-compare", "ss-scene-cards", "ss-package-cards", "ss-product-spotlight"]) {
      assert.equal(templateUses(id, "highlightColor"), true, `${id} draws the highlight colour`);
    }
    for (const id of ["eg-delivery-cutoff", "eg-support-hub", "ss-zone-guide", "ss-works-with", "ss-book-demo"]) {
      assert.equal(templateUses(id, "highlightColor"), false, `${id} does not draw the highlight colour`);
    }
    // the product spotlight has no subheadline of its own
    assert.equal(templateUses("ss-product-spotlight", "subheadline"), false);
  });

  it("is rendered by SceneRenderer", () => {
    const renderer = read("src/components/SceneRenderer.tsx");
    for (const [id, file] of Object.entries(FILES)) {
      assert.ok(renderer.includes(`t === "${id}"`), `SceneRenderer does not render ${id}`);
      assert.ok(renderer.includes(`${file}Template`), `SceneRenderer does not import ${file}Template`);
    }
  });

  it("each template file documents its template id and unused fields", () => {
    for (const [id, file] of Object.entries(FILES)) {
      const source = read(`src/components/scene/templates/${file}.tsx`);
      assert.match(source, new RegExp(`Template "${id}"`), `${file}.tsx should name the template id`);
      assert.match(source, /Not used:/, `${file}.tsx should list the fields it does not draw`);
      // and the FIELDS block must name the rows it reads
      assert.match(source, /items\[\]/, `${file}.tsx should document its rows`);
    }
  });
});

describe("branded demo campaigns", () => {
  it("have one sample page per template, in both campaigns", () => {
    const eg = new Set(EASYGATES_DEMO_SCENES.map((s) => s.template));
    const ss = new Set(SMARTSECURE_DEMO_SCENES.map((s) => s.template));
    for (const id of EASYGATES) assert.ok(eg.has(id), `the EasyGates demo is missing ${id}`);
    for (const id of SMARTSECURE) assert.ok(ss.has(id), `the Smart & Secure demo is missing ${id}`);
    assert.equal(EASYGATES_DEMO_SCENES.length, EASYGATES.length);
    assert.equal(SMARTSECURE_DEMO_SCENES.length, SMARTSECURE.length);
  });

  for (const [label, scenes] of [
    ["EasyGates Direct", EASYGATES_DEMO_SCENES],
    ["Smart & Secure", SMARTSECURE_DEMO_SCENES],
  ]) {
    it(`${label}: every scene is valid`, () => {
      for (const s of scenes) {
        assert.ok(TEMPLATES.some((t) => t.id === s.template), `${s.name}: unknown template`);
        assert.ok(s.durationSec >= 6 && s.durationSec <= 20, `${s.name}: duration outside 6–20s`);
        assert.ok(s.headline, `${s.name}: needs a headline`);
        assert.ok((s.items || []).length > 0, `${s.name}: item template without rows`);
        assert.ok(s.ctaText, `${s.name}: needs a call to action`);
        const tl = buildTimeline(s);
        assert.ok(tl.every((v, i, a) => i === 0 || v.atMs >= a[i - 1].atMs), `${s.name}: timeline unordered`);
        assert.ok(tl.some((v) => v.key === "exit"), `${s.name}: no exit step`);
      }
    });

    it(`${label}: every scene is readable on its own palette`, () => {
      for (const s of scenes) {
        const k = kit(s);
        assert.ok(contrast(k.text, k.bgFrom) >= 7, `${s.name}: body text on the background`);
        assert.ok(contrast(k.muted, k.bgFrom) >= 4.5, `${s.name}: secondary text`);
        assert.ok(contrast(k.accent, k.bgFrom) >= 4.5, `${s.name}: accent as text`);
        assert.ok(contrast(k.accent2, k.bgFrom) >= 4.5, `${s.name}: second accent as text`);
        assert.ok(contrast(k.solidInk, k.solid) >= 4.5, `${s.name}: text on the accent fill`);
        assert.ok(contrast(k.solid2Ink, k.solid2) >= 4.5, `${s.name}: text on the second fill`);
      }
    });

    it(`${label}: uses bundled images only, so it works in the offline pack`, () => {
      for (const s of scenes) {
        const urls = [s.imageUrl, s.bgImageUrl, ...(s.items || []).map((i) => i.image)];
        for (const url of urls) {
          if (!url) continue;
          assert.ok(url.startsWith("/"), `${s.name}: expected a bundled public/ path, got ${url}`);
          assert.ok(existsSync(join(root, "public", url)), `missing file public${url}`);
        }
        assert.ok(ALL_DEMO_SCENES.includes(s), `${s.name} must be part of ALL_DEMO_SCENES`);
        assert.ok(FAILSAFE_SCENES.includes(s), `${s.name} uses bundled images, so it belongs in the failsafe pack`);
      }
    });
  }

  it("the two campaigns really do look like the two brands", () => {
    // EasyGates: deep navy, red/blue/amber. Smart & Secure: charcoal-teal, teal/coral/cream.
    const accentOf = (scenes) => new Set(scenes.map((s) => s.accentColor));
    const eg = accentOf(EASYGATES_DEMO_SCENES);
    const ss = accentOf(SMARTSECURE_DEMO_SCENES);
    assert.ok([...eg].every((c) => ["#ff3b43", "#2f9ade"].includes(c)), `EasyGates accents should be brand red or blue, got ${[...eg]}`);
    assert.ok([...ss].every((c) => ["#74c0cd", "#0d7283"].includes(c)), `Smart & Secure accents should be teal, got ${[...ss]}`);
    // and the background families must not be shared
    const bgOf = (scenes) => new Set(scenes.map((s) => s.bgFrom));
    for (const a of bgOf(EASYGATES_DEMO_SCENES)) assert.ok(!bgOf(SMARTSECURE_DEMO_SCENES).has(a), `${a} is used by both brands`);
  });

  it("is loadable from the admin and the seed endpoint", () => {
    const admin = read("src/app/admin/page.tsx");
    const seed = read("src/app/api/seed/route.ts");
    assert.ok(admin.includes('seed("easygates")'), "the admin header needs an EasyGates demo button");
    assert.ok(admin.includes('seed("smartsecure")'), "the admin header needs a Smart & Secure demo button");
    for (const campaign of ["easygates", "smartsecure"]) {
      assert.ok(seed.includes(`campaign === "${campaign}"`), `the seed route must accept campaign=${campaign}`);
    }
    assert.ok(seed.includes("EASYGATES_DEMO_SCENES") && seed.includes("SMARTSECURE_DEMO_SCENES"), "the seed route must use the new scenes");
    for (const id of ALL) {
      assert.ok(admin.includes(`"${id}": `), `ITEM_HINTS is missing ${id}`);
      assert.ok(admin.includes(`"${id}": {`), `TEMPLATE_STARTERS is missing ${id}`);
    }
  });
});

describe("brand kit (pure helpers)", () => {
  it("keeps every generated pairing readable on dark and light slides", () => {
    const palettes = [
      { bgFrom: "#07131f", bgTo: "#0c2130", accentColor: "#ff3b43", highlightColor: "#ffc21f", textColor: "#ffffff", mutedColor: "#a9c2d8" },
      { bgFrom: "#08161b", bgTo: "#0f2831", accentColor: "#74c0cd", highlightColor: "#d07374", textColor: "#ffffff", mutedColor: "#b9d3da" },
      { bgFrom: "#f4f8f9", bgTo: "#e4edf0", accentColor: "#0d7283", highlightColor: "#b0454a", textColor: "#10222a", mutedColor: "#46626d" },
      // hostile inputs: no highlight, no text colour, nonsense hexes
      { bgFrom: "nonsense", bgTo: "", accentColor: "pink", textColor: "", mutedColor: undefined },
    ];
    for (const p of palettes) {
      const k = kit(p);
      assert.ok(contrast(k.text, k.bgFrom) >= 7, `body text on ${k.bgFrom}`);
      assert.ok(contrast(k.text, k.bgTo) >= 7, `body text on ${k.bgTo}`);
      assert.ok(contrast(k.muted, k.bgFrom) >= 4.5, `secondary text on ${k.bgFrom}`);
      assert.ok(contrast(k.accent, k.bgFrom) >= 4.5, `accent on ${k.bgFrom}`);
      assert.ok(contrast(k.solidInk, k.solid) >= 4.5, "text on the accent fill");
      assert.ok(contrast(k.solid2Ink, k.solid2) >= 4.5, "text on the second fill");
      assert.match(k.card, /^#[0-9a-f]{6}$/i, "card must be a hex colour");
      assert.match(k.line, /^#[0-9a-f]{6}$/i, "line must be a hex colour");
    }
  });

  it("detects dark and light backgrounds", () => {
    assert.equal(kit({ bgFrom: "#07131f", bgTo: "#0c2130", accentColor: "#ff3b43" }).dark, true);
    assert.equal(kit({ bgFrom: "#f4f8f9", bgTo: "#e4edf0", accentColor: "#0d7283" }).dark, false);
  });

  it("solidFill picks ink that reads, and a fill close to the brand colour", () => {
    const red = solidFill("#ff3b43");
    assert.equal(red.ink, "#ffffff", "white text on a dark red");
    assert.ok(contrast(red.ink, red.fill) >= 4.5);
    const amber = solidFill("#ffc21f");
    assert.equal(amber.ink, "#0b1620", "dark text on amber");
    assert.ok(contrast(amber.ink, amber.fill) >= 4.5);
  });

  it("nudge only changes a colour when it has to", () => {
    assert.equal(nudge("#74c0cd", "#08161b", 4.5), "#74c0cd", "already readable — leave it alone");
    assert.notEqual(nudge("#74c0cd", "#f4f8f9", 4.5), "#74c0cd");
    assert.ok(contrast(nudge("#74c0cd", "#f4f8f9", 4.5), "#f4f8f9") >= 4.5);
  });

  it("fallbackAccent2 rotates a hue, and rescues greys", () => {
    assert.equal(fallbackAccent2("#ffffff"), "#1a7bbf", "greys fall back to a dependable blue");
    assert.equal(fallbackAccent2("#e11d2e"), "#2ee11d");
    assert.match(fallbackAccent2("not-a-colour"), /^#[0-9a-f]{6}$/);
  });

  it("inkOn picks the better of dark and light ink", () => {
    assert.equal(inkOn("#ffc21f"), "#0b1620");
    assert.equal(inkOn("#07131f"), "#ffffff");
  });

  it("alpha makes a rgba() string", () => {
    assert.equal(alpha("#ff3b43", 0.22), "rgba(255, 59, 67, 0.22)");
    assert.equal(alpha("nope", 0.5), "rgba(0,0,0,0.5)");
  });

  it("rows() tidies whatever is stored in items", () => {
    const scene = { items: [{ name: "Motor", price: "INCLUDED", tag: "NEW" }, null, 42, { name: "  Rail  " }, { desc: "no name" }] };
    assert.deepEqual(rows(scene), [{ name: "Motor", price: "INCLUDED", tag: "NEW" }, { name: "Rail" }, { name: "", desc: "no name" }]);
    assert.deepEqual(rows({}), []);
    assert.deepEqual(rows({ items: "nope" }), []);
    assert.equal(rows({ items: Array.from({ length: 20 }, (_, i) => ({ name: `r${i}` })) }, 6).length, 6, "respects the cap");
  });

  it("bullets() and chips() split a details field into points", () => {
    assert.deepEqual(bullets("One · Two • Three"), ["One", "Two", "Three"]);
    assert.deepEqual(bullets("One\nTwo"), ["One", "Two"]);
    assert.deepEqual(bullets("- Dash"), ["Dash"]);
    assert.deepEqual(bullets(""), []);
    assert.deepEqual(chips("Blinds up, lights warm, radio on"), ["Blinds up", "lights warm", "radio on"]);
    assert.equal(chips("a,b,c,d", 2).length, 2);
  });

  it("stars() turns a rating into glyphs", () => {
    assert.equal(stars("4.8"), "★★★★★");
    assert.equal(stars("3"), "★★★☆☆");
    assert.equal(stars(""), "★★★★★");
    assert.equal(stars("9"), "★★★★★", "ratings clamp at five");
  });

  it("stepLabel is zero-padded", () => {
    assert.equal(stepLabel(0), "01");
    assert.equal(stepLabel(9), "10");
  });

  it("columnCount and columnWidth always fill the row", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6].map(columnCount), [1, 2, 3, 2, 3, 3]);
    for (let cols = 1; cols <= 3; cols++) {
      const w = columnWidth(1808, cols, 24);
      assert.ok(w * cols + 24 * (cols - 1) <= 1808, `${cols} columns must fit`);
      assert.ok(w * cols + 24 * (cols - 1) > 1808 - cols * 2, `${cols} columns should fill the row`);
    }
  });

  it("the delivery clock reads any cut-off format", () => {
    assert.deepEqual(clockHand("3PM"), { hour: 15, minute: 0 });
    assert.deepEqual(clockHand("3pm"), { hour: 15, minute: 0 });
    assert.deepEqual(clockHand("15:00"), { hour: 15, minute: 0 });
    assert.deepEqual(clockHand("9.30am"), { hour: 9, minute: 30 });
    assert.deepEqual(clockHand(""), { hour: 15, minute: 0 }, "no time → the 3pm default");
    const nine = handAngle(...Object.values(clockHand("9am")));
    assert.equal(nine.hourDeg, 270);
    assert.equal(handAngle(15, 0).hourDeg, 90);
  });
});
