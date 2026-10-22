// ─── Signage core: types, template catalogue, animation engine, demo campaign ──

export type TemplateId =
  | "retail-promo"
  | "food-menu"
  | "product-showcase"
  | "product-grid"
  | "announcement"
  | "fullscreen-campaign"
  | "split-promo"
  // ── value retail templates (big-box discount store) ──
  | "price-drop"
  | "deals-grid"
  | "multibuy"
  | "clearance"
  | "aisle-guide"
  | "top-sellers"
  | "store-services"
  // ── brand ──
  | "splash"
  // ── trade templates (electrical / smart home / gate automation) ──
  | "service-offer"
  | "price-list"
  | "brand-wall"
  | "product-spec"
  | "callout-emergency"
  // ── corporate templates ──
  | "company-values"
  | "team-intro"
  | "corporate-milestone"
  | "corporate-news"
  | "testimonial-quote"
  // ── background only ──
  | "fullscreen-bg"
  // ── social proof ──
  | "trustpilot-review"
  // ── trade-counter retail (Screwfix-style) ──
  | "bulk-buy"
  | "shelf-edge"
  | "flash-sale"
  | "click-collect"
  | "trade-account";

/** Templates that read the `items` array */
export const ITEM_TEMPLATES: TemplateId[] = [
  "food-menu",
  "product-grid",
  "product-showcase",
  "service-offer",
  "price-list",
  "brand-wall",
  "product-spec",
  "callout-emergency",
  "deals-grid",
  "clearance",
  "top-sellers",
  "multibuy",
  "aisle-guide",
  "store-services",
  "company-values",
  "team-intro",
  "testimonial-quote",
  "trustpilot-review",
  // splash draws its contact cards from items[] — it was missing here, so the
  // editor never offered the rows and the cards could not be changed in the CMS.
  "splash",
  // trade-counter retail templates
  "bulk-buy",
  "shelf-edge",
  "flash-sale",
  "click-collect",
  "trade-account",
];

export type AnimationPresetId =
  | "launch"
  | "smooth"
  | "cinematic"
  | "snap"
  | "elegant";

export type TransitionId =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "wipe"
  | "zoom"
  | "cut";

export type KenBurnsId = "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "static";

export interface SceneItem {
  name: string;
  price?: string;
  desc?: string;
  tag?: string;
  image?: string;
}

export interface Scene {
  id: string;
  name: string;
  template: TemplateId;
  /** Seasonal theme: christmas | easter | halloween | spring | summer | autumn | winter | none */
  theme?: string;
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  productName?: string;
  description?: string;
  originalPrice?: string;
  promoPrice?: string;
  discountBadge?: string;
  ctaText?: string;
  tickerText?: string;
  imageUrl?: string;
  imageFit?: string;
  imagePosition?: string;
  videoUrl?: string;
  bgImageUrl?: string;
  /** Render-time only (brand mode): tints the background-image overlay instead of black. Never persisted. */
  overlayColor?: string;
  /** Render-time only: the business logo and name from Business settings (used by the splash template). Never persisted. */
  brandLogoUrl?: string;
  brandName?: string;
  bgFrom: string;
  bgTo: string;
  bgAngle: number;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
  /** Second colour of the value-store templates (default sale yellow). Empty = template default. */
  highlightColor?: string;
  animationPreset: AnimationPresetId;
  durationSec: number;
  transition: TransitionId;
  staggerMs: number;
  kenBurns: KenBurnsId;
  overlayOpacity: number;
  layoutVariant: string;
  items?: SceneItem[] | null;
  updatedAt?: string;
}

export const TEMPLATES: {
  id: TemplateId;
  name: string;
  blurb: string;
  bestFor: string;
}[] = [
  { id: "retail-promo", name: "Retail Promotion", blurb: "Hero product, strikethrough price, promo price, badge + CTA", bestFor: "Hero deals & price drops" },
  { id: "food-menu", name: "Food Menu Board", blurb: "Large food photo, categories, priced list, featured item", bestFor: "QSR / café menu boards" },
  { id: "product-showcase", name: "Product Showcase", blurb: "Full-bleed hero image, cinematic text, spec chips", bestFor: "Flagship launches" },
  { id: "product-grid", name: "Multi-Product Grid", blurb: "3–4 products with coordinated staggered entrances", bestFor: "Collections & bundles" },
  { id: "announcement", name: "Announcement", blurb: "Oversized headline, supporting copy, ticker", bestFor: "Store news & events" },
  { id: "fullscreen-campaign", name: "Full-Screen Campaign", blurb: "Immersive layered image + display typography", bestFor: "Brand moments" },
  { id: "split-promo", name: "Split-Screen Promo", blurb: "Imagery one side, animated offer stack other side", bestFor: "Dual-message promos" },
  // ── trade-counter retail templates (Screwfix-style) ──
  { id: "bulk-buy", name: "Bulk Buy", blurb: "Catalogue product card beside a quantity-break price ladder — buy more, pay less", bestFor: "Multi-buy trade pricing" },
  { id: "shelf-edge", name: "Shelf-Edge Deals", blurb: "Up to six shelf-edge labels with catalogue numbers, pack tags, barcodes and big red prices", bestFor: "Weekly trade-counter offers" },
  { id: "flash-sale", name: "Flash Sale", blurb: "Hazard-taped event board with a giant percentage burst and the categories included", bestFor: "48-hour sales & trade events" },
  { id: "click-collect", name: "Click & Collect", blurb: "Stopwatch dial and numbered collection steps — order, pick, collect", bestFor: "Collection & fulfilment promises" },
  { id: "trade-account", name: "Trade Account", blurb: "Oversized trade card, account benefits and an apply-now plate", bestFor: "Trade sign-ups & account promos" },
  // ── value retail templates (big-box discount store) ──
  { id: "price-drop", name: "Price Drop", blurb: "Hero product, huge new price, struck-through was-price, flag + burst sticker", bestFor: "Single-hero discount promos" },
  { id: "deals-grid", name: "Deals Grid", blurb: "Header banner, six deal tiles with per-tile flags, ends-Sunday strip", bestFor: "Multi-item weekly offers" },
  { id: "multibuy", name: "Multi-Buy", blurb: "Large offer lockup (3 for £10 / B2G1F) with three product images in a row", bestFor: "Bundle & multipack promos" },
  { id: "clearance", name: "Clearance", blurb: "Red-and-yellow tag style, up to 4 items each with % off and optional stock count", bestFor: "End-of-line & last-chance stock" },
  { id: "aisle-guide", name: "Aisle Guide", blurb: "Department name, giant aisle circle number, arrow, sub-category list", bestFor: "Store wayfinding" },
  { id: "top-sellers", name: "Top Sellers", blurb: "Numbered top-5 list with thumbnails and prices; rank numbers are the hero", bestFor: "Bestseller charts" },
  { id: "store-services", name: "Store Services", blurb: "Click & collect, returns, opening hours table, customer services with icons", bestFor: "Customer information boards" },
  // ── brand ──
  { id: "splash", name: "Splash / Welcome", blurb: "Logo on a white plate, tagline and a row of contact details (phone, hours, address)", bestFor: "Welcome screens & contact info" },
  // ── trade ──
  { id: "service-offer", name: "Service & Installation", blurb: "What you fit, ticked list, from-price, call to action", bestFor: "Gate automation & electrical services" },
  { id: "price-list", name: "Trade Price List", blurb: "Two-column rate card, dotted leaders, VAT footnote", bestFor: "Upfront job pricing" },
  { id: "brand-wall", name: "Brands & Ecosystems", blurb: "Typographic wall of the systems you install", bestFor: "Smart home showrooms" },
  { id: "product-spec", name: "Product Spec Sheet", blurb: "Hero product beside a label/value specification table", bestFor: "Motors, kits & panels" },
  { id: "callout-emergency", name: "Emergency Call-Out", blurb: "Oversized phone number, response promise, fault types", bestFor: "24/7 electricians & gate engineers" },
  // ── corporate templates ──
  { id: "company-values", name: "Company Values", blurb: "Mission statement + a list of values or principles", bestFor: "Reception & office screens" },
  { id: "team-intro", name: "Meet the Team", blurb: "Team photo grid with names and roles", bestFor: "Staff introductions" },
  { id: "corporate-milestone", name: "Milestone / Anniversary", blurb: "Big number headline + celebratory message", bestFor: "Years in business & awards" },
  { id: "corporate-news", name: "Company News", blurb: "Headline, story and date — news ticker style", bestFor: "Internal comms & announcements" },
  { id: "testimonial-quote", name: "Testimonial / Quote", blurb: "Large quote with attribution and optional customer photo", bestFor: "Customer praise & reviews" },
  // ── background only ──
  { id: "fullscreen-bg", name: "Background Image / Video", blurb: "Full-screen image or video only — no text, logo or ticker", bestFor: "Ambient & mood screens" },
  // ── social proof ──
  { id: "trustpilot-review", name: "Trustpilot Review", blurb: "Trustpilot rating, star breakdown and top reviews — social proof for reception screens", bestFor: "Customer trust & reputation" },
];

/** Groups for the template picker in the admin. Any template not listed lands in "Other". */
export const TEMPLATE_CATEGORIES: { id: string; name: string; templates: TemplateId[] }[] = [
  { id: "retail", name: "Retail & promo", templates: ["retail-promo", "food-menu", "product-showcase", "product-grid", "announcement", "fullscreen-campaign", "split-promo", "bulk-buy", "shelf-edge", "flash-sale", "click-collect", "trade-account"] },
  { id: "value", name: "Value store · deals", templates: ["price-drop", "deals-grid", "multibuy", "clearance", "top-sellers"] },
  { id: "store-info", name: "Value store · in-store info", templates: ["aisle-guide", "store-services"] },
  { id: "brand", name: "Brand & welcome", templates: ["splash"] },
  { id: "trade", name: "Trade & services", templates: ["service-offer", "price-list", "brand-wall", "product-spec", "callout-emergency"] },
  { id: "corporate", name: "Corporate", templates: ["company-values", "team-intro", "corporate-milestone", "corporate-news", "testimonial-quote", "fullscreen-bg"] },
  { id: "social-proof", name: "Social proof", templates: ["trustpilot-review"] },
];

export function templateCategory(id: string): string {
  return TEMPLATE_CATEGORIES.find((c) => (c.templates as string[]).includes(id))?.id ?? "other";
}

/**
 * An animation preset is the *entrance language* of a slide. Three things make
 * it distinct, and all three are applied to every element the template animates:
 *
 *   baseMs / staggerMs — timing (how long, how far apart)
 *   easing             — the curve (snappy vs. calm)
 *   rise / scaleFrom / popFrom — the geometry (how far it travels, how small it
 *                        starts). These are published as CSS variables on the
 *                        slide root and consumed by the sg-* keyframes, so the
 *                        same template really does enter differently.
 *
 * Before the geometry existed, "Cinematic" and "Elegant Fade" differed only in
 * millisecond counts, while their names promised choreography. They now differ
 * in shape as well.
 */
export const ANIMATION_PRESETS: Record<
  AnimationPresetId,
  {
    name: string;
    blurb: string;
    baseMs: number;
    staggerMs: number;
    easing: string;
    /** how far elements travel up on entry (px) */
    rise: number;
    /** scale elements start from (1 = no scale) */
    scaleFrom: number;
    /** scale used by the springy “pop” treatment */
    popFrom: number;
  }
> = {
  launch: {
    name: "Launch Pop", blurb: "Big rise, bold scale. High-energy retail.",
    baseMs: 700, staggerMs: 120, easing: "cubic-bezier(0.16,1,0.3,1)",
    rise: 56, scaleFrom: 0.78, popFrom: 0.4,
  },
  smooth: {
    name: "Smooth Rise", blurb: "Gentle fade-up cascade. Safe default.",
    baseMs: 800, staggerMs: 140, easing: "cubic-bezier(0.22,1,0.36,1)",
    rise: 28, scaleFrom: 0.94, popFrom: 0.8,
  },
  cinematic: {
    name: "Cinematic", blurb: "Long, wide settle from slight over-scale. Flagship.",
    baseMs: 1100, staggerMs: 180, easing: "cubic-bezier(0.25,1,0.4,1)",
    rise: 12, scaleFrom: 1.06, popFrom: 0.9,
  },
  snap: {
    name: "Retail Snap", blurb: "Tight, quick, price-grid friendly.",
    baseMs: 500, staggerMs: 80, easing: "cubic-bezier(0.34,1.3,0.64,1)",
    rise: 10, scaleFrom: 0.86, popFrom: 0.55,
  },
  elegant: {
    name: "Elegant Fade", blurb: "Almost no travel — a calm fade. Premium.",
    baseMs: 1000, staggerMs: 160, easing: "ease-out",
    rise: 6, scaleFrom: 1, popFrom: 0.96,
  },
};

/** CSS custom properties that carry a preset's entrance geometry into the slide. */
export function presetVars(preset: (typeof ANIMATION_PRESETS)[AnimationPresetId]): Record<string, string> {
  return {
    "--sg-rise": `${preset.rise}px`,
    "--sg-scale-from": String(preset.scaleFrom),
    "--sg-pop-from": String(preset.popFrom),
  };
}

export const TRANSITIONS: { id: TransitionId; name: string; blurb: string }[] = [
  { id: "fade", name: "Crossfade", blurb: "Soft opacity blend" },
  { id: "slide-left", name: "Slide Left", blurb: "Push forward" },
  { id: "slide-right", name: "Slide Right", blurb: "Push back" },
  { id: "wipe", name: "Wipe", blurb: "Graphic colour wipe" },
  { id: "zoom", name: "Zoom", blurb: "Scale through" },
  { id: "cut", name: "Cut", blurb: "Instant (low-power safe)" },
];

export const EASINGS: Record<string, string> = {
  outExpo: "cubic-bezier(0.16,1,0.3,1)",
  outQuart: "cubic-bezier(0.25,1,0.5,1)",
  spring: "cubic-bezier(0.34,1.4,0.64,1)",
  soft: "cubic-bezier(0.22,1,0.36,1)",
};

export interface TimelineStep {
  key: string;
  label: string;
  atMs: number;
  durMs: number;
  effect: string;
}

/** Build a deterministic, human-readable timeline for a scene.
 *  Used by the player (scheduling), the admin timeline inspector,
 *  and the self-test. Mirrors the CSS delays in SceneRenderer.
 */
export function buildTimeline(scene: Scene): TimelineStep[] {
  const preset = ANIMATION_PRESETS[scene.animationPreset] ?? ANIMATION_PRESETS.smooth;
  const stagger = scene.staggerMs ?? preset.staggerMs;
  const b = preset.baseMs;
  const steps: TimelineStep[] = [
    { key: "bg", label: "Background animates in", atMs: 0, durMs: 900, effect: "gradient pan + shapes" },
    { key: "image", label: "Product image zooms into position", atMs: 150, durMs: b + 300, effect: `ken-burns:${scene.kenBurns}` },
    { key: "eyebrow", label: "Eyebrow / kicker reveals", atMs: 350, durMs: b, effect: "fade-up + mask" },
    { key: "title", label: "Product name typography reveal", atMs: 350 + stagger, durMs: b, effect: "masked line reveal" },
    { key: "orig", label: "Original price appears", atMs: 350 + stagger * 2, durMs: 500, effect: "fade + strikethrough draw" },
    { key: "promo", label: "Promotional price animates", atMs: 350 + stagger * 3, durMs: 650, effect: "scale-pop + shimmer" },
    { key: "badge", label: "Discount badge pops", atMs: 350 + stagger * 4, durMs: 600, effect: "spring scale" },
    { key: "body", label: "Supporting text + CTA appear", atMs: 350 + stagger * 5, durMs: b, effect: "fade-up cascade" },
    { key: "hold", label: `Hold for reading`, atMs: 350 + stagger * 5 + b, durMs: Math.max(1200, scene.durationSec * 1000 - 2600), effect: "subtle float / ken-burns" },
    { key: "exit", label: `Exit via ${scene.transition}`, atMs: scene.durationSec * 1000 - 600, durMs: 600, effect: scene.transition },
  ];
  return steps;
}

export function transitionClass(t: TransitionId, phase: "enter" | "exit"): string {
  if (t === "cut") return phase === "enter" ? "sg-t-enter-cut" : "sg-t-exit-cut";
  if (t === "slide-left") return phase === "enter" ? "sg-t-enter-left" : "sg-t-exit-left";
  if (t === "slide-right") return phase === "enter" ? "sg-t-enter-right" : "sg-t-exit-right";
  if (t === "wipe") return phase === "enter" ? "sg-t-enter-wipe" : "sg-t-exit-wipe";
  if (t === "zoom") return phase === "enter" ? "sg-t-enter-zoom" : "sg-t-exit-zoom";
  return phase === "enter" ? "sg-t-enter-fade" : "sg-t-exit-fade";
}

// ─── Demo campaign: "NOVA MART — Winter Sale Event" (fictional) ───

const IMG = {
  headphones:
    "https://images.pexels.com/photos/14935011/pexels-photo-14935011.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  headphonesRed:
    "https://images.pexels.com/photos/13650607/pexels-photo-13650607.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  watch:
    "https://images.pexels.com/photos/10744791/pexels-photo-10744791.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sneakers:
    "https://images.pexels.com/photos/1020372/pexels-photo-1020372.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sneakerWall:
    "https://images.pexels.com/photos/2908975/pexels-photo-2908975.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  burger:
    "https://images.pexels.com/photos/3504876/pexels-photo-3504876.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  burgerBoard:
    "https://images.pexels.com/photos/29481861/pexels-photo-29481861.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  coffee:
    "https://images.pexels.com/photos/8616015/pexels-photo-8616015.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  perfume:
    "https://images.pexels.com/photos/37127787/pexels-photo-37127787.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tvRoom:
    "https://images.pexels.com/photos/5202925/pexels-photo-5202925.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

export const DEMO_SCENES: Scene[] = [
  {
    id: "demo-1",
    name: "01 · Sonic Boom Headphones — Hero Deal",
    template: "retail-promo",
    eyebrow: "NOVA MART · WINTER SALE EVENT",
    headline: "HEAR EVERYTHING.",
    productName: "Auralux X9 Wireless",
    description: "40h battery · Adaptive noise cancelling · Studio drivers. Our best-selling over-ears, now at their lowest price of the season.",
    originalPrice: "£249",
    promoPrice: "£149",
    discountBadge: "-40%",
    ctaText: "TODAY ONLY · WHILE STOCKS LAST",
    tickerText: "FREE 2-YEAR WARRANTY ON ALL AUDIO — EXTRA 10% OFF WHEN YOU SPEND £200 —",
    imageUrl: IMG.headphones,
    bgFrom: "#070b18",
    bgTo: "#23307a",
    bgAngle: 135,
    accentColor: "#ff3b30",
    textColor: "#ffffff",
    mutedColor: "#c3cbe4",
    cardColor: "#121a38",
    animationPreset: "launch",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 120,
    kenBurns: "zoom-in",
    overlayOpacity: 30,
    layoutVariant: "A",
  },
  {
    id: "demo-2",
    name: "02 · Stack House Burgers — Menu Board",
    template: "food-menu",
    eyebrow: "STACK HOUSE · SERVED TILL 10PM",
    headline: "SMASHED. STACKED. SAUCED.",
    productName: "Menu Board",
    description: "Flame-grilled, made to order.",
    ctaText: "TAP TO ORDER · KIOSK 04",
    tickerText: "DOUBLE UP ANY BURGER FOR £2 — STUDENT DISCOUNT 15% AFTER 4PM —",
    imageUrl: IMG.burger,
    bgFrom: "#160903",
    bgTo: "#4d1c05",
    bgAngle: 140,
    accentColor: "#ffb020",
    textColor: "#fff8ec",
    mutedColor: "#e8c99a",
    cardColor: "#241106",
    animationPreset: "smooth",
    durationSec: 12,
    transition: "fade",
    staggerMs: 110,
    kenBurns: "pan-left",
    overlayOpacity: 25,
    layoutVariant: "A",
    items: [
      { name: "Classic Smash", price: "£6.95", desc: "Double patty, cheddar, house sauce", tag: "BESTSELLER" },
      { name: "Bacon Jam Stack", price: "£8.45", desc: "Candied bacon, crispy onions", tag: "NEW" },
      { name: "Truffle Shroom", price: "£7.95", desc: "Portobello, truffle mayo, rocket" },
      { name: "Loaded Fries", price: "£3.95", desc: "Cheese sauce, jalapeños, spring onion" },
      { name: "Vanilla Shake", price: "£4.25", desc: "Thick-spun, torched marshmallow", tag: "FEATURED" },
    ],
  },
  {
    id: "demo-3",
    name: "03 · Pulse S2 Watch — Showcase",
    template: "product-showcase",
    eyebrow: "NEW ARRIVAL · NOVA WEARABLES",
    headline: "TIME, UPGRADED.",
    productName: "Pulse S2 Smartwatch",
    description: "AMOLED display · 14-day battery · 5ATM waterproof. Health, notifications and music on your wrist.",
    items: [
      { name: "AMOLED DISPLAY" },
      { name: "14-DAY BATTERY" },
      { name: "5ATM WATERPROOF" },
      { name: "BT 5.3" },
    ],
    originalPrice: "£199",
    promoPrice: "£159",
    discountBadge: "SAVE £40",
    ctaText: "TRY IT IN STORE · LEVEL 1",
    imageUrl: IMG.watch,
    bgFrom: "#041418",
    bgTo: "#0b3b46",
    bgAngle: 150,
    accentColor: "#22e0c8",
    textColor: "#ffffff",
    mutedColor: "#a9d8d2",
    cardColor: "#07272e",
    animationPreset: "cinematic",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 170,
    kenBurns: "zoom-out",
    overlayOpacity: 55,
    layoutVariant: "A",
  },
  {
    id: "demo-4",
    name: "04 · Street Run Collection — Grid",
    template: "product-grid",
    eyebrow: "FOOTWEAR · 3 FOR 2 MIX & MATCH",
    headline: "RUN THE STREET.",
    subheadline: "Cheapest pair free across the collection.",
    ctaText: "3 FOR 2 · ENDS SUNDAY",
    imageUrl: IMG.sneakers,
    bgFrom: "#12041f",
    bgTo: "#4c1470",
    bgAngle: 130,
    accentColor: "#e879f9",
    textColor: "#ffffff",
    mutedColor: "#d9bdf0",
    cardColor: "#221031",
    animationPreset: "snap",
    durationSec: 11,
    transition: "slide-right",
    staggerMs: 90,
    kenBurns: "static",
    overlayOpacity: 20,
    layoutVariant: "A",
    items: [
      { name: "Velocity Knit", price: "£79", desc: "Was £99", tag: "-20%", image: IMG.sneakers },
      { name: "Court Classic", price: "£65", desc: "Was £85", tag: "-24%", image: IMG.sneakerWall },
      { name: "Aero Glide", price: "£89", desc: "Was £120", tag: "-26%", image: IMG.coffee },
      { name: "Retro High", price: "£72", desc: "Was £95", tag: "NEW", image: IMG.burgerBoard },
    ],
  },
  {
    id: "demo-5",
    name: "05 · Store Announcement — Late Opening",
    template: "announcement",
    eyebrow: "NOVA MART · LAKESIDE",
    headline: "WE'RE OPEN TILL MIDNIGHT.",
    subheadline: "Late-night shopping Friday – Sunday with live DJs, tastings and 20% off everything after 8pm.",
    ctaText: "FREE PARKING AFTER 6PM",
    tickerText: "BLACK FRIDAY PREVIEW NIGHT — THURSDAY 8PM — TICKETS AT CUSTOMER SERVICE —",
    imageUrl: IMG.tvRoom,
    bgFrom: "#0a1030",
    bgTo: "#2743c7",
    bgAngle: 120,
    accentColor: "#ffd60a",
    textColor: "#ffffff",
    mutedColor: "#c6d2ff",
    cardColor: "#101a45",
    animationPreset: "elegant",
    durationSec: 10,
    transition: "wipe",
    staggerMs: 150,
    kenBurns: "static",
    overlayOpacity: 55,
    layoutVariant: "A",
  },
  {
    id: "demo-6",
    name: "06 · Essence Noir — Campaign",
    template: "fullscreen-campaign",
    eyebrow: "FRAGRANCE · LIMITED EDITION",
    headline: "ESSENCE NOIR",
    subheadline: "Smoked oud · Black amber · Vanilla bourbon",
    productName: "Essence Noir 100ml",
    description: "A limited winter exclusive. Numbered bottles, gift-wrapped in store.",
    originalPrice: "£120",
    promoPrice: "£89",
    discountBadge: "LIMITED",
    ctaText: "EXCLUSIVE TO NOVA MART",
    imageUrl: IMG.perfume,
    bgFrom: "#0d0202",
    bgTo: "#3d0f0f",
    bgAngle: 145,
    accentColor: "#f5c542",
    textColor: "#fffaf0",
    mutedColor: "#e6cfa4",
    cardColor: "#220909",
    animationPreset: "cinematic",
    durationSec: 12,
    transition: "fade",
    staggerMs: 160,
    kenBurns: "zoom-in",
    overlayOpacity: 60,
    layoutVariant: "A",
  },
  {
    id: "demo-7",
    name: "07 · Café Nova — Split Promo",
    template: "split-promo",
    eyebrow: "CAFÉ NOVA · LEVEL 2",
    headline: "ANY LARGE COFFEE + PASTRY £4.50",
    productName: "Morning Ritual",
    description: "Single-origin espresso, oat flat whites, fresh-baked croissants till 11am daily.",
    originalPrice: "£6.20",
    promoPrice: "£4.50",
    discountBadge: "SAVE 27%",
    ctaText: "SHOW THIS SCREEN FOR A FREE SHOT",
    imageUrl: IMG.coffee,
    bgFrom: "#f7efe2",
    bgTo: "#e8cfa8",
    bgAngle: 135,
    accentColor: "#b3540a",
    textColor: "#2b1603",
    mutedColor: "#7a5a3a",
    cardColor: "#ffffff",
    animationPreset: "smooth",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 120,
    kenBurns: "pan-right",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
  {
    id: "demo-8",
    name: "08 · Big Screen Event — Split Finale",
    template: "split-promo",
    eyebrow: "TECH EVENT · 0% FINANCE AVAILABLE",
    headline: "THE BIG SCREEN EVENT.",
    productName: '55" 4K QLED Smart TV',
    description: "Quantum colour · 120Hz motion · Voice remote included. Free wall-mount with every TV this week.",
    originalPrice: "£799",
    promoPrice: "£549",
    discountBadge: "-31%",
    ctaText: "FREE DELIVERY + INSTALLATION",
    tickerText: "0% FINANCE OVER £499 — PRICE-MATCH PROMISE —",
    imageUrl: IMG.tvRoom,
    bgFrom: "#04081a",
    bgTo: "#14306e",
    bgAngle: 135,
    accentColor: "#4cc9f0",
    textColor: "#ffffff",
    mutedColor: "#b9cdf5",
    cardColor: "#0d1c42",
    animationPreset: "launch",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 120,
    kenBurns: "zoom-in",
    overlayOpacity: 15,
    layoutVariant: "B",
  },
];

export function demoPlaylist() {
  return {
    id: "demo-playlist",
    name: "NOVA MART · Winter Sale Event (Demo)",
    description: "8-scene sample campaign covering the retail templates",
    scenes: DEMO_SCENES,
  };
}

// ─── Trade campaign: electrical · smart home · gate automation (fictional) ───

const TRADE_IMG = {
  gate: "/trade/gate-hero.jpg",
  install: "/trade/gate-install.jpg",
  panel: "/trade/smart-panel.jpg",
  ev: "/trade/ev-charger.jpg",
  board: "/trade/consumer-unit.jpg",
};

export const TRADE_DEMO_SCENES: Scene[] = [
  {
    id: "trade-1",
    name: "01 · Sliding Gate Kit — Hero Deal",
    template: "retail-promo",
    eyebrow: "{business} · GATE AUTOMATION",
    headline: "YOUR DRIVE. AUTOMATED.",
    productName: "EasyGlide 400 Sliding Kit",
    description:
      "24V brushless motor · up to 400 kg · app + 2 remotes · 5-year warranty. Supplied and fitted by our own engineers, usually in a day.",
    originalPrice: "£1,099",
    promoPrice: "£849",
    discountBadge: "SAVE £250",
    ctaText: "FREE SITE SURVEY · BOOK THIS WEEK",
    tickerText: "0% FINANCE ON KITS OVER £1,000 — WE SERVICE AND REPAIR ANY MAKE OF GATE —",
    imageUrl: TRADE_IMG.gate,
    bgFrom: "#061019",
    bgTo: "#123250",
    bgAngle: 135,
    accentColor: "#f5a623",
    textColor: "#ffffff",
    mutedColor: "#c2d2e6",
    cardColor: "#0e1f34",
    animationPreset: "launch",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 120,
    kenBurns: "zoom-in",
    overlayOpacity: 30,
    layoutVariant: "A",
  },
  {
    id: "trade-2",
    name: "02 · Gates, Entry & Barriers — Service",
    template: "service-offer",
    eyebrow: "SUPPLY · INSTALL · SERVICE",
    headline: "WE AUTOMATE THE WHOLE ENTRANCE.",
    subheadline: "One team for gates, doors, barriers and entry — designed and installed by our own engineers.",
    description: "Independent, insured and qualified. Any make of gate, new build or retrofit.",
    items: [
      { name: "Sliding gate automation", desc: "Up to 1,800 kg · rack or underground motor" },
      { name: "Swing gates & bollards", desc: "Twin-leaf kits, 230V or 24V, safety edges" },
      { name: "Video intercom & keypads", desc: "Wired or app-based, up to 4 handsets" },
      { name: "Servicing & repairs", desc: "Any make · 12-month service plans" },
    ],
    promoPrice: "£1,450",
    ctaText: "FREE SURVEY · {phone}",
    tickerText: "CITY & GUILDS QUALIFIED ENGINEERS — £5M PUBLIC LIABILITY —",
    imageUrl: TRADE_IMG.install,
    bgFrom: "#06140d",
    bgTo: "#123a26",
    bgAngle: 140,
    accentColor: "#4ade80",
    textColor: "#ffffff",
    mutedColor: "#bfe3cc",
    cardColor: "#0b2417",
    animationPreset: "smooth",
    durationSec: 12,
    transition: "fade",
    staggerMs: 130,
    kenBurns: "pan-left",
    overlayOpacity: 20,
    layoutVariant: "A",
  },
  {
    id: "trade-3",
    name: "03 · Upfront Trade Prices — Rate Card",
    template: "price-list",
    eyebrow: "OCTOBER RATES · NO HIDDEN EXTRAS",
    headline: "UPFRONT PRICES.",
    subheadline: "Every price includes parts, labour and VAT. Agreed before we start — nothing added to the invoice.",
    items: [
      { name: "Consumer unit upgrade", desc: "10-way RCBO board, certified", price: "£495" },
      { name: "EV charger installed", desc: "7.4 kW, up to 6 m cable run", price: "£695", tag: "OZEV" },
      { name: "Gate motor service", desc: "Any make, per leaf", price: "£120" },
      { name: "Video intercom", desc: "2-button, app enabled", price: "£480" },
      { name: "Extra double socket", desc: "Surface or flush, per point", price: "£95" },
      { name: "Smart lighting circuit", desc: "Dimmable, per room", price: "£240" },
      { name: "Fault find & repair", desc: "First hour, parts extra", price: "£85" },
      { name: "Safety beam pair", desc: "Supply and fit, per gate", price: "£165" },
    ],
    ctaText: "QUOTES IN 24 HOURS · {phone}",
    description: "FIXED PRICE · CERTIFIED WORK",
    bgFrom: "#0e1218",
    bgTo: "#1f2937",
    bgAngle: 120,
    accentColor: "#facc15",
    textColor: "#ffffff",
    mutedColor: "#cbd5e1",
    cardColor: "#111827",
    animationPreset: "snap",
    durationSec: 13,
    transition: "fade",
    staggerMs: 70,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
  {
    id: "trade-4",
    name: "04 · Brands & Ecosystems — Wall",
    template: "brand-wall",
    eyebrow: "ONE INSTALLER · ONE APP",
    headline: "WORKS WITH WHAT YOU ALREADY OWN.",
    subheadline: "We install and programme the systems you've heard of — and keep them talking to each other.",
    items: [
      { name: "Control4", desc: "Whole-home control" },
      { name: "Lutron", desc: "Lighting & blinds" },
      { name: "Somfy", desc: "Gate & blind motors" },
      { name: "Nice", desc: "Gate automation" },
      { name: "FAAC", desc: "Barriers & access" },
      { name: "Shelly", desc: "Smart relays" },
      { name: "Philips Hue", desc: "Lighting scenes" },
      { name: "Ring", desc: "Video doorbells" },
    ],
    ctaText: "SMART HOME DEMO WALL · ASK AT THE COUNTER",
    bgFrom: "#0a0f1e",
    bgTo: "#241b4b",
    bgAngle: 135,
    accentColor: "#a78bfa",
    textColor: "#ffffff",
    mutedColor: "#c8c2e8",
    cardColor: "#141031",
    animationPreset: "elegant",
    durationSec: 12,
    transition: "fade",
    staggerMs: 110,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
  {
    id: "trade-5",
    name: "05 · Smart Panel — Spec Sheet",
    template: "product-spec",
    eyebrow: "SMART HOME · SHOWROOM DEMO",
    headline: "ONE PANEL. WHOLE HOUSE.",
    productName: 'Apex Halo 10" Control Panel',
    description:
      "Lighting, heating, blinds, gates and cameras from one wall panel. Works with Control4, Shelly and Hue out of the box.",
    originalPrice: "£899",
    promoPrice: "£749",
    discountBadge: "SHOWROOM OFFER",
    ctaText: "TRY IT ON THE DEMO WALL",
    items: [
      { name: "Display", desc: '10.1" IPS touch · 1280×800' },
      { name: "Fits", desc: "Standard 2-gang back box" },
      { name: "Power", desc: "PoE+ or 12V DC" },
      { name: "Connections", desc: "Wi-Fi · Zigbee · RS-485" },
      { name: "Integrations", desc: "Control4 · Shelly · Hue · Ring" },
      { name: "Warranty", desc: "3 years, on-site swap" },
    ],
    imageUrl: TRADE_IMG.panel,
    bgFrom: "#061218",
    bgTo: "#0d3b46",
    bgAngle: 150,
    accentColor: "#22d3ee",
    textColor: "#ffffff",
    mutedColor: "#b6dbe2",
    cardColor: "#082a33",
    animationPreset: "cinematic",
    durationSec: 12,
    transition: "zoom",
    staggerMs: 140,
    kenBurns: "zoom-out",
    overlayOpacity: 45,
    layoutVariant: "A",
  },
  {
    id: "trade-6",
    name: "06 · 24/7 Emergency Call-Out",
    template: "callout-emergency",
    eyebrow: "24/7 EMERGENCY CALLOUT",
    headline: "GATE STUCK? POWER OUT?",
    subheadline: "Same-day engineer across the county. No call-out fee within 20 miles.",
    items: [
      { name: "Gates & barriers", desc: "Stuck, off-track, no power" },
      { name: "Fuse boards & RCDs", desc: "Tripping, dead circuits" },
      { name: "EV charger faults", desc: "Not charging, error lights" },
    ],
    ctaText: "{phone}",
    description: "24/7 · 365\nEngineers on call",
    tickerText: "AVERAGE RESPONSE 60 MINUTES — NICEIC APPROVED — PART P REGISTERED —",
    imageUrl: TRADE_IMG.ev,
    bgFrom: "#170a00",
    bgTo: "#3b1400",
    bgAngle: 130,
    accentColor: "#ff7a00",
    textColor: "#ffffff",
    mutedColor: "#f3d3b5",
    cardColor: "#2a1200",
    animationPreset: "launch",
    durationSec: 12,
    transition: "wipe",
    staggerMs: 120,
    kenBurns: "pan-right",
    overlayOpacity: 60,
    layoutVariant: "A",
  },
  {
    id: "trade-7",
    name: "07 · Welcome — Logo & Contact Details",
    template: "splash",
    eyebrow: "WELCOME",
    headline: "Gates · Automation · Electrical",
    subheadline: "Supply, fit and repair — all makes, all sizes",
    ctaText: "FREE SITE SURVEY",
    items: [
      { name: "Call us", desc: "{phone}" },
      { name: "Opening hours", desc: "Mon–Fri 8am–5pm" },
      { name: "Find us", desc: "Add your address in the editor" },
    ],
    bgFrom: "#061019",
    bgTo: "#123250",
    bgAngle: 135,
    accentColor: "#f5a623",
    textColor: "#ffffff",
    mutedColor: "#c2d2e6",
    cardColor: "#0e1f34",
    animationPreset: "smooth",
    durationSec: 10,
    transition: "fade",
    staggerMs: 120,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
];

export function tradeDemoPlaylist() {
  return {
    id: "trade-demo-playlist",
    name: "APEX · Electrical, Smart Home & Gates (Demo)",
    description: "6-scene trade campaign: gate automation, smart home, electrical rates",
    scenes: TRADE_DEMO_SCENES,
  };
}


// ─── Value demo campaign: "Value Store · Seasonal Savings" (fictional) ───
// Big-box value retail look: huge prices, chunky flags, burst stickers,
// bold sans-serif, strong primary colours, lots of white space.
// All prices GBP (£), UK spelling. Fictional store, fictional products.

const VALUE_IMG = {
  cereal: "/retail/cereal.jpg",
  detergent: "/retail/detergent.jpg",
  toothpaste: "/retail/toothpaste.jpg",
  bread: "/retail/bread.jpg",
  milk: "/retail/milk.jpg",
  apples: "/retail/apples.jpg",
  soda: "/retail/soda.jpg",
  chips: "/retail/chips.jpg",
  soap: "/retail/soap.jpg",
  mincePies: "/seasonal/christmas.jpg",
  // seasonal product images — previously empty strings (no image rendered)
  eggs: "/retail/milk.jpg",
  cheese: "/retail/bread.jpg",
  chicken: "/retail/soda.jpg",
  chocolate: "/seasonal/easter-eggs.jpg",
  pumpkin: "/seasonal/halloween-sweets.jpg",
};

export const VALUE_DEMO_SCENES: Scene[] = [
  {
    id: "value-1",
    name: "01 · Family Cereal — Price Drop",
    template: "price-drop",
    theme: "none",
    eyebrow: "VALUE STORE · SEASONAL SAVINGS",
    headline: "BIG BOWLS. BIG SAVINGS.",
    productName: "Crispy O's Family Pack",
    description: "Wholegrain cereal, packed with goodness. Our biggest box, now at our lowest price of the year.",
    originalPrice: "£5.49",
    promoPrice: "£3.49",
    discountBadge: "SAVE £2",
    ctaText: "PRICE DROP · WHILE STOCKS LAST",
    tickerText: "NEW LOWER PRICES ON 1,000+ EVERYDAY ESSENTIALS —",
    imageUrl: VALUE_IMG.cereal,
    bgFrom: "#ffffff",
    bgTo: "#f8fafc",
    bgAngle: 135,
    accentColor: "#ef4444",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "launch",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 120,
    kenBurns: "zoom-in",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
  {
    id: "value-2",
    name: "02 · Six Deals — Deals Grid",
    template: "deals-grid",
    theme: "none",
    eyebrow: "VALUE STORE · THIS WEEK'S DEALS",
    headline: "SIX GREAT DEALS, EVERY DAY",
    subheadline: "Ends Sunday",
    ctaText: "IN STORE NOW",
    tickerText: "NEW DEALS EVERY MONDAY — ENDS SUNDAY —",
    imageUrl: VALUE_IMG.detergent,
    bgFrom: "#ffffff",
    bgTo: "#f1f5f9",
    bgAngle: 135,
    accentColor: "#16a34a",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "snap",
    durationSec: 12,
    transition: "fade",
    staggerMs: 90,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Family Cereal", price: "£3.49", tag: "DROP", image: VALUE_IMG.cereal },
      { name: "Laundry Detergent", price: "£4.99", tag: "SAVE", image: VALUE_IMG.detergent },
      { name: "Toothpaste Twin Pack", price: "£2.99", tag: "2 FOR", image: VALUE_IMG.toothpaste },
      { name: "Fresh Loaf Bread", price: "£1.19", tag: "FRESH", image: VALUE_IMG.bread },
      { name: "Dairy Milk 2L", price: "£1.79", tag: "COOL", image: VALUE_IMG.milk },
      { name: "Crisp Apples 1kg", price: "£2.29", tag: "CRISP", image: VALUE_IMG.apples },
    ],
  },
  {
    id: "value-3",
    name: "03 · 3 for £10 — Multi-Buy",
    template: "multibuy",
    theme: "none",
    eyebrow: "VALUE STORE · MULTI-BUY",
    headline: "3 FOR £10",
    subheadline: "Mix and match any three household essentials",
    productName: "Household Essentials",
    description: "Pick any three from detergents, soaps and cleaning basics — three for ten pounds.",
    ctaText: "MIX & MATCH · IN STORE",
    tickerText: "BUY MORE, SAVE MORE — 3 FOR £10 ACROSS HOUSEHOLD RANGE —",
    imageUrl: VALUE_IMG.soap,
    bgFrom: "#ffffff",
    bgTo: "#f8fafc",
    bgAngle: 135,
    accentColor: "#2563eb",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "launch",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 100,
    kenBurns: "zoom-in",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Laundry Detergent", price: "£4.99", image: VALUE_IMG.detergent },
      { name: "Hand Soap Bar", price: "£1.99", image: VALUE_IMG.soap },
      { name: "All-Purpose Cleaner", price: "£2.49", image: VALUE_IMG.chicken },
    ],
  },
  {
    id: "value-4",
    name: "04 · Clearance — Last Chance",
    template: "clearance",
    theme: "none",
    eyebrow: "VALUE STORE · CLEARANCE",
    headline: "LAST CHANCE",
    subheadline: "Clearance prices, while stocks last",
    ctaText: "IN STORE NOW · NO RAINCHECKS",
    tickerText: "CLEARANCE — ONCE IT'S GONE, IT'S GONE —",
    imageUrl: VALUE_IMG.chips,
    bgFrom: "#fef2f2",
    bgTo: "#fecaca",
    bgAngle: 135,
    accentColor: "#dc2626",
    textColor: "#7f1d1d",
    mutedColor: "#991b1b",
    cardColor: "#ffffff",
    animationPreset: "snap",
    durationSec: 11,
    transition: "slide-right",
    staggerMs: 110,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Potato Chips", tag: "-50%", desc: "While stocks last" },
      { name: "Fizzy Drinks 2L", tag: "-33%", desc: "While stocks last" },
      { name: "Bar Soap 4-Pack", tag: "-40%", desc: "Last few boxes" },
      { name: "Eggs 12-Pack", tag: "-25%", desc: "While stocks last" },
    ],
  },
  {
    id: "value-5",
    name: "05 · Aisle 7 — Tinned Goods",
    template: "aisle-guide",
    theme: "none",
    eyebrow: "VALUE STORE · FIND YOUR WAY",
    headline: "Tinned Goods",
    subheadline: "Tinned goods · soups · beans · vegetables",
    productName: "7",
    ctaText: "FOLLOW THE SIGNS",
    imageUrl: VALUE_IMG.chicken,
    bgFrom: "#ffffff",
    bgTo: "#f1f5f9",
    bgAngle: 135,
    accentColor: "#16a34a",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "smooth",
    durationSec: 10,
    transition: "fade",
    staggerMs: 100,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "left",
    items: [
      { name: "Tinned soups", image: VALUE_IMG.chicken },
      { name: "Baked beans", image: VALUE_IMG.chicken },
      { name: "Tinned vegetables", image: VALUE_IMG.chicken },
    ],
  },
  {
    id: "value-6",
    name: "06 · Top 5 — Best Sellers",
    template: "top-sellers",
    theme: "none",
    eyebrow: "VALUE STORE · CUSTOMER FAVOURITES",
    headline: "TOP 5 BEST SELLERS",
    subheadline: "Our most-loved products, this week",
    ctaText: "SEE THE FULL LIST IN STORE",
    tickerText: "TOP SELLERS UPDATED EVERY MONDAY —",
    imageUrl: VALUE_IMG.apples,
    bgFrom: "#ffffff",
    bgTo: "#f8fafc",
    bgAngle: 135,
    accentColor: "#f59e0b",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "launch",
    durationSec: 12,
    transition: "slide-left",
    staggerMs: 130,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Family Cereal", price: "£3.49", tag: "#1", image: VALUE_IMG.cereal },
      { name: "Dairy Milk 2L", price: "£1.79", tag: "#2", image: VALUE_IMG.milk },
      { name: "Fresh Loaf Bread", price: "£1.19", tag: "#3", image: VALUE_IMG.bread },
      { name: "Laundry Detergent", price: "£4.99", tag: "#4", image: VALUE_IMG.detergent },
      { name: "Crisp Apples 1kg", price: "£2.29", tag: "#5", image: VALUE_IMG.apples },
    ],
  },
  {
    id: "value-7",
    name: "07 · Store Services",
    template: "store-services",
    theme: "none",
    eyebrow: "VALUE STORE · HERE TO HELP",
    headline: "STORE SERVICES",
    subheadline: "Everything you need, in one place",
    ctaText: "ASK AT CUSTOMER SERVICES",
    tickerText: "OPEN 7 DAYS · CUSTOMER SERVICES DESK NEAR THE ENTRANCE —",
    imageUrl: VALUE_IMG.bread,
    bgFrom: "#ffffff",
    bgTo: "#f1f5f9",
    bgAngle: 135,
    accentColor: "#16a34a",
    textColor: "#0f172a",
    mutedColor: "#64748b",
    cardColor: "#ffffff",
    animationPreset: "smooth",
    durationSec: 11,
    transition: "fade",
    staggerMs: 100,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Click & Collect", desc: "Order online, pick up in store" },
      { name: "Returns", desc: "No quibbles, with receipt" },
      { name: "Opening Hours", desc: "Mon–Sat 7am–10pm · Sun 8am–8pm" },
      { name: "Customer Services", desc: "Desk near the main entrance" },
    ],
  },
  // Seasonal-themed slides (at least 4 different themes)
  {
    id: "value-8",
    name: "08 · Festive Treats — Christmas",
    template: "price-drop",
    theme: "christmas",
    eyebrow: "VALUE STORE · FESTIVE SAVINGS",
    headline: "FESTIVE TREATS",
    productName: "Mince Pies 6-Pack",
    description: "Buttery pastry, spiced fruit filling. Perfect with a cuppa.",
    originalPrice: "£2.49",
    promoPrice: "£1.49",
    discountBadge: "-40%",
    ctaText: "PRICE DROP · FESTIVE SEASON",
    imageUrl: VALUE_IMG.mincePies,
    bgImageUrl: "/seasonal/christmas-bg.jpg",
    bgFrom: "#1e1b4b",
    bgTo: "#7f1d1d",
    bgAngle: 135,
    accentColor: "#dc2626",
    textColor: "#ffffff",
    mutedColor: "#fbcfe8",
    cardColor: "#ffffff",
    animationPreset: "launch",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 120,
    kenBurns: "zoom-in",
    overlayOpacity: 35,
    layoutVariant: "A",
  },
  {
    id: "value-9",
    name: "09 · Easter Eggs — Half Price",
    template: "deals-grid",
    theme: "easter",
    eyebrow: "VALUE STORE · EASTER TREATS",
    headline: "EASTER EGGS HALF PRICE",
    subheadline: "Ends Sunday",
    ctaText: "IN STORE NOW",
    imageUrl: VALUE_IMG.chocolate,
    bgImageUrl: "/seasonal/easter-bg.jpg",
    bgFrom: "#0f3d3d",
    bgTo: "#fce7f3",
    bgAngle: 135,
    accentColor: "#ec4899",
    textColor: "#ffffff",
    mutedColor: "#be185d",
    cardColor: "#ffffff",
    animationPreset: "snap",
    durationSec: 12,
    transition: "fade",
    staggerMs: 90,
    kenBurns: "static",
    overlayOpacity: 35,
    layoutVariant: "A",
    items: [
      { name: "Milk Chocolate Egg", price: "£2.99", tag: "HALF" },
      { name: "Dark Chocolate Egg", price: "£2.99", tag: "HALF" },
      { name: "Mini Eggs Bag", price: "£1.99", tag: "SAVE" },
      { name: "White Chocolate Egg", price: "£2.99", tag: "HALF" },
      { name: "Easter Basket", price: "£6.99", tag: "NEW" },
      { name: "Chocolate Bunnies", price: "£3.49", tag: "HALF" },
    ],
  },
  {
    id: "value-10",
    name: "10 · Pumpkin Spice — Halloween",
    template: "multibuy",
    theme: "halloween",
    eyebrow: "VALUE STORE · SPOOKY SAVINGS",
    headline: "BUY 2 GET 1 FREE",
    subheadline: "Halloween treats & sweets",
    productName: "Spooky Sweets",
    description: "Pick any three bags of Halloween sweets — cheapest bag free.",
    ctaText: "TRICK OR TREAT · IN STORE",
    imageUrl: VALUE_IMG.pumpkin,
    bgImageUrl: "/seasonal/halloween-bg.jpg",
    bgFrom: "#2d103d",
    bgTo: "#f97316",
    bgAngle: 135,
    accentColor: "#f97316",
    textColor: "#ffffff",
    mutedColor: "#fdba74",
    cardColor: "#ffffff",
    animationPreset: "snap",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 100,
    kenBurns: "static",
    overlayOpacity: 35,
    layoutVariant: "A",
    items: [
      { name: "Gummy Worms", price: "£1.49" },
      { name: "Chocolate Pumpkins", price: "£1.99" },
      { name: "Toffee Apples", price: "£2.49" },
    ],
  },
  {
    id: "value-11",
    name: "11 · Spring Fresh — Spring",
    template: "clearance",
    theme: "spring",
    eyebrow: "VALUE STORE · SPRING FRESH",
    headline: "SPRING CLEANING ESSENTIALS",
    subheadline: "Fresh starts, lower prices",
    ctaText: "IN STORE NOW",
    imageUrl: VALUE_IMG.soap,
    bgImageUrl: "/seasonal/spring-bg.jpg",
    bgFrom: "#14532d",
    bgTo: "#dcfce7",
    bgAngle: 135,
    accentColor: "#16a34a",
    textColor: "#ffffff",
    mutedColor: "#bbf7d0",
    cardColor: "#ffffff",
    animationPreset: "smooth",
    durationSec: 11,
    transition: "slide-right",
    staggerMs: 110,
    kenBurns: "static",
    overlayOpacity: 35,
    layoutVariant: "A",
    items: [
      { name: "All-Purpose Cleaner", tag: "-30%", desc: "Spring fresh scent" },
      { name: "Washing-up Liquid", tag: "-25%", desc: "Lemon zest" },
      { name: "Floor Cleaner", tag: "-20%", desc: "Spring bloom" },
      { name: "Multi-Surface Wipes", tag: "-33%", desc: "Lavender" },
    ],
  },
  {
    id: "value-12",
    name: "12 · Beach Gear — Summer",
    template: "top-sellers",
    theme: "summer",
    eyebrow: "VALUE STORE · SUMMER READY",
    headline: "TOP 5 SUMMER ESSENTIALS",
    subheadline: "Everything for sunny days",
    ctaText: "SEE THE FULL RANGE IN STORE",
    bgImageUrl: "/seasonal/summer-bg.jpg",
    bgFrom: "#0c4a6e",
    bgTo: "#dbeafe",
    bgAngle: 135,
    accentColor: "#0ea5e9",
    textColor: "#ffffff",
    mutedColor: "#bfdbfe",
    cardColor: "#ffffff",
    animationPreset: "launch",
    durationSec: 12,
    transition: "slide-left",
    staggerMs: 130,
    kenBurns: "static",
    overlayOpacity: 35,
    layoutVariant: "A",
    items: [
      { name: "Sunscreen SPF 50", price: "£4.99", tag: "#1" },
      { name: "Beach Towel", price: "£6.99", tag: "#2" },
      { name: "Flip-Flops", price: "£3.49", tag: "#3" },
      { name: "Sun Hat", price: "£5.99", tag: "#4" },
      { name: "Cooler Bag", price: "£9.99", tag: "#5" },
    ],
  },
];

export function valueDemoPlaylist() {
  return {
    id: "value-demo-playlist",
    name: "Value Store · Seasonal Savings (Demo)",
    description: "12-scene value retail campaign covering all 7 templates with seasonal themes",
    scenes: VALUE_DEMO_SCENES,
  };
}

// ─── Corporate demo campaign: "Easygates · Head Office & Reception" ───
// Sample pages for the corporate / social-proof templates, aimed at
// reception and lobby screens. Uses bundled public/ images only so the
// display works fully offline (no external image hosts).
const CORPORATE_IMG = {
  logo: "/trade/easygates-logo.svg",
  gateInstall: "/trade/gate-install.jpg",
  smartPanel: "/trade/smart-panel.jpg",
  evCharger: "/trade/ev-charger.jpg",
  ambientAurora: "/ambient/ambient-aurora.jpg",
};

export const CORPORATE_DEMO_SCENES: Scene[] = [
  {
    id: "corp-1",
    name: "01 · What We Stand For — Company Values",
    template: "company-values",
    eyebrow: "EASYGATES · HEAD OFFICE",
    headline: "WHAT WE STAND FOR",
    subheadline: "The principles behind every gate, barrier and job we deliver.",
    imageUrl: CORPORATE_IMG.smartPanel,
    bgFrom: "#061019",
    bgTo: "#123250",
    bgAngle: 135,
    accentColor: "#f5a623",
    textColor: "#ffffff",
    mutedColor: "#c2d2e6",
    cardColor: "#0e1f34",
    animationPreset: "elegant",
    durationSec: 12,
    transition: "fade",
    staggerMs: 140,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Safety first", desc: "Every site, every job — no shortcuts." },
      { name: "Right first time", desc: "Specified, tested and signed off properly." },
      { name: "Keep it simple", desc: "Straight answers, clear quotes, no jargon." },
      { name: "Proud people", desc: "Look after the team and the work speaks for itself." },
    ],
  },
  {
    id: "corp-2",
    name: "02 · Meet the Team",
    template: "team-intro",
    eyebrow: "EASYGATES · THE PEOPLE",
    headline: "MEET THE TEAM",
    subheadline: "The engineers, planners and people who keep Britain moving.",
    ctaText: "WE'RE HIRING — ASK US AT RECEPTION",
    bgFrom: "#07131c",
    bgTo: "#0f2f4a",
    bgAngle: 140,
    accentColor: "#38bdf8",
    textColor: "#ffffff",
    mutedColor: "#bcd3e8",
    cardColor: "#0d1e2e",
    animationPreset: "elegant",
    durationSec: 12,
    transition: "fade",
    staggerMs: 120,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Alex M.", desc: "Head of Installation" },
      { name: "Jordan T.", desc: "Site Surveyor" },
      { name: "Sam K.", desc: "Electrician, First-Class" },
      { name: "Ria P.", desc: "Accounts & Planning" },
      { name: "Lee B.", desc: "Workshop Lead" },
      { name: "Dan O.", desc: "Aftercare & Call-outs" },
    ],
  },
  {
    id: "corp-3",
    name: "03 · 25 Years — Milestone",
    template: "corporate-milestone",
    eyebrow: "A MILESTONE",
    headline: "25",
    subheadline: "YEARS KEEPING BRITAIN MOVING",
    description: "From a two-van fitting business in 2001 to one of the UK's leading gate and barrier specialists — 25 years of gates, barriers and smart access.",
    imageUrl: CORPORATE_IMG.gateInstall,
    ctaText: "HERE'S TO THE NEXT 25",
    bgFrom: "#120b03",
    bgTo: "#3d2a08",
    bgAngle: 135,
    accentColor: "#f5a623",
    textColor: "#ffffff",
    mutedColor: "#e6d3ae",
    cardColor: "#241a08",
    animationPreset: "cinematic",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 170,
    kenBurns: "zoom-in",
    overlayOpacity: 20,
    layoutVariant: "A",
  },
  {
    id: "corp-4",
    name: "04 · New Smart Panel Line — Company News",
    template: "corporate-news",
    eyebrow: "COMPANY NEWS",
    headline: "SMART PANEL LINE LAUNCHES THIS WINTER",
    description: "Our new range of smart gate panels brings app control, visitor codes and remote release to residential and light commercial sites — fitted by our own teams.",
    imageUrl: CORPORATE_IMG.evCharger,
    ctaText: "BOOK A SITE SURVEY",
    tickerText: "AVAILABLE FROM DECEMBER — BOOK A SITE SURVEY TODAY",
    bgFrom: "#04121a",
    bgTo: "#0a3247",
    bgAngle: 145,
    accentColor: "#22e0c8",
    textColor: "#ffffff",
    mutedColor: "#b3d6dd",
    cardColor: "#07222e",
    animationPreset: "smooth",
    durationSec: 11,
    transition: "slide-left",
    staggerMs: 130,
    kenBurns: "pan-left",
    overlayOpacity: 25,
    layoutVariant: "A",
  },
  {
    id: "corp-5",
    name: "05 · Customer Quote — Testimonial",
    template: "testimonial-quote",
    eyebrow: "CUSTOMER STORY",
    headline: "Fitted in a day. Zero fuss. Brilliant team.",
    description: "“They turned up on time, kept the site clean and the gate works perfectly. We've already recommended them to two neighbours.”",
    productName: "M. Carter",
    ctaText: "Homeowner · Manchester",
    bgFrom: "#0a0a14",
    bgTo: "#232345",
    bgAngle: 130,
    accentColor: "#e879f9",
    textColor: "#ffffff",
    mutedColor: "#d6c3ea",
    cardColor: "#171730",
    animationPreset: "elegant",
    durationSec: 11,
    transition: "fade",
    staggerMs: 150,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "J. O'Neill", desc: "“Clear quote, tidy install, great aftercare.”" },
      { name: "S. Patel", desc: "“The smart panel app is easier than our phone keys.”" },
    ],
  },
  {
    id: "corp-6",
    name: "06 · Ambient — Fullscreen Background",
    template: "fullscreen-bg",
    // media only — the slide draws the background image and nothing else
    headline: "",
    subheadline: "",
    bgImageUrl: CORPORATE_IMG.ambientAurora,
    bgFrom: "#05070f",
    bgTo: "#0b1226",
    bgAngle: 135,
    accentColor: "#818cf8",
    textColor: "#ffffff",
    mutedColor: "#c0c4e8",
    cardColor: "#101430",
    animationPreset: "cinematic",
    durationSec: 14,
    transition: "fade",
    staggerMs: 160,
    kenBurns: "zoom-in",
    overlayOpacity: 0,
    layoutVariant: "A",
  },
  {
    id: "corp-7",
    name: "07 · Trustpilot Review",
    template: "trustpilot-review",
    eyebrow: "RATED EXCELLENT ON TRUSTPILOT",
    headline: "4.8",
    subheadline: "Excellent · based on 1,284 reviews",
    description: "Independent, verified reviews from customers across the UK.",
    imageUrl: CORPORATE_IMG.logo,
    ctaText: "READ OUR REVIEWS ON TRUSTPILOT",
    bgFrom: "#041207",
    bgTo: "#0a2e16",
    bgAngle: 135,
    accentColor: "#45d46b",
    textColor: "#ffffff",
    mutedColor: "#bcdcc4",
    cardColor: "#0a2012",
    animationPreset: "elegant",
    durationSec: 13,
    transition: "fade",
    staggerMs: 130,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Karen H.", desc: "Gate fitted in a day — tidy, professional and on budget.", tag: "★★★★★" },
      { name: "Tomasz W.", desc: "Remote release and visitor codes changed how we run the site.", tag: "★★★★★" },
      { name: "Priya S.", desc: "Great aftercare — they came back to tweak the sensor for free.", tag: "★★★★☆" },
    ],
  },
];


// ─── Trade-counter demo campaign: "RAPIDFIX · Trade Counter" ───
// Sample pages for the five Screwfix-style retail templates. Every photo ships
// in public/counter/, so these slides also work in the offline failsafe pack.
const COUNTER_IMG = {
  drill: "/counter/drill-kit.jpg",
  screws: "/counter/screws.jpg",
  sockets: "/counter/socket-set.jpg",
  gloves: "/counter/work-gloves.jpg",
  torch: "/counter/site-torch.jpg",
  bag: "/counter/tool-bag.jpg",
};

export const COUNTER_DEMO_SCENES: Scene[] = [
  {
    id: "counter-1",
    name: "01 · Bulk Buy — Combi Drill Kit",
    template: "bulk-buy",
    theme: "none",
    eyebrow: "RAPIDFIX · TRADE COUNTER",
    headline: "BUY MORE. PAY LESS.",
    subheadline: "Quantity breaks on the kit every site asks for",
    productName: "18V Brushless Combi Drill Kit",
    description: "Two 4.0Ah batteries, a fast charger and a hard case — the everyday drill for fitters and sparks.",
    originalPrice: "£149.99",
    promoPrice: "£99.99",
    discountBadge: "SAVE £50",
    ctaText: "TRADE PRICES · IN STORE NOW",
    tickerText: "BULK BUYS — BUY MORE, PAY LESS — TRADE PRICES IN STORE —",
    imageUrl: COUNTER_IMG.drill,
    bgFrom: "#0b0f14",
    bgTo: "#1f2a37",
    bgAngle: 135,
    accentColor: "#e11d2e",
    textColor: "#ffffff",
    mutedColor: "#9aa7b8",
    cardColor: "#111827",
    highlightColor: "#ffce00",
    animationPreset: "snap",
    durationSec: 12,
    transition: "slide-left",
    staggerMs: 100,
    kenBurns: "zoom-in",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "1–4", price: "£119.99", desc: "each", tag: "SAVE £30" },
      { name: "5–9", price: "£109.99", desc: "each", tag: "SAVE £40" },
      { name: "10+", price: "£99.99", desc: "each", tag: "SAVE £50" },
    ],
  },
  {
    id: "counter-2",
    name: "02 · Shelf Edge — Six Trade Deals",
    template: "shelf-edge",
    theme: "none",
    eyebrow: "RAPIDFIX · WEEKLY DEALS",
    headline: "PRICES CUT ACROSS THE TRADE COUNTER",
    subheadline: "Six shelf-edge deals — while stocks last",
    ctaText: "OFFERS END SUNDAY",
    tickerText: "SHELF-EDGE DEALS — NEW OFFERS EVERY MONDAY —",
    bgFrom: "#10151c",
    bgTo: "#232f3d",
    bgAngle: 135,
    accentColor: "#e11d2e",
    textColor: "#ffffff",
    mutedColor: "#9aa7b8",
    cardColor: "#f6f4ef",
    highlightColor: "#ffce00",
    animationPreset: "snap",
    durationSec: 13,
    transition: "fade",
    staggerMs: 80,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Assorted Wood Screws 1,000pk", price: "£8.99", desc: "Cat No. 3318 · was £12.99", tag: "PACK OF 1000", image: COUNTER_IMG.screws },
      { name: "18V Combi Drill Kit", price: "£99.99", desc: "Cat No. 6841 · was £149.99", tag: "SAVE £50", image: COUNTER_IMG.drill },
      { name: "Socket & Bit Set 90pc", price: "£24.99", desc: "Cat No. 5527 · was £34.99", tag: "SAVE 28%", image: COUNTER_IMG.sockets },
      { name: "Site Work Gloves 3pk", price: "£6.49", desc: "Cat No. 1180 · was £9.99", tag: "PACK OF 3", image: COUNTER_IMG.gloves },
      { name: "LED Site Torch 1200lm", price: "£14.99", desc: "Cat No. 9024 · was £19.99", tag: "-25%", image: COUNTER_IMG.torch },
      { name: "Heavy-Duty Tool Bag 18in", price: "£22.99", desc: "Cat No. 4407 · was £29.99", tag: "SAVE £7", image: COUNTER_IMG.bag },
    ],
  },
  {
    id: "counter-3",
    name: "03 · Flash Sale — 48 Hours",
    template: "flash-sale",
    theme: "none",
    eyebrow: "RAPIDFIX · FLASH SALE",
    headline: "48-HOUR FLASH SALE",
    subheadline: "20% off power tools, fixings and workwear",
    description: "Show your trade card at the counter — the discount is applied at checkout.",
    promoPrice: "20%",
    discountBadge: "OFF",
    ctaText: "ENDS SUNDAY · IN STORE",
    tickerText: "FLASH SALE — 48 HOURS ONLY — 20% OFF SELECTED LINES —",
    bgFrom: "#160b0b",
    bgTo: "#2b1512",
    bgAngle: 135,
    accentColor: "#e11d2e",
    textColor: "#ffffff",
    mutedColor: "#b9a3a3",
    cardColor: "#111827",
    highlightColor: "#ffce00",
    animationPreset: "launch",
    durationSec: 11,
    transition: "zoom",
    staggerMs: 110,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Power tools", desc: "Drills, saws and grinders", tag: "-20%" },
      { name: "Fixings", desc: "Screws, anchors and plugs", tag: "-20%" },
      { name: "Workwear", desc: "Boots, gloves and hi-vis", tag: "-20%" },
    ],
  },
  {
    id: "counter-4",
    name: "04 · Click & Collect in 1 Minute",
    template: "click-collect",
    theme: "none",
    eyebrow: "RAPIDFIX · CLICK & COLLECT",
    headline: "CLICK & COLLECT IN 1 MINUTE",
    subheadline: "Order before 6pm and pick it up on the way home.",
    productName: "1 MINUTE",
    description: "Thousands of trade essentials in stock at your local counter — no waiting and no delivery charge.",
    ctaText: "ORDER ONLINE · COLLECT IN STORE",
    tickerText: "CLICK & COLLECT — ORDER BY 6PM — COLLECT IN 1 MINUTE —",
    imageUrl: COUNTER_IMG.bag,
    bgFrom: "#081019",
    bgTo: "#16232f",
    bgAngle: 135,
    accentColor: "#e11d2e",
    textColor: "#ffffff",
    mutedColor: "#9aa7b8",
    cardColor: "#111827",
    highlightColor: "#ffce00",
    animationPreset: "smooth",
    durationSec: 12,
    transition: "fade",
    staggerMs: 100,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Order online", desc: "Browse the range and pay as normal", tag: "6PM CUT-OFF" },
      { name: "We pick it", desc: "The counter team picks and checks your order", tag: "SAME DAY" },
      { name: "Collect in store", desc: "Show your order number at the trade counter", tag: "1 MINUTE" },
    ],
  },
  {
    id: "counter-5",
    name: "05 · Trade Account — Apply Today",
    template: "trade-account",
    theme: "none",
    eyebrow: "RAPIDFIX · TRADE ACCOUNT",
    headline: "TRADE PRICES. NO HASSLE.",
    subheadline: "Open an account and buy at trade prices every day.",
    description: "Apply at the counter or online — it takes about two minutes. Credit accounts subject to status.",
    discountBadge: "NO MINIMUM SPEND",
    ctaText: "APPLY AT THE TRADE COUNTER",
    tickerText: "TRADE ACCOUNT — LOWER PRICES — ONE MONTHLY INVOICE —",
    bgFrom: "#0a0f16",
    bgTo: "#1c2733",
    bgAngle: 135,
    accentColor: "#e11d2e",
    textColor: "#ffffff",
    mutedColor: "#9aa7b8",
    cardColor: "#111827",
    highlightColor: "#ffce00",
    animationPreset: "elegant",
    durationSec: 12,
    transition: "slide-right",
    staggerMs: 120,
    kenBurns: "static",
    overlayOpacity: 0,
    layoutVariant: "A",
    items: [
      { name: "Trade pricing", desc: "Lower prices on the whole range, every day", tag: "CORE" },
      { name: "Bulk breaks", desc: "Buy more, pay less on packs and pallets", tag: "BULK" },
      { name: "One invoice", desc: "Monthly account, one simple statement", tag: "30 DAYS" },
      { name: "Click & Collect", desc: "Order by 6pm and collect the next morning", tag: "1 MIN" },
    ],
  },
];

/**
 * Every built-in demo slide, in pack order (retail, trade, value, corporate, counter).
 * Used by the landing page so “built-in demo scenes” is a count of what is
 * actually shipped rather than a number in the copy that goes stale.
 */
export const ALL_DEMO_SCENES: Scene[] = [
  ...DEMO_SCENES,
  ...TRADE_DEMO_SCENES,
  ...VALUE_DEMO_SCENES,
  ...CORPORATE_DEMO_SCENES,
  ...COUNTER_DEMO_SCENES,
];

/**
 * The offline failsafe pack: the built-in scenes whose media ships in `public/`.
 *
 * Everything here plays with no internet, no database and no cached playlist. It
 * is the whole qualifying library rather than one campaign — a screen that falls
 * back for a week should not repeat the same eight slides forever.
 *
 * The eight retail demo scenes are excluded on purpose: their photography is
 * hosted, so during an outage they would render a headline over a broken image.
 * Media-free templates (brand wall, splash, fullscreen background) are included.
 */
export const FAILSAFE_SCENES: Scene[] = ALL_DEMO_SCENES.filter(
  (s) => !s.imageUrl || s.imageUrl.startsWith("/") || s.imageUrl.startsWith("data:")
);
