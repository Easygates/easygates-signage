import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contrast, luminance, mixHex } from "../src/lib/color.ts";
import {
  SCALES,
  burstLines,
  burstPoints,
  cardWidth,
  discountPalette,
  fitBlock,
  fitLine,
  hexToHsl,
  hslToHex,
  lineCount,
  pickScale,
  scaleSizes,
  solidFor,
  textEm,
} from "../src/components/scene/templates/discountKit.ts";

const colours = { contrast, luminance, mixHex };
const ACCENTS = ["#ef4444", "#dc2626", "#2563eb", "#16a34a", "#facc15", "#f97316", "#0ea5e9", "#ec4899", "#ffffff", "#000000", "#1a7bbf", "#7c3aed", "#fde047", "#111827"];

describe("discount colours", () => {
  it("gives every accent a fill whose text reads at 7:1", () => {
    for (const a of ACCENTS) {
      const { bg, ink } = solidFor(a, 7, colours);
      assert.ok(contrast(bg, ink) >= 7, `${a} -> ${bg} / ${ink} = ${contrast(bg, ink)}`);
    }
  });
  it("keeps red red and yellow bright instead of turning them muddy", () => {
    const red = solidFor("#ef4444", 7, colours);
    assert.equal(red.ink, "#ffffff");
    const [h, s] = hexToHsl(red.bg);
    assert.ok(h < 8 || h > 352, `hue ${h}`);
    assert.ok(s > 0.7, `saturation ${s}`);
    const yellow = solidFor("#facc15", 7, colours);
    assert.equal(yellow.ink, "#0f172a");
    assert.equal(yellow.bg, "#facc15", "an already readable accent is left alone");
  });
  it("falls back to a safe colour for rubbish input", () => {
    const { bg, ink } = solidFor("not a colour", 7, colours);
    assert.ok(contrast(bg, ink) >= 7);
  });
  it("builds a palette whose second colour also reads", () => {
    for (const a of ACCENTS) {
      const p = discountPalette(a, colours);
      assert.ok(contrast(p.main, p.mainInk) >= 7, a);
      assert.ok(contrast(p.pop, p.popInk) >= 7, a);
      assert.notEqual(p.main.toLowerCase(), p.pop.toLowerCase(), `${a}: second colour must differ`);
    }
    assert.equal(discountPalette("#dc2626", colours).pop, "#ffd60a");
    assert.equal(discountPalette("#facc15", colours).pop, "#1e3a8a");
  });
  it("round-trips hsl", () => {
    for (const hex of ["#ef4444", "#2563eb", "#16a34a", "#808080"]) {
      const [h, s, l] = hexToHsl(hex);
      assert.equal(hslToHex(h, s, l), hex);
    }
  });
});

describe("text fitting", () => {
  it("measures wider text as wider", () => {
    assert.ok(textEm("BIG BOWLS. BIG SAVINGS.") > textEm("BIG BOWLS."));
    assert.ok(textEm("WWW") > textEm("iii"));
    assert.equal(textEm(""), 0);
  });
  it("counts wrapped lines", () => {
    assert.equal(lineCount("", 40, 500), 0);
    assert.equal(lineCount("SALE", 40, 500), 1);
    assert.ok(lineCount("A VERY LONG HEADLINE THAT NEEDS SEVERAL LINES TO FIT", 80, 600) >= 3);
    assert.ok(lineCount("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", 80, 300) >= 2, "a word wider than the box is broken");
  });
  it("shrinks a long headline until it fits, but never below the smallest size", () => {
    const sizes = [120, 100, 80, 64];
    const short = fitBlock("SALE", { width: 880, maxLines: 3, sizes });
    assert.equal(short.size, 120);
    const long = fitBlock("BIG SAVINGS ON EVERYTHING FOR THE WHOLE FAMILY", { width: 880, maxLines: 3, maxHeight: 300, sizes });
    assert.ok(long.size < 120 && long.size >= 64);
    assert.ok(long.lines <= 3 && long.height <= 300);
    // a 60-character headline is allowed to hit the floor; it must still come back with a usable answer
    const sixty = fitBlock("THE BIGGEST SPRING CLEAR-OUT SALE WE HAVE EVER HELD, ALL WEEK", { width: 880, maxLines: 3, maxHeight: 300, sizes });
    assert.ok(sixty.size >= 64 && sixty.lines >= 1);
    const impossible = fitBlock("X ".repeat(400), { width: 300, maxLines: 2, sizes });
    assert.equal(impossible.size, 64);
  });
  it("sizes a price to its box within limits", () => {
    assert.ok(fitLine("£3.49", 800, 300, 90) >= 250, "short prices are huge");
    assert.ok(fitLine("£1,299.99", 800, 300, 90) >= 140);
    assert.equal(fitLine("£3.49 per kilo for a limited time only today", 800, 300, 90), 90);
    assert.equal(fitLine("", 800, 300, 90), 300);
    for (const price of ["£3.49", "£12.99", "£1,299.99", "HALF PRICE", "2 FOR £5"]) {
      const size = fitLine(price, 800, 300, 90);
      assert.ok(textEm(price) * size <= 800 || size === 90, price);
    }
  });
});

describe("shrink steps", () => {
  it("picks the first scale that fits", () => {
    assert.equal(pickScale((k) => 1000 * k, 1000), 1);
    assert.equal(pickScale((k) => 1000 * k, 800), 0.8);
    assert.equal(pickScale(() => 99999, 10), SCALES[SCALES.length - 1]);
  });
  it("scales size lists with a floor and no duplicates", () => {
    assert.deepEqual(scaleSizes([100, 80, 64], 1, 64), [100, 80, 64]);
    assert.deepEqual(scaleSizes([100, 80, 64], 0.5, 64), [64]);
    assert.deepEqual(scaleSizes([150, 100], 0.6, 52), [90, 60]);
  });
});

describe("burst sticker text", () => {
  it("returns nothing for empty text", () => {
    assert.deepEqual(burstLines(""), []);
    assert.deepEqual(burstLines("   "), []);
  });
  it("puts the number big on its own line", () => {
    const lines = burstLines("SAVE £2");
    assert.equal(lines.length, 2);
    assert.equal(lines[1].text, "£2");
    assert.ok(lines[1].size >= lines[0].size);
    assert.equal(burstLines("-40%").length, 1);
    assert.ok(burstLines("-40%")[0].size >= 60);
  });
  it("keeps every line inside the sticker and readable", () => {
    for (const t of ["SAVE £2", "-40%", "HALF PRICE", "UP TO 50% OFF", "SAVE UP TO £12.50", "2 FOR £5", "NEW"]) {
      const lines = burstLines(t, 220, 190);
      assert.ok(lines.length >= 1 && lines.length <= 3, t);
      assert.equal(lines.map((l) => l.text).join(" "), t, "no words lost or reordered");
      for (const l of lines) {
        assert.ok(l.size >= 30, `${t}: ${l.size}`);
        assert.ok(textEm(l.text) * l.size <= 222, `${t} / ${l.text} too wide`);
      }
      assert.ok(lines.reduce((s, l) => s + l.size * 0.95, 0) <= 192, `${t} too tall`);
    }
  });
});

describe("layout helpers", () => {
  it("shares a row between cards and caps their width", () => {
    assert.equal(cardWidth(3, 1776, 40, 560), 560);
    assert.equal(cardWidth(4, 1776, 32, 430), 420);
    assert.equal(cardWidth(1, 1776, 40, 700), 700);
    assert.equal(cardWidth(0, 1776, 40, 700), 700);
  });
  it("draws a starburst with the right number of points", () => {
    const pts = burstPoints(150, 150, 146, 128, 20).split(" ");
    assert.equal(pts.length, 40);
    const [x, y] = pts[0].split(",").map(Number);
    assert.ok(Math.abs(x - 150) < 0.1 && Math.abs(y - 4) < 0.1, "first point is straight up at the outer radius");
  });
});
