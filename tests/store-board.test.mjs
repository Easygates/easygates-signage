// Pure layout helpers behind the value-store board templates (deals-grid, top-sellers, aisle-guide, store-services)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SERVICE_ICONS,
  aisleLabelLayout,
  aisleText,
  arrowDirection,
  countLines,
  fitText,
  gridRows,
  gridSpans,
  isRankTag,
  rankTone,
  serviceIcon,
  splitLines,
  textWidth,
} from "../src/components/scene/templates/storeBoardKit.ts";
import { contrast } from "../src/lib/color.ts";

describe("splitLines", () => {
  it("splits on new lines and on ' · '", () => {
    assert.deepEqual(splitLines("Mon–Sat 7am–10pm · Sun 8am–8pm"), ["Mon–Sat 7am–10pm", "Sun 8am–8pm"]);
    assert.deepEqual(splitLines("On orders over £50\nSame-day in town"), ["On orders over £50", "Same-day in town"]);
    assert.deepEqual(splitLines("a\r\n\r\nb · c | d • e"), ["a", "b", "c", "d", "e"]);
  });
  it("keeps one-line details and copes with empty values", () => {
    assert.deepEqual(splitLines("Order online, pick up in store"), ["Order online, pick up in store"]);
    assert.deepEqual(splitLines(""), []);
    assert.deepEqual(splitLines(undefined), []);
    assert.deepEqual(splitLines(null), []);
  });
  it("does not split a middle dot with no spaces around it", () => {
    assert.deepEqual(splitLines("7am·10pm"), ["7am·10pm"]);
  });
});

describe("isRankTag", () => {
  it("spots tags that only repeat the rank", () => {
    for (const t of ["#1", "2", "No.3", "no 4", " #5 "]) assert.equal(isRankTag(t), true, t);
  });
  it("keeps real labels", () => {
    for (const t of ["NEW", "-20%", "2 FOR", "£1", "", undefined]) assert.equal(isRankTag(t), false, String(t));
  });
});

describe("gridRows / gridSpans", () => {
  it("never leaves a hole in the 6-column grid", () => {
    assert.deepEqual(gridRows(0), []);
    assert.deepEqual(gridRows(1), [1]);
    assert.deepEqual(gridRows(2), [2]);
    assert.deepEqual(gridRows(3), [3]);
    assert.deepEqual(gridRows(4), [2, 2]);
    assert.deepEqual(gridRows(5), [3, 2]);
    assert.deepEqual(gridRows(6), [3, 3]);
    assert.deepEqual(gridRows(9), [3, 3]);
    for (let n = 1; n <= 6; n++) {
      const spans = gridSpans(n);
      assert.equal(spans.length, n);
      // every row of spans adds up to exactly 6 columns
      let i = 0;
      for (const perRow of gridRows(n)) {
        const row = spans.slice(i, i + perRow);
        assert.equal(row.reduce((a, b) => a + b, 0), 6, `n=${n}`);
        i += perRow;
      }
    }
  });
});

describe("arrowDirection", () => {
  it("reads layoutVariant, any capitals", () => {
    assert.equal(arrowDirection("left"), "left");
    assert.equal(arrowDirection("LEFT"), "left");
    assert.equal(arrowDirection(" Right "), "right");
    assert.equal(arrowDirection("ahead"), "ahead");
  });
  it("treats anything else, including legacy A / B and empty, as ahead", () => {
    for (const v of ["A", "B", "", "  ", undefined, null, "bright", "leftish", "up"]) assert.equal(arrowDirection(v), "ahead", String(v));
  });
});

describe("aisleText", () => {
  it("uses productName as the circle label and headline as the department", () => {
    assert.deepEqual(aisleText("7", "Tinned Goods"), { label: "7", caption: "AISLE", department: "Tinned Goods" });
    assert.deepEqual(aisleText("12A", "Fresh Bakery"), { label: "12A", caption: "AISLE", department: "Fresh Bakery" });
  });
  it("gives no caption to a word label", () => {
    assert.equal(aisleText("Bay B", "Pet Food").caption, "");
  });
  it("swaps the old way round (headline 'AISLE 7', productName = department)", () => {
    assert.deepEqual(aisleText("Tinned Goods", "AISLE 7"), { label: "7", caption: "AISLE", department: "Tinned Goods" });
    assert.deepEqual(aisleText("Garden Centre", "Bay 12b"), { label: "12B", caption: "BAY", department: "Garden Centre" });
  });
  it("does not swap when the label is already short", () => {
    assert.deepEqual(aisleText("7", "AISLE 7"), { label: "7", caption: "AISLE", department: "AISLE 7" });
  });
  it("copes with empty fields", () => {
    assert.deepEqual(aisleText("", ""), { label: "", caption: "", department: "" });
    assert.deepEqual(aisleText(undefined, "Frozen"), { label: "", caption: "", department: "Frozen" });
  });
});

describe("aisleLabelLayout", () => {
  it("shrinks the type as the label gets longer and never overflows the circle", () => {
    const inner = 410;
    let last = Infinity;
    for (const label of ["7", "12", "12A", "12AB", "AISLE", "AISLE7"]) {
      const { lines, px } = aisleLabelLayout(label, inner, 320);
      assert.deepEqual(lines, [label]);
      assert.ok(px <= last, `${label} should not be bigger than a shorter label`);
      assert.ok(textWidth(label, px, { upper: true, ls: -0.02 }) <= inner + 1, `${label} fits`);
      last = px;
    }
    assert.ok(aisleLabelLayout("7", inner, 320).px >= 300);
    assert.ok(aisleLabelLayout("AISLE7", inner, 320).px >= 60);
  });
  it("wraps a long department-style label onto separate lines", () => {
    const { lines, px } = aisleLabelLayout("Tinned Goods", 410, 320);
    assert.deepEqual(lines, ["Tinned", "Goods"]);
    assert.ok(px >= 40 && px <= 150);
  });
  it("has nothing to draw for an empty label", () => {
    assert.deepEqual(aisleLabelLayout("  ", 410, 320).lines, []);
  });
});

describe("serviceIcon", () => {
  it("prefers the tag keyword", () => {
    assert.equal(serviceIcon("collect", "Returns", 3), "collect");
    assert.equal(serviceIcon("PHARMACY", "Anything", 0), "pharmacy");
  });
  it("picks from words in the title when there is no tag", () => {
    assert.equal(serviceIcon("", "Click & Collect", 5), "collect");
    assert.equal(serviceIcon(undefined, "Returns & refunds", 5), "returns");
    assert.equal(serviceIcon(undefined, "Opening Hours", 5), "hours");
    assert.equal(serviceIcon(undefined, "Open late", 5), "hours");
    assert.equal(serviceIcon(undefined, "Customer Services", 5), "customer");
    assert.equal(serviceIcon(undefined, "Help desk", 5), "customer");
    assert.equal(serviceIcon(undefined, "Help and advice", 5), "help");
    assert.equal(serviceIcon(undefined, "Free delivery", 5), "delivery");
    assert.equal(serviceIcon(undefined, "Photo printing", 5), "photo");
    assert.equal(serviceIcon(undefined, "Pharmacy", 5), "pharmacy");
    assert.equal(serviceIcon(undefined, "Café", 5), "cafe");
    assert.equal(serviceIcon(undefined, "Car park", 5), "parking");
  });
  it("ignores a tag that is not an icon word and uses the title instead", () => {
    assert.equal(serviceIcon("NEW", "Returns", 0), "returns");
  });
  it("falls back to position and always returns a real icon", () => {
    assert.equal(serviceIcon("", "Zzz", 0), "collect");
    assert.equal(serviceIcon("", "Zzz", 1), "returns");
    assert.equal(serviceIcon("", "Zzz", 2), "hours");
    assert.equal(serviceIcon("", "Zzz", 7), "returns");
    assert.equal(serviceIcon("", "Zzz", -1), "info");
    for (let i = 0; i < 20; i++) assert.ok(SERVICE_ICONS.includes(serviceIcon("", "", i)));
  });
  it("has at least 8 distinct icons, each reachable by its own tag word", () => {
    assert.ok(SERVICE_ICONS.length >= 8);
    assert.equal(new Set(SERVICE_ICONS).size, SERVICE_ICONS.length);
    for (const id of SERVICE_ICONS) assert.equal(serviceIcon(id, "", 0), id, id);
  });
});

describe("rankTone", () => {
  it("styles 1-3 gold, silver, bronze and the rest in neutral navy, all readable", () => {
    const tones = [1, 2, 3, 4, 5, 9].map(rankTone);
    assert.notEqual(tones[0].from, tones[1].from);
    assert.notEqual(tones[1].from, tones[2].from);
    assert.deepEqual(tones[3], tones[4]);
    for (const t of tones) {
      assert.ok(contrast(t.ink, t.from) >= 7, `${t.ink} on ${t.from}`);
      assert.ok(contrast(t.ink, t.to) >= 7, `${t.ink} on ${t.to}`);
    }
  });
});

describe("text fitting", () => {
  it("counts wrapped lines", () => {
    assert.equal(countLines("", 40, 500), 0);
    assert.equal(countLines("Hello", 40, 500), 1);
    assert.ok(countLines("Hello there and a very long product name indeed", 40, 400) >= 3);
    // one huge word still breaks across lines instead of overflowing
    assert.ok(countLines("Supercalifragilisticexpialidocious", 60, 300) >= 2);
  });
  it("picks the biggest size that fits and shrinks for long text", () => {
    const short = fitText({ text: "TINNED", boxW: 900, maxPx: 150, minPx: 64, maxLines: 2, upper: true });
    const long = fitText({ text: "EVERYDAY ESSENTIALS, TINNED GOODS AND LONG-LIFE CUPBOARD FOOD", boxW: 900, maxPx: 150, minPx: 64, maxLines: 2, upper: true });
    assert.equal(short.px, 150);
    assert.ok(long.px < short.px);
    assert.ok(long.lines <= 2 || !long.fits);
  });
  it("reports when nothing fits so callers can clamp", () => {
    const r = fitText({ text: "x ".repeat(300), boxW: 300, maxPx: 40, minPx: 28, maxLines: 2 });
    assert.equal(r.fits, false);
    assert.equal(r.px, 28);
  });
  it("respects a height limit", () => {
    const r = fitText({ text: "Extra Large Family Size Crunchy Oat Cereal 750g", boxW: 300, maxPx: 40, minPx: 20, maxLines: 6, lineHeight: 1.1, boxH: 90 });
    assert.ok(r.lines * r.px * 1.1 <= 90 || !r.fits);
  });
  it("estimates widths on the generous side", () => {
    // "£12.99" at 100px: Inter Black is roughly 3.3em wide with tight tracking; never estimate under that
    assert.ok(textWidth("£12.99", 100, { ls: -0.04 }) >= 330);
    assert.ok(textWidth("WWW", 100) > textWidth("iii", 100) * 2);
  });
});
