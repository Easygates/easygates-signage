// Opening page copy + the ticker-size option.
//
// The landing page used to pitch the product as a "McDonald's-grade menu-board"
// and quote numbers that had been stale since the retail pack was joined by the
// trade, value and corporate packs ("7 templates · 8 demo scenes" against 27 and
// 34). Both are content bugs that no type checker catches, so they are asserted
// here: the counts must come from the catalogue, and the copy must describe what
// the product actually is.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_DEMO_SCENES,
  CORPORATE_DEMO_SCENES,
  COUNTER_DEMO_SCENES,
  DEMO_SCENES,
  EASYGATES_DEMO_SCENES,
  SMARTSECURE_DEMO_SCENES,
  TEMPLATES,
  TRADE_DEMO_SCENES,
  VALUE_DEMO_SCENES,
} from "../src/lib/signage.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const page = read("src/app/page.tsx");
const playerChrome = read("src/components/PlayerChrome.tsx");
const screenView = read("src/components/ScreenView.tsx");
const businessPanel = read("src/components/BusinessPanel.tsx");

describe("opening page", () => {
  it("describes a kiosk signage system, not a fast-food menu board", () => {
    assert.equal(/mcdonald/i.test(page), false, "the McDonald's comparison is gone");
    assert.equal(/menu-board engine/i.test(page), false);
    assert.match(page, /kiosk advertising board/i);
    assert.match(page, /kiosk signage system/i);
    assert.match(page, /playlists/i, "the page should mention what the CMS actually does");
    assert.match(page, /schedule/i, "…including scheduling");
  });

  it("takes its counts from the catalogue instead of hard-coding them", () => {
    // The two literal tiles that had gone stale.
    assert.equal(page.includes('["7", "templates"]'), false, "hard-coded template count is back");
    assert.equal(page.includes('["8", "demo scenes"]'), false, "hard-coded demo-scene count is back");
    assert.equal(page.includes("8-SCENE DEMO"), false, "hard-coded scene count is back");
    assert.ok(page.includes("TEMPLATES.length"), "template count must come from TEMPLATES");
    assert.ok(page.includes("ALL_DEMO_SCENES.length"), "demo-scene count must come from ALL_DEMO_SCENES");
    assert.ok(page.includes("built-in templates"), "the stat should be labelled “built-in templates”");
    assert.ok(page.includes("built-in demo scenes"), "the stat should be labelled “built-in demo scenes”");
  });

  it("preview strip prefers bundled images over remote stock photos", () => {
    // A first paint of four broken thumbnails reads as "this is broken"; the value
    // and corporate packs ship their images in /public, so lead with those.
    assert.ok(page.includes('s.imageUrl?.startsWith("/")'), "the preview should pick local images first");
  });

  it("the built-in total really is every pack, and every template has a demo slide", () => {
    assert.equal(
      ALL_DEMO_SCENES.length,
      DEMO_SCENES.length +
        TRADE_DEMO_SCENES.length +
        VALUE_DEMO_SCENES.length +
        CORPORATE_DEMO_SCENES.length +
        COUNTER_DEMO_SCENES.length +
        EASYGATES_DEMO_SCENES.length +
        SMARTSECURE_DEMO_SCENES.length,
      "ALL_DEMO_SCENES must be the sum of the seven packs"
    );
    const covered = new Set(ALL_DEMO_SCENES.map((s) => s.template));
    const missing = TEMPLATES.map((t) => t.id).filter((id) => !covered.has(id));
    assert.deepEqual(missing, [], "every built-in template should appear in at least one demo scene");
    assert.ok(TEMPLATES.length > 20 && ALL_DEMO_SCENES.length > 30, "the counts should be worth quoting");
  });
});

describe("ticker size option", () => {
  it("is wired from the Business settings into the player", () => {
    assert.ok(screenView.includes("size={brand.tickerSize}"), "ScreenView must pass the saved size to the Ticker");
    assert.ok(playerChrome.includes("TICKER_SIZES[size]"), "the Ticker must look the size up in the shared table");
    assert.equal(/text-\[20px\][^\n]*sg-ticker/.test(playerChrome), false, "the ticker font size must not be hard-coded any more");
  });

  it("keeps reading speed constant as the type grows", () => {
    // The loop length is derived from the font size; a bigger ticker must not
    // scroll the same distance in the same time.
    assert.ok(playerChrome.includes("TICKER_SIZES.md.fontSize"), "the duration should be normalised against the default size");
  });

  it("is offered as a segmented control on the Business tab", () => {
    assert.ok(businessPanel.includes("TICKER_SIZE_IDS.map"), "the Business tab must render one button per size");
    assert.ok(
      businessPanel.includes('set("tickerSize"') || businessPanel.includes('onChange("tickerSize"'),
      "the button must save the choice",
    );
    assert.ok(businessPanel.includes("aria-pressed={active}"), "the control must expose its state");
  });
});
