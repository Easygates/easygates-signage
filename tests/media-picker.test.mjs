// Guards the scene-editor media pickers. The row picker used to be rendered as a
// child of the row's `grid-cols-[1fr_150px_40px]` layout, so it was squeezed into
// the 40px action column and clipped to an unreadable sliver; the image URL and
// "pick from library" controls were equally hard to reach. These tests pin the
// layout rules that made it usable again.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const admin = readFileSync(join(root, "src/app/admin/page.tsx"), "utf8");
const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
const renderer = readFileSync(join(root, "src/components/SceneRenderer.tsx"), "utf8");

const picker = admin.slice(admin.indexOf("function LibraryPicker("), admin.indexOf("function MediaField("));
const itemsEditor = admin.slice(admin.indexOf("function ItemsEditor("), admin.indexOf("function AssetsPanel("));

describe("scene editor: media library picker", () => {
  it("never renders as a sliver inside a grid column", () => {
    // the old broken layout put the picker in a 40px grid cell
    assert.ok(!admin.includes("grid-cols-[1fr_150px_40px]"), "row picker must not live inside the narrow URL grid");
    assert.ok(!admin.includes("QUICK-SET ANY ROW IMAGE"), "the quick-set block silently edited the last row — remove it");
  });

  it("opens full width below the row it belongs to", () => {
    assert.ok(itemsEditor.includes("{showImage && picking && ("), "row picker must sit outside the row's flex/grid lines");
    assert.ok(itemsEditor.includes("onClose={() => setPickIndex(null)}"), "row picker needs a close button");
    assert.ok(itemsEditor.includes("aria-expanded={picking}"), "the 📂 button must report whether the picker is open");
    assert.ok(itemsEditor.includes("onPick={(url) => { edit(i, \"image\", url); setPickIndex(null); }}"), "picking a tile must set the row image and close the picker");
  });

  it("renders a real grid of labelled tiles instead of bare images", () => {
    assert.ok(picker.includes("grid-cols-3"), "thumbnails should be laid out in a grid");
    assert.ok(picker.includes("aria-pressed={active}"), "the in-use asset should be marked");
    assert.ok(picker.includes("onClick={() => onPick(a.url)}"), "tiles must be buttons");
    assert.ok(picker.includes(">{\" \"}</span>") || picker.includes("a.name}<"), "tiles should show the asset name");
  });

  it("shows an empty state instead of disappearing", () => {
    assert.ok(!picker.includes("if (pics.length === 0) return null"), "an empty library must not hide the picker silently");
    assert.ok(picker.includes("in the library yet"), "empty library needs an explanatory message");
  });

  it("filters videos out of the image picker and images out of the video picker", () => {
    assert.ok(picker.includes('media === "video" ? a.type === "video" : a.type !== "video"'), "picker must filter by media kind");
  });

  it("has a broken-file fallback so a bad URL is visible", () => {
    assert.ok(admin.includes("function Thumb("), "thumbnail fallback component missing");
    assert.ok(admin.includes("onError={() => setFailed(url)}") || admin.includes("onError={() => setFailed(value)}"), "thumbnails must handle load errors");
    assert.ok(admin.includes("could not be loaded"), "broken media should explain why the box is empty");
  });
});

describe("scene editor: image URL fields", () => {
  it("every media address field has an inline library button and preview", () => {
    assert.ok(admin.includes("function MediaField("), "MediaField missing");
    assert.equal((admin.match(/<MediaField/g) || []).length, 3, "slide image, background image and video need MediaField");
    assert.ok(admin.includes("Browse the media library"), "the field needs a visible library button");
    assert.ok(admin.includes("Can&apos;t load this"), "a mistyped address should say why nothing shows");
    assert.ok(admin.includes('label="Video URL (muted, looping hero background)"'), "video field label changed");
    assert.ok(admin.includes('media="video"'), "video field must filter the library to videos");
  });

  it("row image URLs get their own full-width line", () => {
    assert.ok(itemsEditor.includes("aria-label={`Row ${i + 1} image URL`}"), "row image input missing");
    assert.ok(itemsEditor.includes("inp !py-2 min-w-0 flex-1 text-xs"), "row image input must stretch instead of being clipped");
    assert.ok(itemsEditor.includes("<BrowseIcon /> Image"), "the row picker button needs a label, not a bare emoji");
  });

  it("shows the image field for every template that draws a row picture", () => {
    // templates whose renderer reads it.image
    const perRowImages = ["product-grid", "brand-wall", "deals-grid", "top-sellers", "clearance", "multibuy", "team-intro", "trustpilot-review"];
    const list = admin.slice(admin.indexOf("const IMAGE_TEMPLATES"), admin.indexOf("function ItemsEditor("));
    for (const t of perRowImages) {
      assert.ok(list.includes(`"${t}"`), `IMAGE_TEMPLATES is missing ${t} — its editor hides the image field`);
      assert.ok(renderer.includes("it.image"), "renderer should still draw row images");
    }
  });

  it("keeps the logo templates in contain mode so logos aren't cropped", () => {
    assert.ok(admin.includes('template === "brand-wall"'), "brand-wall logos should not be cropped");
    assert.ok(admin.includes('draft.template === "splash"'), "splash uses the slide image as a logo");
  });
});

describe("admin: shared form styles", () => {
  it(".lbl / .inp live in the global stylesheet, not in a <style jsx> block", () => {
    assert.ok(!admin.includes("<style jsx"), "styled-jsx is not injected by Turbopack dev — keep the styles in globals.css");
    assert.ok(css.includes(".lbl {"), ".lbl missing from globals.css");
    assert.ok(css.includes(".inp {"), ".inp missing from globals.css");
    assert.ok(css.includes("border-radius: 12px"), ".inp lost its rounded box");
  });
});

describe("assets: upload picker", () => {
  it("re-picking the same file works and drop-to-upload is real", () => {
    assert.ok(admin.includes('e.target.value = ""'), "file input must reset so choosing the same file twice fires change");
    assert.ok(admin.includes("onDrop={(e) =>"), "the drop zone advertises drag & drop but had no handler");
    assert.ok(admin.includes("setDragging"), "drop zone should highlight while dragging");
  });

  it("reports upload failures instead of failing silently", () => {
    assert.ok(admin.includes("if (!r.ok || j.error)"), "upload handler ignored HTTP errors");
    assert.ok(admin.includes("Upload failed"), "user needs a message when the upload fails");
  });
});

describe("scene editor: image URL actually affects the slide", () => {
  it("flags templates that ignore the slide image", () => {
    assert.ok(admin.includes("IMAGE_UNUSED_TEMPLATES"), "templates that ignore scene.imageUrl should be named");
    assert.ok(admin.includes("doesn&apos;t draw the slide image"), "the editor should explain why a typed image URL shows nothing");
    for (const t of ["product-grid", "deals-grid", "brand-wall"]) {
      assert.ok(admin.includes(`"${t}"`), `IMAGE_UNUSED_TEMPLATES is missing ${t}`);
    }
  });
});
