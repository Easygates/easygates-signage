// The single table of "which fields does this template draw" (src/lib/templateFields.ts)
// must stay in step with the renderers. These tests cross-check it against
//   (a) the template catalogue in src/lib/signage.ts,
//   (b) ITEM_TEMPLATES (a template with rows must declare the row fields), and
//   (c) the "FIELDS / Not used" doc comment at the top of every template file,
//       which is what the renderer authors maintain by hand.
// When a new template is added and nobody fills in the table, this fails.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATES, ITEM_TEMPLATES } from "../src/lib/signage.ts";
import {
  IMAGE_UNUSED_TEMPLATES,
  SCENE_TEXT_FIELDS,
  TEMPLATE_FIELDS,
  templateImageMode,
  templateRows,
  templateUses,
} from "../src/lib/templateFields.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = join(root, "src/components/scene/templates");

describe("template field table", () => {
  it("covers every template in the catalogue, and nothing else", () => {
    const catalogued = TEMPLATES.map((t) => t.id).sort();
    const described = Object.keys(TEMPLATE_FIELDS).sort();
    assert.deepEqual(described, catalogued, "TEMPLATE_FIELDS must have exactly one entry per template");
  });

  it("declares row fields for every template that edits rows", () => {
    for (const id of ITEM_TEMPLATES) {
      assert.ok(templateRows(id).length > 0, `${id} is in ITEM_TEMPLATES but declares no row fields`);
      assert.equal(templateRows(id)[0], "name", `${id}: "name" must be the first row field`);
    }
  });

  it("never declares a row field for a template with no rows", () => {
    for (const id of TEMPLATES.map((t) => t.id)) {
      if (!ITEM_TEMPLATES.includes(id)) {
        assert.deepEqual(templateRows(id), [], `${id} declares row fields but is not an item template`);
      }
    }
  });

  it("only names real slide fields", () => {
    for (const id of Object.keys(TEMPLATE_FIELDS)) {
      for (const f of TEMPLATE_FIELDS[id].text) {
        assert.ok(SCENE_TEXT_FIELDS.includes(f), `${id} declares unknown field "${f}"`);
      }
    }
  });

  it("knows which templates ignore the slide image", () => {
    // picture-per-row layouts — typing an image URL there does nothing
    for (const id of ["product-grid", "deals-grid", "multibuy", "clearance", "aisle-guide", "top-sellers", "store-services", "price-list", "brand-wall", "team-intro"]) {
      assert.equal(templateImageMode(id), "none", `${id} should be image mode "none"`);
      assert.equal(templateUses(id, "imageUrl"), false, `${id} must not claim to use imageUrl`);
    }
    // ...and the ones that do draw it
    for (const id of ["retail-promo", "product-showcase", "announcement", "price-drop", "fullscreen-bg"]) {
      assert.equal(templateImageMode(id), "hero", `${id} should be image mode "hero"`);
      assert.equal(templateUses(id, "imageUrl"), true, `${id} should use imageUrl`);
    }
    assert.equal(templateImageMode("splash"), "logo", "splash draws the image as a logo");
    assert.deepEqual(IMAGE_UNUSED_TEMPLATES.sort(), [...new Set(IMAGE_UNUSED_TEMPLATES)].sort(), "derived list must be unique");
  });

  it("matches the price/cta usage the renderers actually have", () => {
    // spot checks straight out of the FIELDS comments
    assert.equal(templateUses("deals-grid", "promoPrice"), false, "deals-grid prices live on the rows");
    assert.equal(templateUses("price-drop", "promoPrice"), true, "price-drop draws the hero price");
    assert.equal(templateUses("product-grid", "ctaText"), true);
    assert.equal(templateUses("fullscreen-bg", "ctaText"), true);
    assert.equal(templateUses("aisle-guide", "productName"), true, "the aisle number is productName");
    assert.equal(templateUses("aisle-guide", "description"), false);
    assert.equal(templateUses("store-services", "description"), false);
    // only the value-store boards and price-drop draw the second accent colour
    for (const id of ["price-drop", "deals-grid", "multibuy", "clearance", "top-sellers", "store-services"]) {
      assert.equal(templateUses(id, "highlightColor"), true, `${id} draws the highlight colour`);
    }
    assert.equal(templateUses("retail-promo", "highlightColor"), false);
  });

  it("agrees with the FIELDS comment at the top of each template file", () => {
    const files = readdirSync(templateDir).filter((f) => f.endsWith(".tsx"));
    let checked = 0;
    for (const file of files) {
      const source = readFileSync(join(templateDir, file), "utf8");
      const id = source.match(/Template "([a-z-]+)"/)?.[1];
      if (!id || !TEMPLATE_FIELDS[id]) continue;
      const comment = source.slice(0, source.indexOf("*/"));
      const notUsed = comment.match(/Not used: ([^*]+)/)?.[1] || "";
      if (/\bimageUrl\b/.test(notUsed)) {
        assert.equal(templateImageMode(id), "none", `${file} says imageUrl is not used — TEMPLATE_FIELDS disagrees`);
        checked++;
      }
      if (/\bprices\b/.test(notUsed)) {
        assert.equal(templateUses(id, "promoPrice"), false, `${file} says the slide-level prices are not used`);
        assert.equal(templateUses(id, "originalPrice"), false, `${file} says the slide-level prices are not used`);
        checked++;
      }
      if (/\bdescription\b/.test(notUsed)) {
        assert.equal(templateUses(id, "description"), false, `${file} says description is not used`);
        checked++;
      }
      if (/\bproductName\b/.test(notUsed)) {
        assert.equal(templateUses(id, "productName"), false, `${file} says productName is not used`);
        checked++;
      }
    }
    assert.ok(checked >= 10, `expected to cross-check the doc comments, only matched ${checked} claims`);
  });
});
