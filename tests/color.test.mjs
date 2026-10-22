import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contrast, ensureContrast, hexToRgb, luminance, mixHex, readableOn } from "../src/lib/color.ts";

describe("colour helpers", () => {
  it("parses hex colours", () => {
    assert.deepEqual(hexToRgb("#ff8000"), [255, 128, 0]);
    assert.deepEqual(hexToRgb("#fff"), [255, 255, 255]);
    assert.equal(hexToRgb("red"), null);
  });
  it("computes WCAG contrast", () => {
    assert.ok(Math.abs(contrast("#000000", "#ffffff") - 21) < 0.01);
    assert.ok(Math.abs(contrast("#777777", "#777777") - 1) < 0.01);
    assert.ok(luminance("#ffffff") > luminance("#0f172a"));
  });
  it("picks readable text for a background", () => {
    assert.equal(readableOn("#ffffff"), "#0f172a");
    assert.equal(readableOn("#0b1020"), "#ffffff");
    assert.equal(readableOn("#facc15"), "#0f172a");
  });
  it("darkens a light accent until it is readable on white", () => {
    const fixed = ensureContrast("#facc15", "#ffffff", 4.5);
    assert.notEqual(fixed, "#facc15");
    assert.ok(contrast(fixed, "#ffffff") >= 4.5);
    assert.equal(ensureContrast("#0f172a", "#ffffff"), "#0f172a");
  });
  it("lightens a dark colour on a dark background", () => {
    const fixed = ensureContrast("#1e2a5a", "#0b1020", 4.5);
    assert.ok(contrast(fixed, "#0b1020") >= 4.5);
  });
  it("mixes colours", () => {
    assert.equal(mixHex("#000000", "#ffffff", 0.5), "#808080");
    assert.equal(mixHex("#123456", "#ffffff", 0), "#123456");
  });
});
