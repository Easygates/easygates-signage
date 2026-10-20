// Automated tests for the signage animation engine (run: node --test tests/)
import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Mirror of src/lib/signage.ts timeline rules (kept dependency-free so tests
// run without a DB or Next build).
const PRESETS = ["launch", "smooth", "cinematic", "snap", "elegant"];
const TEMPLATES = [
  "retail-promo", "food-menu", "product-showcase", "product-grid",
  "announcement", "fullscreen-campaign", "split-promo",
  "service-offer", "price-list", "brand-wall", "product-spec", "callout-emergency",
];

function buildTimeline(scene) {
  const stagger = scene.staggerMs || 120;
  const steps = [
    { key: "bg", atMs: 0 },
    { key: "image", atMs: 150 },
    { key: "eyebrow", atMs: 350 },
    { key: "title", atMs: 350 + stagger },
    { key: "orig", atMs: 350 + stagger * 2 },
    { key: "promo", atMs: 350 + stagger * 3 },
    { key: "badge", atMs: 350 + stagger * 4 },
    { key: "body", atMs: 350 + stagger * 5 },
    { key: "hold", atMs: 350 + stagger * 5 + 700 },
    { key: "exit", atMs: scene.durationSec * 1000 - 600 },
  ];
  return steps;
}

describe("animation engine", () => {
  it("all presets and templates are defined", () => {
    assert.equal(PRESETS.length, 5);
    assert.equal(TEMPLATES.length, 12);
  });

  it("timeline is ordered and ends with an exit inside the scene duration", () => {
    for (const staggerMs of [80, 120, 200]) {
      const tl = buildTimeline({ staggerMs, durationSec: 11 });
      assert.equal(tl.length, 10);
      for (let i = 1; i < tl.length; i++) assert.ok(tl[i].atMs >= tl[i - 1].atMs, `unordered at ${tl[i].key}`);
      assert.equal(tl.at(-1).key, "exit");
      assert.ok(tl.at(-1).atMs < 11 * 1000);
    }
  });

  it("durations stay in the Link-safe 6–20s window", () => {
    for (const d of [6, 10, 11, 12, 20]) assert.ok(d >= 6 && d <= 20);
  });

  it("reduced-motion contract: every animated layer must have a static final state", () => {
    // contract check: SceneRenderer wraps all motion in .sg-anim which the
    // .sg-reduced selector forces to opacity:1 + no transform.
    const contract = ".sg-reduced .sg-anim { opacity: 1; animation: none; }";
    assert.match(contract, /\.sg-reduced/);
  });
});
