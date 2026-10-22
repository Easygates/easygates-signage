// Business branding: placeholders, brand colours, ticker rules, settings validation
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BRAND, brandScene, fillText, normalizeBrand, tickerFor } from "../src/lib/brand.ts";

const brand = { ...DEFAULT_BRAND, businessName: "Easygates", phone: "01632 960 000" };

const scene = {
  id: "s1",
  name: "Test",
  template: "price-list",
  eyebrow: "{business} · GATES",
  ctaText: "CALL { Phone } TODAY",
  tickerText: "",
  items: [{ name: "Call-out", price: "£85", desc: "Ring {phone}" }],
  bgFrom: "#f7efe2",
  bgTo: "#e8cfa8",
  bgAngle: 135,
  accentColor: "#ff3b30",
  textColor: "#2b1603",
  mutedColor: "#7a5a3a",
  cardColor: "#ffffff",
  animationPreset: "smooth",
  durationSec: 10,
  transition: "fade",
  staggerMs: 120,
  kenBurns: "static",
  overlayOpacity: 0,
  layoutVariant: "A",
};

describe("business branding", () => {
  it("fills {phone} and {business} wherever they appear", () => {
    assert.equal(fillText("Call {phone} — {business}", brand), "Call 01632 960 000 — Easygates");
    assert.equal(fillText("{other} stays", brand), "{other} stays");
    assert.equal(fillText(undefined, brand), undefined);
  });

  it("brands slide text and rows without touching the saved slide", () => {
    const out = brandScene(scene, brand);
    assert.equal(out.eyebrow, "Easygates · GATES");
    assert.equal(out.ctaText, "CALL 01632 960 000 TODAY");
    assert.equal(out.items[0].desc, "Ring 01632 960 000");
    assert.equal(scene.ctaText, "CALL { Phone } TODAY");
    assert.equal(out.accentColor, "#ff3b30");
  });

  it("applies brand colours to every slide only when switched on", () => {
    const out = brandScene(scene, { ...brand, applyColors: true, accentColor: "#1a7bbf", backgroundColor: "#07131f" });
    assert.equal(out.accentColor, "#1a7bbf");
    assert.equal(out.bgFrom, "#07131f");
    assert.equal(out.textColor, "#ffffff");
    assert.match(out.bgTo, /^#[0-9a-f]{6}$/);
  });

  it("uses the business ticker as a fallback, or everywhere when asked", () => {
    const withOwn = { ...scene, tickerText: "SLIDE TICKER" };
    const b = { ...brand, tickerText: "CALL {phone}" };
    assert.equal(tickerFor(scene, b), "CALL 01632 960 000");
    assert.equal(tickerFor(withOwn, b), "SLIDE TICKER");
    assert.equal(tickerFor(withOwn, { ...b, tickerOnAll: true }), "CALL 01632 960 000");
    assert.equal(tickerFor(scene, brand), "");
  });

  it("cleans up saved settings", () => {
    const n = normalizeBrand({ businessName: "  Acme  ", accentColor: "red", applyColors: "yes", phone: 123 });
    assert.equal(n.businessName, "Acme");
    assert.equal(n.accentColor, DEFAULT_BRAND.accentColor);
    assert.equal(n.applyColors, DEFAULT_BRAND.applyColors);
    assert.equal(n.phone, DEFAULT_BRAND.phone);
    assert.deepEqual(normalizeBrand(null), DEFAULT_BRAND);
  });

  it("validates the time zone and defaults to Europe/London", () => {
    assert.equal(normalizeBrand({ timezone: "Europe/London" }).timezone, "Europe/London");
    assert.equal(normalizeBrand({ timezone: "Bogus" }).timezone, DEFAULT_BRAND.timezone);
    assert.equal(normalizeBrand({ timezone: "America/New_York" }).timezone, "America/New_York");
    assert.equal(normalizeBrand({}).timezone, DEFAULT_BRAND.timezone);
  });
});
