// Multiple businesses: one NovaSign install can run several brands. These tests
// pin the shape of the saved collection, the migration from the old single-business
// row, the shipped presets (including the contrast of their palettes), and the
// wiring that actually makes the second business reach a screen.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BUSINESS_PRESETS,
  DEFAULT_BRAND,
  activeProfile,
  defaultBusinesses,
  fillText,
  normalizeBrand,
  normalizeBusinesses,
  profileById,
  profileOrDefault,
  profileSlug,
} from "../src/lib/brand.ts";
import { contrast } from "../src/lib/color.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

describe("business profiles", () => {
  it("ships two ready-made businesses with the real logos and numbers", () => {
    assert.equal(BUSINESS_PRESETS.length, 2);
    const [easygates, smartsecure] = BUSINESS_PRESETS;
    assert.equal(easygates.profileName, "EasyGates Direct");
    assert.equal(easygates.logoUrl, "/brands/easygates-direct-logo.png");
    assert.equal(easygates.logoOnWhite, false, "the silver EasyGates mark needs a dark plate");
    assert.equal(smartsecure.profileName, "Smart & Secure");
    assert.equal(smartsecure.logoUrl, "/brands/smart-secure-logo.png");
    assert.equal(smartsecure.logoOnWhite, true);
    for (const p of BUSINESS_PRESETS) {
      assert.match(p.phone, /\d/, `${p.profileName} needs a phone number`);
      assert.match(p.website, /^https:\/\//, `${p.profileName} needs a website`);
      assert.ok(p.tagline, `${p.profileName} needs a short description`);
      assert.match(p.accentColor, /^#[0-9a-f]{6}$/, `${p.profileName} needs a hex accent`);
      assert.match(p.backgroundColor, /^#[0-9a-f]{6}$/, `${p.profileName} needs a hex background`);
      assert.ok(p.tickerText, `${p.profileName} needs a ticker`);
    }
  });

  it("both shipped palettes are readable for signage", () => {
    for (const p of BUSINESS_PRESETS) {
      const bg = p.backgroundColor;
      // white text on the brand background (slides are read across a shop floor)
      assert.ok(contrast("#ffffff", bg) >= 7, `${p.profileName}: white on ${bg} = ${contrast("#ffffff", bg).toFixed(2)}`);
      assert.ok(contrast(p.accentColor, bg) >= 4.5, `${p.profileName}: accent ${p.accentColor} on ${bg}`);
    }
    // the two brands must not share an accent, or the screens look like one business
    assert.notEqual(BUSINESS_PRESETS[0].accentColor, BUSINESS_PRESETS[1].accentColor);
    assert.notEqual(BUSINESS_PRESETS[0].backgroundColor, BUSINESS_PRESETS[1].backgroundColor);
  });

  it("the presets ship the uploaded logo files", () => {
    for (const p of BUSINESS_PRESETS) {
      assert.ok(p.logoUrl.startsWith("/brands/"), `${p.profileName}: logos belong in public/brands`);
      assert.ok(readFileSync(join(root, "public", p.logoUrl)).length > 0, `missing ${p.logoUrl}`);
    }
  });
});

describe("profile ids", () => {
  it("slugify names and stay unique", () => {
    assert.equal(profileSlug("Smart & Secure"), "smart-secure");
    assert.equal(profileSlug("EasyGates Direct"), "easygates-direct");
    assert.equal(profileSlug(""), "business");
    assert.equal(profileSlug("!!!"), "business");
    assert.equal(profileSlug("Smart & Secure", ["smart-secure"]), "smart-secure-2");
    assert.equal(profileSlug("Smart & Secure", ["smart-secure", "smart-secure-2"]), "smart-secure-3");
  });

  it("defaultBusinesses gives every preset a unique id", () => {
    const { profiles, activeId } = defaultBusinesses();
    assert.equal(profiles.length, 2);
    assert.deepEqual(profiles.map((p) => p.id), ["easygates-direct", "smart-secure"]);
    assert.equal(activeId, profiles[0].id);
  });
});

describe("normalizeBusinesses", () => {
  it("always returns at least one usable profile", () => {
    for (const input of [null, undefined, {}, { profiles: [] }, "nonsense", { profiles: "no" }]) {
      const c = normalizeBusinesses(input);
      assert.ok(c.profiles.length >= 1, `no profile for ${JSON.stringify(input)}`);
      assert.ok(c.profiles.every((p) => p.id), "every profile needs an id");
      assert.ok(c.profiles.some((p) => p.id === c.activeId), "activeId must point at a real profile");
    }
  });

  it("migrates the old single-business row into the first profile", () => {
    const legacy = { ...DEFAULT_BRAND, businessName: "Halesowen Gates", phone: "0121 555 0100" };
    const c = normalizeBusinesses(null, legacy);
    assert.equal(c.profiles.length, 1);
    assert.equal(c.profiles[0].businessName, "Halesowen Gates");
    assert.equal(c.profiles[0].phone, "0121 555 0100");
    assert.equal(c.profiles[0].profileName, "Halesowen Gates", "the name is carried into the list label");
  });

  it("keeps ids unique and repairs a broken activeId", () => {
    const c = normalizeBusinesses({
      profiles: [
        { id: "a", profileName: "A", businessName: "A" },
        { id: "a", profileName: "A again", businessName: "A again" },
        { profileName: "B", businessName: "B" },
      ],
      activeId: "does-not-exist",
    });
    assert.equal(c.profiles.length, 3);
    assert.deepEqual(c.profiles.map((p) => p.id), ["a", "a-again", "b"]);
    assert.equal(c.activeId, "a", "a missing activeId falls back to the first profile");
  });

  it("rejects junk in every field and keeps the brand defaults", () => {
    const c = normalizeBusinesses({
      profiles: [{ id: "x", profileName: 42, businessName: null, accentColor: "red", backgroundColor: "#GGGGGG", tickerSize: "huge", timezone: "Mars/Olympus", logoOnWhite: "yes" }],
      activeId: "x",
    });
    const p = c.profiles[0];
    assert.equal(p.accentColor, DEFAULT_BRAND.accentColor, "a non-hex colour falls back");
    assert.equal(p.backgroundColor, DEFAULT_BRAND.backgroundColor);
    assert.equal(p.tickerSize, DEFAULT_BRAND.tickerSize, "an unknown ticker size falls back");
    assert.equal(p.timezone, DEFAULT_BRAND.timezone, "an unknown time zone falls back");
    assert.equal(p.logoOnWhite, DEFAULT_BRAND.logoOnWhite, "a non-boolean falls back");
    assert.match(p.id, /^[a-zA-Z0-9_-]+$/);
  });

  it("round-trips whatever it produces", () => {
    const first = normalizeBusinesses(defaultBusinesses());
    const second = normalizeBusinesses(first);
    assert.deepEqual(second, first, "normalising twice must be a no-op");
  });

  it("trims and caps the free-text fields", () => {
    const c = normalizeBusinesses({
      profiles: [{ id: "p", profileName: `  ${"x".repeat(200)}  `, businessName: "  Trim me  ", website: "  https://example.com  " }],
      activeId: "p",
    });
    assert.equal(c.profiles[0].businessName, "Trim me");
    assert.equal(c.profiles[0].website, "https://example.com");
    assert.ok(c.profiles[0].profileName.length <= 60);
  });
});

describe("looking a business up", () => {
  const c = defaultBusinesses();

  it("activeProfile is the default one", () => {
    assert.equal(activeProfile(c).id, c.activeId);
  });

  it("profileById finds one, or says it did not", () => {
    assert.equal(profileById(c, "smart-secure")?.profileName, "Smart & Secure");
    assert.equal(profileById(c, "nope"), undefined);
    assert.equal(profileById(c, ""), undefined);
    assert.equal(profileById(c, null), undefined);
  });

  it("profileOrDefault never returns undefined", () => {
    assert.equal(profileOrDefault(c, "smart-secure").id, "smart-secure");
    assert.equal(profileOrDefault(c, "nope").id, c.activeId);
    assert.equal(profileOrDefault(c, undefined).id, c.activeId);
  });

  it("a second business gets its own placeholders", () => {
    const smart = profileById(c, "smart-secure");
    assert.equal(fillText("Call {business} on {phone}", smart), `Call ${smart.businessName} on ${smart.phone}`);
    const easy = profileById(c, "easygates-direct");
    assert.notEqual(fillText("{phone}", smart), fillText("{phone}", easy), "the two businesses have different numbers");
  });
});

describe("multi-business is wired end to end", () => {
  it("the settings API loads and saves the list", () => {
    const api = read("src/app/api/settings/route.ts");
    assert.ok(api.includes("loadBusinesses"), "GET must return the businesses");
    assert.ok(api.includes("saveBusinesses(body.businesses)"), "PUT must save them");
    assert.ok(api.includes("await saveBrand(active)"), "saving the list must keep the legacy row in step");
  });

  it("settings.ts stores them under the `businesses` key", () => {
    const settings = read("src/lib/settings.ts");
    assert.ok(settings.includes('key: "businesses"'), "a separate key, so the old row is never lost");
    assert.ok(settings.includes("loadBrand()"), "the legacy row seeds the first profile");
  });

  it("a screen can be assigned to any business", () => {
    const player = read("src/app/api/player/route.ts");
    assert.ok(player.includes("loadBusinesses"), "the player must know the list");
    assert.ok(player.includes("profileById"), "and look the screen's business up by id");
    assert.ok(player.includes("businessId"), "the assignment lives in display.settings.businessId");
    assert.ok(player.includes("brand = assigned"), "and overrides the brand for that screen");
  });

  it("the admin shows the list, the editor and a per-screen picker", () => {
    const admin = read("src/app/admin/page.tsx");
    assert.ok(admin.includes("<BusinessPanel"), "the Business tab");
    assert.ok(admin.includes("businessesDraft"), "edits are a draft until saved");
    assert.ok(admin.includes('JSON.stringify({ businesses: businessesDraft })'), "and are saved as a collection");
    assert.ok(admin.includes("Business / branding"), "the Displays tab assigns a business per screen");
    assert.ok(admin.includes('settings: { businessId:'), "through display.settings.businessId");
    const panel = read("src/components/BusinessPanel.tsx");
    assert.ok(panel.includes("+ Add business") && panel.includes("Make default"), "add / set-default controls");
    assert.ok(panel.includes("draft.profiles.length > 1"), "the last business cannot be deleted");
    assert.ok(panel.includes("TICKER_SIZE_IDS.map"), "the ticker control survives the rewrite");
  });

  it("the Business panel still edits every brand setting", () => {
    const panel = read("src/components/BusinessPanel.tsx");
    for (const field of ["businessName", "phone", "logoUrl", "defaultBgImageUrl", "accentColor", "backgroundColor", "applyColors", "tickerText", "tickerOnAll", "showBrandBar", "showClock", "website", "tagline"]) {
      assert.ok(panel.includes(field), `the panel must still edit ${field}`);
    }
  });
});
