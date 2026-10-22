// Three follow-ups that only show up when you actually use the CMS:
//  1. Loading a demo pack created scenes/playlist/screens but the UI stayed put,
//     so it looked like nothing happened. It now lands on the new playlist.
//  2. "Background Image / Video" was described as media-only but still drew
//     headline/eyebrow/subheadline/CTA and the brand bar on top.
//  3. Animation presets changed timings but their easing was never applied —
//     every slide ran on the global --sg-ease curve.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ANIMATION_PRESETS, CORPORATE_DEMO_SCENES, buildTimeline } from "../src/lib/signage.ts";
import { MEDIA_ONLY_TEMPLATES, TEMPLATE_FIELDS, templateIsMediaOnly, templateUses } from "../src/lib/templateFields.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const renderer = read("src/components/SceneRenderer.tsx");
const screenView = read("src/components/ScreenView.tsx");
const admin = read("src/app/admin/page.tsx");
const seedRoute = read("src/app/api/seed/route.ts");
const parts = read("src/components/scene/parts.tsx");
const signage = read("src/lib/signage.ts");

/** The source of the `{t === "fullscreen-bg" && ( ... )}` block. */
function fullscreenBlock() {
  const start = renderer.indexOf('{t === "fullscreen-bg" && (');
  assert.ok(start > 0, "fullscreen-bg block not found");
  const end = renderer.indexOf('{/* 27 ·', start);
  return renderer.slice(start, end > 0 ? end : start + 4000);
}

describe("background image / video is media only", () => {
  it("declares no text fields and is marked media-only", () => {
    assert.equal(templateIsMediaOnly("fullscreen-bg"), true);
    assert.deepEqual(MEDIA_ONLY_TEMPLATES, ["fullscreen-bg"]);
    for (const f of ["eyebrow", "subheadline", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText"]) {
      assert.equal(templateUses("fullscreen-bg", f), false, `fullscreen-bg must not draw ${f}`);
    }
    assert.equal(templateUses("fullscreen-bg", "imageUrl"), true);
    assert.equal(templateUses("fullscreen-bg", "videoUrl"), true);
  });

  it("keeps the media-only list in step with the field table", () => {
    // A template whose text fields are only image/video draws no text. If a template
    // gains a text field it must stop being media-only, and vice versa.
    for (const [id, spec] of Object.entries(TEMPLATE_FIELDS)) {
      const textless = spec.text.every((f) => f === "imageUrl" || f === "videoUrl");
      assert.equal(templateIsMediaOnly(id), textless, `${id}: media-only and the field table disagree`);
    }
  });

  it("renderer draws the picture or video and nothing else", () => {
    const block = fullscreenBlock();
    for (const banned of ["scene.headline", "Eyebrow", "subheadline", "ctaText", "scene.eyebrow"]) {
      assert.equal(block.includes(banned), false, `fullscreen-bg still draws ${banned}`);
    }
    assert.ok(block.includes("<video"), "the video branch must stay");
    assert.ok(block.includes("backgroundImage"), "the image branch must stay");
  });

  it("player chrome (logo, name, clock, ticker) is suppressed for it", () => {
    assert.ok(screenView.includes("templateIsMediaOnly(shown.template)"), "ScreenView does not check the template");
    assert.ok(screenView.includes("{!mediaOnly && <BrandBar"), "brand bar must be hidden for media-only slides");
    assert.ok(screenView.includes("{!mediaOnly && <Ticker"), "ticker must be hidden for media-only slides");
  });

  it("the corporate demo's ambient slide carries no headline", () => {
    const ambient = CORPORATE_DEMO_SCENES.find((s) => s.template === "fullscreen-bg");
    assert.ok(ambient, "corporate demo should still contain the ambient slide");
    assert.equal(ambient.headline || "", "", "a media-only slide must not ship with text that is never drawn");
  });

  it("the editor hides Headline and Ticker for it, with a note", () => {
    assert.ok(admin.includes("const mediaOnly = templateIsMediaOnly(draft.template)"));
    assert.ok(admin.includes("showAllFields || !mediaOnly"), "Headline/Ticker should be gated on media-only");
    assert.ok(admin.includes("This template draws only its image or video"), "the hidden-fields banner should explain it");
  });
});

describe("demo packs land on the playlist they build", () => {
  it("the seed endpoint reports the playlist name and slide count", () => {
    assert.ok(seedRoute.includes("playlistName: cfg.playlistName"));
    assert.ok(seedRoute.includes("scenes: campaignRows.length"));
    assert.ok(/playlistId,/.test(seedRoute), "playlistId must be returned");
  });

  it("the admin opens that playlist and switches tab after loading", () => {
    const start = admin.indexOf("const seed = async (campaign");
    assert.ok(start > 0, "seed() not found");
    const body = admin.slice(start, admin.indexOf("const timeline = useMemo", start));
    assert.ok(body.includes("await load()"), "playlists must be reloaded before selecting");
    assert.ok(body.includes("setSelPlaylist(j.playlistId)"), "the new playlist must be selected");
    assert.ok(body.includes('setTab("playlists")'), "the UI must switch to the playlist page");
    assert.ok(body.includes("if (!r.ok || !j.playlistId)"), "a failed load must not navigate");
    assert.ok(/flash\(/.test(body), "the result must be reported");
    assert.ok(body.includes('startsWith("db-unavailable")'), "the raw database error must be translated for the operator");
  });

  it("still explains what each pack contains", () => {
    for (const pack of ["retail", "trade", "value", "corporate", "counter"]) {
      assert.ok(admin.includes(`seed("${pack}")`), `${pack} demo button missing`);
    }
    assert.equal((admin.match(/title="\d+ [a-z-]+ slides \+ a playlist/g) ?? []).length, 5, "each demo button needs a title saying what it loads");
  });
});

describe("animation presets do something", () => {
  it("every preset easing is a valid CSS timing function, and they differ", () => {
    const css = /^(ease|ease-in|ease-out|ease-in-out|linear)$|^cubic-bezier\(\s*-?[\d.]+,\s*-?[\d.]+,\s*-?[\d.]+,\s*-?[\d.]+\s*\)$/;
    const seen = new Set();
    for (const [id, preset] of Object.entries(ANIMATION_PRESETS)) {
      assert.match(preset.easing, css, `${id}: "${preset.easing}" is not a CSS timing function`);
      assert.equal(seen.has(preset.easing), false, `${id} reuses another preset's easing`);
      seen.add(preset.easing);
    }
  });

  it("the renderer publishes the preset easing as --sg-ease on the slide root", () => {
    assert.ok(renderer.includes("--sg-ease\": preset.easing"), "SceneRenderer does not set --sg-ease");
    assert.ok(read("src/app/globals.css").includes("animation-timing-function: var(--sg-ease)"), ".sg-anim must consume --sg-ease");
  });

  it("the preset changes the timeline timings", () => {
    const scene = (animationPreset, staggerMs) => ({
      id: "t", name: "t", template: "retail-promo", animationPreset, staggerMs,
      durationSec: 12, kenBurns: "static", transition: "fade",
    });
    const step = (s, key) => buildTimeline(s).find((x) => x.key === key);
    const snap = step(scene("snap", 80), "title");
    const cinematic = step(scene("cinematic", 180), "title");
    assert.ok(cinematic.atMs > snap.atMs, "a slower preset must stagger later");
    assert.ok(cinematic.durMs > snap.durMs, "a slower preset must animate for longer");
  });

  it("an explicit 0ms stagger is respected (0 is not 'unset')", () => {
    const base = { id: "t", name: "t", template: "retail-promo", animationPreset: "smooth", durationSec: 12, kenBurns: "static", transition: "fade" };
    assert.equal(buildTimeline({ ...base, staggerMs: 0 }).find((s) => s.key === "title").atMs, 350);
    assert.equal(buildTimeline({ ...base, staggerMs: undefined }).find((s) => s.key === "title").atMs, 350 + ANIMATION_PRESETS.smooth.staggerMs);
    assert.ok(parts.includes("scene.staggerMs ?? preset.staggerMs"), "parts.ts must treat 0 as a real stagger");
    assert.ok(signage.includes("scene.staggerMs ?? preset.staggerMs"), "buildTimeline must treat 0 as a real stagger");
  });
});
