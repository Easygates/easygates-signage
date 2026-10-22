// Guards the admin UI wiring for the two features that regressed in PR #9:
// (1) asset deletion must be reachable — a 🗑 button on every library card that
//     opens the pendingDelete modal (the modal + DELETE endpoints were dead
//     code because nothing ever called setPendingDelete(a));
// (2) switching to a new template must load a sample page (TEMPLATE_STARTERS),
//     like splash did, instead of keeping the previous product content.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const admin = readFileSync(join(root, "src/app/admin/page.tsx"), "utf8");
const seed = readFileSync(join(root, "src/app/api/seed/route.ts"), "utf8");
const selftest = readFileSync(join(root, "src/app/api/selftest/route.ts"), "utf8");

describe("admin: asset deletion is reachable", () => {
  it("library cards render a delete button wired to setPendingDelete", () => {
    // the button must be inside the per-card action row (COPY / USE → / 🗑)
    assert.ok(
      admin.includes("setPendingDelete(a)"),
      "no call to setPendingDelete(a) — the confirm modal can never open"
    );
    assert.ok(admin.includes("Delete permanently"), "confirm modal button missing");
    assert.ok(admin.includes("🗑"), "delete icon missing from the library card");
  });

  it("delete routes to the right endpoint per asset source", () => {
    assert.ok(admin.includes("/api/public-assets?url="), "public assets must delete via /api/public-assets");
    assert.ok(admin.includes("/api/assets?id="), "DB assets must delete via /api/assets");
    assert.ok(admin.includes("isPublicAsset"), "source check missing");
  });
});

describe("admin: new templates load a sample page", () => {
  const NEW_TEMPLATES = ["company-values", "team-intro", "corporate-milestone", "corporate-news", "testimonial-quote", "fullscreen-bg", "trustpilot-review"];
  it("TEMPLATE_STARTERS exists and covers splash + all new templates", () => {
    assert.ok(admin.includes("TEMPLATE_STARTERS"), "TEMPLATE_STARTERS map missing");
    for (const t of ["splash", ...NEW_TEMPLATES]) {
      // key may be quoted ("company-values":) or bare (splash:) in the map
      assert.ok(admin.match(new RegExp(`["']?${t}["']?\\s*:\\s*\\{`)), `no starter defined for ${t}`);
    }
  });

  it("pickTemplate applies the starter fields instead of only setting the id", () => {
    assert.ok(admin.includes("starter.fields"), "pickTemplate must merge starter fields into the draft");
    assert.ok(admin.includes("flash(starter.flash)"), "pickTemplate should announce the loaded sample");
  });

  it("items editor has row hints for the new item templates", () => {
    for (const t of ["company-values", "team-intro", "testimonial-quote", "trustpilot-review"]) {
      assert.ok(admin.match(new RegExp(`"${t}": "`, "m")), `ITEM_HINTS missing an entry for ${t}`);
    }
  });
});

describe("corporate campaign wiring", () => {
  it("seed route accepts campaign=corporate", () => {
    assert.ok(seed.includes(`campaign === "corporate"`), "campaignFrom must accept 'corporate'");
    assert.ok(seed.includes("CORPORATE_DEMO_SCENES"), "seed must use the corporate scenes");
  });

  it("admin header has a Corporate demo button", () => {
    assert.ok(admin.includes(`seed("corporate")`), "Corporate demo button missing from the admin header");
  });

  it("selftest includes the corporate scenes in coverage", () => {
    assert.ok(selftest.includes("CORPORATE_DEMO_SCENES"), "selftest must count corporate scenes toward template coverage");
  });
});
