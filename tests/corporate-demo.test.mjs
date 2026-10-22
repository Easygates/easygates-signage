// Guards for the corporate / social-proof templates and their demo campaign:
// every new template must have a sample page in a demo campaign (the selftest
// enforces this at runtime; this keeps it covered by the node test suite too)
// and the corporate demo must stay offline-safe (bundled images only).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CORPORATE_DEMO_SCENES,
  COUNTER_DEMO_SCENES,
  DEMO_SCENES,
  ITEM_TEMPLATES,
  TEMPLATES,
  TRADE_DEMO_SCENES,
  VALUE_DEMO_SCENES,
  buildTimeline,
} from "../src/lib/signage.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NEW_TEMPLATES = ["company-values", "team-intro", "corporate-milestone", "corporate-news", "testimonial-quote", "fullscreen-bg", "trustpilot-review"];
const itemTemplates = new Set(ITEM_TEMPLATES);

describe("corporate demo campaign", () => {
  it("has one sample page per new template", () => {
    const covered = new Set(CORPORATE_DEMO_SCENES.map((s) => s.template));
    for (const t of NEW_TEMPLATES) {
      assert.ok(covered.has(t), `corporate demo missing a sample page for ${t}`);
    }
  });

  it("all demo campaigns together cover every template in the catalogue", () => {
    const all = [...DEMO_SCENES, ...TRADE_DEMO_SCENES, ...VALUE_DEMO_SCENES, ...CORPORATE_DEMO_SCENES, ...COUNTER_DEMO_SCENES];
    const covered = new Set(all.map((s) => s.template));
    for (const t of TEMPLATES) {
      assert.ok(covered.has(t.id), `no demo campaign covers template ${t.id}`);
    }
  });

  for (const s of CORPORATE_DEMO_SCENES) {
    it(`scene "${s.name}" is valid`, () => {
      assert.ok(TEMPLATES.some((t) => t.id === s.template), "unknown template");
      assert.ok(s.durationSec >= 6 && s.durationSec <= 20, "duration must stay in 6–20s");
      if (itemTemplates.has(s.template)) {
        assert.ok((s.items || []).length > 0, "item template needs rows");
      }
      const tl = buildTimeline(s);
      const ordered = tl.every((v, i, a) => i === 0 || v.atMs >= a[i - 1].atMs);
      assert.ok(ordered && tl.some((v) => v.key === "exit"), "timeline ordered + has exit");
    });

    it(`scene "${s.name}" image paths are local and exist on disk`, () => {
      for (const url of [s.imageUrl, s.bgImageUrl]) {
        if (!url) continue;
        assert.ok(url.startsWith("/"), "corporate demo images must be bundled public/ paths (offline displays)");
        assert.ok(existsSync(join(root, "public", url)), `missing file ${url}`);
      }
    });
  }

  it("trustpilot demo reviews carry star tags the renderer can parse", () => {
    const tp = CORPORATE_DEMO_SCENES.find((s) => s.template === "trustpilot-review");
    assert.ok(tp, "trustpilot demo scene missing");
    for (const r of tp.items) {
      const m = (r.tag || "").match(/★/g);
      assert.ok(m && m.length >= 1 && m.length <= 5, `review "${r.name}" has unparseable star tag "${r.tag}"`);
    }
  });
});

describe("SceneRenderer renders the new templates", () => {
  const src = readFileSync(join(root, "src/components/SceneRenderer.tsx"), "utf8");
  it("every new template has a render branch in SceneRenderer.tsx", () => {
    for (const t of NEW_TEMPLATES) {
      assert.ok(src.includes(`t === "${t}"`), `SceneRenderer has no render branch for ${t}`);
    }
  });

  it("star-breakdown bars are data-driven (no hardcoded 70% width)", () => {
    assert.ok(!src.includes('style={{ width: "70%" }}'), "trustpilot bars still hardcoded");
    assert.ok(src.includes("match(/★/g)"), "expected star-count parsing of item tags");
  });
});
