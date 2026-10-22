// ─── Which scene fields each template actually draws ─────────────────────────
//
// One table, consumed by the scene editor, the row editor and the tests. Before
// this existed the answer lived in three places — the renderer code, the "FIELDS"
// doc comment at the top of each template file, and hand-written lists in the
// admin (HIGHLIGHT_TEMPLATES, IMAGE_UNUSED_TEMPLATES, showPrice, showImage) —
// which drifted: the editor hid the image field on team-intro/trustpilot-review
// even though those templates draw `items[].image`, and offered price fields on
// templates that never render a price.
//
// When you add a template: add it here (the tests fail if you forget), and the
// editor will only offer the fields it draws.
import type { TemplateId } from "./signage";

/** Slide-level fields that a template may or may not draw. */
export type SceneTextField =
  | "eyebrow"
  | "subheadline"
  | "productName"
  | "description"
  | "originalPrice"
  | "promoPrice"
  | "discountBadge"
  | "ctaText"
  | "imageUrl"
  | "videoUrl"
  | "highlightColor";

/** Fields of one row in `scene.items`, in the order the editor shows them. */
export type RowField = "name" | "price" | "tag" | "desc" | "image";

export interface TemplateFieldSpec {
  /** Slide-level fields the renderer reads. `headline` is used everywhere and is not listed. */
  text: SceneTextField[];
  /** `scene.items[]` fields the renderer reads. Empty = the template has no rows. */
  rows: RowField[];
  /**
   * How the slide-level `imageUrl` is drawn:
   * - "hero"  — full-bleed / cover photo (Ken Burns applies)
   * - "logo"  — drawn whole on a plate, e.g. the splash logo
   * - "none"  — the template never draws it (rows carry the pictures instead)
   */
  image: "hero" | "logo" | "none";
}

const t = (
  text: SceneTextField[],
  rows: RowField[] = [],
  image: TemplateFieldSpec["image"] = "hero",
): TemplateFieldSpec => ({ text, rows, image });

/**
 * Derived from each renderer (src/components/SceneRenderer.tsx and
 * src/components/scene/templates/*.tsx) — see the "FIELDS" comment at the top of
 * every template file. `tests/template-fields.test.mjs` cross-checks this table
 * against those comments so the two cannot drift apart again.
 */
export const TEMPLATE_FIELDS: Record<TemplateId, TemplateFieldSpec> = {
  // ── Retail / value ──────────────────────────────────────────────────────────
  "retail-promo": t(
    ["eyebrow", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl"],
  ),
  "food-menu": t(
    ["eyebrow", "ctaText", "imageUrl", "videoUrl"],
    ["name", "price", "desc", "tag"],
  ),
  "product-showcase": t(
    ["eyebrow", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl", "videoUrl"],
    ["name"],
  ),
  "product-grid": t(
    ["eyebrow", "subheadline", "ctaText"],
    ["name", "price", "desc", "tag", "image"],
    "none",
  ),
  announcement: t(["eyebrow", "subheadline", "ctaText", "imageUrl"]),
  "fullscreen-campaign": t(
    ["eyebrow", "subheadline", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl", "videoUrl"],
  ),
  "split-promo": t(
    ["eyebrow", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl", "videoUrl"],
  ),

  // ── Trade-counter retail (Screwfix-style) ───────────────────────────────────
  "bulk-buy": t(
    ["eyebrow", "subheadline", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl", "highlightColor"],
    ["name", "price", "desc", "tag"],
    "hero",
  ),
  "shelf-edge": t(
    ["eyebrow", "subheadline", "ctaText", "highlightColor"],
    ["name", "price", "desc", "tag", "image"],
    "none",
  ),
  "flash-sale": t(
    ["eyebrow", "subheadline", "description", "promoPrice", "discountBadge", "ctaText", "highlightColor"],
    ["name", "desc", "tag"],
    "none",
  ),
  "click-collect": t(
    ["eyebrow", "subheadline", "productName", "description", "ctaText", "imageUrl"],
    ["name", "desc", "tag"],
    "hero",
  ),
  "trade-account": t(
    ["eyebrow", "subheadline", "description", "discountBadge", "ctaText", "highlightColor"],
    ["name", "desc", "tag"],
    "none",
  ),

  // ── Value store ─────────────────────────────────────────────────────────────
  "price-drop": t(
    ["eyebrow", "subheadline", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl", "highlightColor"],
  ),
  "deals-grid": t(
    ["eyebrow", "subheadline", "ctaText", "highlightColor"],
    ["name", "price", "desc", "tag", "image"],
    "none",
  ),
  multibuy: t(
    ["eyebrow", "subheadline", "description", "ctaText", "highlightColor"],
    ["name", "price", "tag", "image"],
    "none",
  ),
  clearance: t(
    ["eyebrow", "subheadline", "ctaText", "highlightColor"],
    ["name", "price", "tag", "desc", "image"],
    "none",
  ),
  "aisle-guide": t(
    ["eyebrow", "subheadline", "productName", "ctaText"],
    ["name", "desc"],
    "none",
  ),
  "top-sellers": t(
    ["eyebrow", "subheadline", "ctaText", "highlightColor"],
    ["name", "price", "desc", "tag", "image"],
    "none",
  ),
  "store-services": t(
    ["eyebrow", "subheadline", "ctaText", "highlightColor"],
    ["name", "desc", "tag"],
    "none",
  ),

  // ── Brand / splash ──────────────────────────────────────────────────────────
  splash: t(
    ["eyebrow", "subheadline", "ctaText", "imageUrl"],
    ["name", "desc", "tag"],
    "logo",
  ),

  // ── Trade ───────────────────────────────────────────────────────────────────
  "service-offer": t(
    ["eyebrow", "subheadline", "description", "promoPrice", "ctaText", "imageUrl"],
    ["name", "desc"],
  ),
  "price-list": t(
    ["eyebrow", "subheadline", "description", "ctaText"],
    ["name", "price", "desc", "tag"],
    "none",
  ),
  "brand-wall": t(
    ["eyebrow", "subheadline", "ctaText"],
    ["name", "desc", "image"],
    "none",
  ),
  "product-spec": t(
    ["eyebrow", "productName", "description", "originalPrice", "promoPrice", "discountBadge", "ctaText", "imageUrl"],
    ["name", "desc"],
  ),
  "callout-emergency": t(
    ["eyebrow", "subheadline", "productName", "description", "ctaText", "imageUrl", "videoUrl"],
    ["name", "desc"],
  ),

  // ── Corporate / social proof ────────────────────────────────────────────────
  "company-values": t(
    ["eyebrow", "subheadline", "imageUrl"],
    ["name", "desc"],
  ),
  "team-intro": t(
    ["eyebrow", "subheadline", "ctaText"],
    ["name", "desc", "image"],
    "none",
  ),
  "corporate-milestone": t(
    ["eyebrow", "subheadline", "description", "ctaText", "imageUrl"],
  ),
  "corporate-news": t(
    ["eyebrow", "subheadline", "description", "ctaText", "imageUrl"],
  ),
  "testimonial-quote": t(
    ["subheadline", "productName", "description", "ctaText", "imageUrl"],
    ["name", "desc", "tag"],
  ),
  // Media only: the renderer draws the image/video and nothing else, so no text
  // field is offered (headline and ticker are hidden too — see templateIsMediaOnly).
  "fullscreen-bg": t(["imageUrl", "videoUrl"]),
  "trustpilot-review": t(
    ["eyebrow", "subheadline", "description", "ctaText", "imageUrl"],
    ["name", "desc", "tag", "image"],
    "logo",
  ),
};

/**
 * Templates that draw nothing but their media. The player hides the brand bar
 * (logo, business name, clock) and the ticker for these, and the editor hides
 * Headline and Ticker, so an "ambient background" slide really is just the
 * picture or the video.
 */
export const MEDIA_ONLY_TEMPLATES: TemplateId[] = ["fullscreen-bg"];

/** true when the template shows only its image/video — no text, logo, clock or ticker. */
export function templateIsMediaOnly(template: TemplateId): boolean {
  return MEDIA_ONLY_TEMPLATES.includes(template);
}

/** Every gateable slide field, in editor order (used to count hidden ones). */
export const SCENE_TEXT_FIELDS: SceneTextField[] = [
  "eyebrow",
  "subheadline",
  "productName",
  "description",
  "originalPrice",
  "promoPrice",
  "discountBadge",
  "ctaText",
  "imageUrl",
  "videoUrl",
  "highlightColor",
];

const spec = (template: TemplateId): TemplateFieldSpec =>
  TEMPLATE_FIELDS[template] ?? t(SCENE_TEXT_FIELDS);

/** true when the template draws this slide-level field. */
export function templateUses(template: TemplateId, field: SceneTextField): boolean {
  return spec(template).text.includes(field);
}

/** The row fields the template draws, in editor order. */
export function templateRows(template: TemplateId): RowField[] {
  return spec(template).rows;
}

/** "hero" | "logo" | "none" — how the slide image is drawn. */
export function templateImageMode(template: TemplateId): TemplateFieldSpec["image"] {
  return spec(template).image;
}

/** Templates whose renderer ignores `scene.imageUrl` (they draw row pictures instead). */
export const IMAGE_UNUSED_TEMPLATES: TemplateId[] = (Object.keys(TEMPLATE_FIELDS) as TemplateId[]).filter(
  (id) => TEMPLATE_FIELDS[id].image === "none",
);
