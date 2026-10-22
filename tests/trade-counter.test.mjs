// Trade-counter retail templates (Screwfix-style) and their demo campaign.
// The five templates must be catalogued, field-declared, demo-covered, wired
// into the renderer, and their pure helpers must behave.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_DEMO_SCENES,
  COUNTER_DEMO_SCENES,
  FAILSAFE_SCENES,
  ITEM_TEMPLATES,
  TEMPLATES,
  TEMPLATE_CATEGORIES,
  buildTimeline,
  templateCategory,
} from "../src/lib/signage.ts";
import { TEMPLATE_FIELDS, templateImageMode, templateRows, templateUses } from "../src/lib/templateFields.ts";
import { contrast, luminance, mixHex } from "../src/lib/color.ts";
import {
  barcodeBars,
  barcodeWidth,
  cardNumber,
  catCode,
  counterPalette,
  hashSeed,
  savingLabel,
  shelfGrid,
  spanWidth,
  starburstPoints,
  stepLabel,
} from "../src/components/scene/templates/tradeCounterKit.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const NEW = ["bulk-buy", "shelf-edge", "flash-sale", "click-collect", "trade-account"];
const FILES = {
  "bulk-buy": "BulkBuy",
  "shelf-edge": "ShelfEdge",
  "flash-sale": "FlashSale",
  "click-collect": "ClickCollect",
  "trade-account": "TradeAccount",
};

describe("trade-counter templates are in the retail catalogue", () => {
  it("all five are catalogued with unique ids and copy", () => {
    const ids = TEMPLATES.map((t) => t.id);
    for (const id of NEW) {
      assert.ok(ids.includes(id), `${id} is missing from TEMPLATES`);
      const t = TEMPLATES.find((x) => x.id === id);
      assert.ok(t.name && t.blurb && t.bestFor, `${id} needs a name, blurb and bestFor`);
    }
    assert.equal(new Set(ids).size, ids.length, "template ids must be unique");
  });

  it("they sit in the retail category, not an “other” bucket", () => {
    for (const id of NEW) {
      assert.equal(templateCategory(id), "retail", `${id} must be in the retail group`);
    }
    const retail = TEMPLATE_CATEGORIES.find((c) => c.id === "retail");
    for (const id of NEW) assert.ok(retail.templates.includes(id), `${id} missing from the retail group`);
  });

  it("every one edits rows", () => {
    for (const id of NEW) {
      assert.ok(ITEM_TEMPLATES.includes(id), `${id} must be an item template`);
      assert.deepEqual(templateRows(id)[0], "name", `${id}: "name" must be the first row field`);
    }
  });

  it("declares exactly the fields its renderer draws", () => {
    assert.equal(templateUses("bulk-buy", "promoPrice"), true);
    assert.equal(templateUses("bulk-buy", "discountBadge"), true);
    assert.equal(templateImageMode("bulk-buy"), "hero");
    assert.equal(templateUses("shelf-edge", "imageUrl"), false, "each shelf row has its own photo");
    assert.equal(templateImageMode("shelf-edge"), "none");
    assert.equal(templateUses("flash-sale", "promoPrice"), true, "the big % is the promo price");
    assert.equal(templateUses("flash-sale", "imageUrl"), false);
    assert.equal(templateUses("click-collect", "productName"), true, "the dial label is the product name");
    assert.equal(templateUses("click-collect", "promoPrice"), false);
    assert.equal(templateUses("trade-account", "discountBadge"), true, "the stamp is the discount badge");
    assert.equal(templateUses("trade-account", "imageUrl"), false);
    for (const id of NEW) {
      assert.ok(Object.keys(TEMPLATE_FIELDS).includes(id), `${id} missing from TEMPLATE_FIELDS`);
    }
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
    }
  });
});

describe("trade-counter demo campaign", () => {
  it("has one sample page per template", () => {
    const covered = new Set(COUNTER_DEMO_SCENES.map((s) => s.template));
    for (const id of NEW) assert.ok(covered.has(id), `counter demo is missing ${id}`);
    assert.equal(COUNTER_DEMO_SCENES.length, NEW.length);
  });

  it("is valid and joins the built-in library", () => {
    for (const s of COUNTER_DEMO_SCENES) {
      assert.ok(TEMPLATES.some((t) => t.id === s.template), `${s.name}: unknown template`);
      assert.ok(s.durationSec >= 6 && s.durationSec <= 20, `${s.name}: duration outside 6–20s`);
      assert.ok((s.items || []).length > 0, `${s.name}: item template without rows`);
      assert.ok(s.headline, `${s.name}: needs a headline`);
      const tl = buildTimeline(s);
      assert.ok(tl.every((v, i, a) => i === 0 || v.atMs >= a[i - 1].atMs), `${s.name}: timeline unordered`);
      assert.ok(tl.some((v) => v.key === "exit"), `${s.name}: no exit step`);
    }
    for (const s of COUNTER_DEMO_SCENES) {
      assert.ok(ALL_DEMO_SCENES.includes(s), `${s.name} must be part of ALL_DEMO_SCENES`);
      // bundled photos → also usable in the offline failsafe pack
      assert.ok(FAILSAFE_SCENES.includes(s), `${s.name} uses bundled images, so it belongs in the failsafe pack`);
    }
  });

  it("only points at images that exist on disk", () => {
    for (const s of COUNTER_DEMO_SCENES) {
      const urls = [s.imageUrl, s.bgImageUrl, ...(s.items || []).map((i) => i.image)];
      for (const url of urls) {
        if (!url) continue;
        assert.ok(url.startsWith("/"), `${s.name}: expected a bundled public/ path, got ${url}`);
        assert.ok(existsSync(join(root, "public", url)), `missing file public${url}`);
      }
    }
  });

  it("is loadable from the admin and the seed endpoint", () => {
    const admin = read("src/app/admin/page.tsx");
    const seed = read("src/app/api/seed/route.ts");
    assert.ok(admin.includes('seed("counter")'), "the admin header needs a Trade counter demo button");
    assert.ok(seed.includes('campaign === "counter"'), "the seed route must accept campaign=counter");
    assert.ok(seed.includes("COUNTER_DEMO_SCENES"), "the seed route must use the counter scenes");
    for (const id of NEW) {
      assert.ok(admin.includes(`"${id}": `), `ITEM_HINTS is missing ${id}`);
      assert.ok(admin.includes(`"${id}": {`), `TEMPLATE_STARTERS is missing ${id}`);
    }
  });
});

describe("trade-counter kit", () => {
  it("hashSeed is deterministic and well distributed", () => {
    assert.equal(hashSeed("drill"), hashSeed("drill"));
    assert.notEqual(hashSeed("drill"), hashSeed("Drill"));
    const seen = new Set(Array.from({ length: 500 }, (_, i) => hashSeed(`item-${i}`)));
    assert.equal(seen.size, 500, "no collisions across 500 seeds");
  });

  it("catCode / cardNumber look like catalogue numbers", () => {
    assert.match(catCode("Assorted Wood Screws"), /^RF\d{5}$/);
    assert.equal(catCode("x"), catCode("x"));
    assert.match(cardNumber("Trade Account"), /^\d{5}$/);
  });

  it("barcode bars are stable, varied and measurable", () => {
    const bars = barcodeBars("Assorted Wood Screws", 40);
    assert.equal(bars.length, 40);
    assert.deepEqual(bars, barcodeBars("Assorted Wood Screws", 40));
    assert.ok(bars.every((b) => b >= 1 && b <= 3));
    assert.ok(new Set(bars).size > 1, "a barcode made of one bar width is not a barcode");
    assert.ok(barcodeWidth(bars, 3, 2) > barcodeWidth(barcodeBars("g", 10), 3, 2), "more bars are wider");
    assert.equal(barcodeWidth([], 3, 2), 0);
  });

  it("counterPalette keeps every accent readable", () => {
    const colours = { contrast, luminance, mixHex };
    for (const accent of ["#e11d2e", "#ef4444", "#ffce00", "#facc15", "#2563eb", "#16a34a", "#ffffff", "#000000", "nonsense"]) {
      const p = counterPalette(accent, undefined, colours);
      assert.ok(contrast(p.accent, p.accentInk) >= 7, `${accent} → ${p.accent} / ${p.accentInk}`);
      assert.ok(contrast(p.onPaper, "#f6f4ef") >= 7, `${accent}: price on paper is unreadable`);
      assert.ok(contrast(p.pop, p.popInk) >= 7, `${accent}: pop colour unreadable`);
      assert.match(p.pop, /^#[0-9a-f]{6}$/i, `${accent}: pop must be a hex colour`);
    }
    // a custom highlight replaces the default safety yellow
    assert.equal(counterPalette("#e11d2e", "#00a3ff", colours).pop, "#00a3ff");
    assert.equal(counterPalette("#e11d2e", "not-a-colour", colours).pop, "#ffd60a");
  });

  it("savingLabel turns two prices into a saving", () => {
    assert.equal(savingLabel("£149.99", "£99.99"), "SAVE £50");
    assert.equal(savingLabel("£34.99", "£24.99"), "SAVE £10");
    assert.equal(savingLabel("£19.99", "£14.99"), "SAVE £5");
    // odd amounts fall back to a percentage rather than a long decimal
    assert.equal(savingLabel("£10.00", "£8.50"), "-15%");
    // nothing sensible to compare
    assert.equal(savingLabel("", "£9.99"), "");
    assert.equal(savingLabel("£9.99", ""), "");
    assert.equal(savingLabel("£9.99", "£12.99"), "", "a price rise is not a saving");
    assert.equal(savingLabel("£0", "£9.99"), "");
  });

  it("shelfGrid always fills the six-column wall", () => {
    assert.deepEqual(shelfGrid(0), { columns: 0, rows: [], spans: [] });
    assert.deepEqual(shelfGrid(1).spans, [6]);
    assert.deepEqual(shelfGrid(2).spans, [3, 3]);
    assert.deepEqual(shelfGrid(3).spans, [2, 2, 2]);
    assert.deepEqual(shelfGrid(4).rows, [2, 2]);
    assert.deepEqual(shelfGrid(5).rows, [3, 2]);
    assert.deepEqual(shelfGrid(6).rows, [3, 3]);
    for (let n = 1; n <= 6; n++) {
      const g = shelfGrid(n);
      assert.equal(g.spans.length, n);
      let i = 0;
      for (const perRow of g.rows) {
        const row = g.spans.slice(i, i + perRow);
        assert.equal(row.reduce((a, b) => a + b, 0), 6, `n=${n}`);
        i += perRow;
      }
    }
    assert.equal(shelfGrid(99).spans.length, 6, "never more than six labels");
  });

  it("spanWidth never adds up to more than the board", () => {
    assert.equal(spanWidth(6, 1792, 20, 6), 1792);
    assert.ok(spanWidth(3, 1792, 20, 6) * 2 + 20 <= 1792 + 0.001);
  });

  it("stepLabel and the starburst are deterministic", () => {
    assert.equal(stepLabel(0), "01");
    assert.equal(stepLabel(9), "10");
    const pts = starburstPoints(100, 100, 90, 70);
    assert.equal(pts.split(" ").length, 32);
    assert.equal(pts, starburstPoints(100, 100, 90, 70));
  });
});
