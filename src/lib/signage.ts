// ─── Signage core: types, template catalogue, animation engine, demo campaign ──

export type TemplateId =
  | "retail-promo"
  | "food-menu"
  | "product-showcase"
  | "product-grid"
  | "announcement"
  | "fullscreen-campaign"
  | "split-promo";

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
  bgFrom: string;
  bgTo: string;
  bgAngle: number;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
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
];

export const ANIMATION_PRESETS: Record<
  AnimationPresetId,
  { name: string; blurb: string; baseMs: number; staggerMs: number; easing: string }
> = {
  launch: { name: "Launch Pop", blurb: "Bold scale + rise. High-energy retail.", baseMs: 700, staggerMs: 120, easing: "cubic-bezier(0.16,1,0.3,1)" },
  smooth: { name: "Smooth Rise", blurb: "Soft fade-up cascade. Safe default.", baseMs: 800, staggerMs: 140, easing: "cubic-bezier(0.22,1,0.36,1)" },
  cinematic: { name: "Cinematic", blurb: "Slow zoom, masked reveals. Flagship.", baseMs: 1100, staggerMs: 180, easing: "cubic-bezier(0.25,1,0.4,1)" },
  snap: { name: "Retail Snap", blurb: "Fast, punchy. For price grids.", baseMs: 500, staggerMs: 80, easing: "cubic-bezier(0.34,1.3,0.64,1)" },
  elegant: { name: "Elegant Fade", blurb: "Minimal drift. Premium & calm.", baseMs: 1000, staggerMs: 160, easing: "ease-out" },
};

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
  const stagger = scene.staggerMs || preset.staggerMs;
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
    ctaText: "MEAL DEAL · BURGER + FRIES + DRINK £9.95",
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
    description: "8-scene sample campaign covering all 7 templates",
    scenes: DEMO_SCENES,
  };
}

// Steam Link hardware profile (researched, documented in /docs)
export const STEAM_LINK_PROFILE = {
  device: "Valve Steam Link (Model 1003, 2015–2018)",
  soc: "Marvell DE3005-A1 / ARMADA 1500 Mini — single-core ARMv7 Cortex-A9 @ 1.0 GHz + NEON",
  gpu: "Vivante GC1000, OpenGL ES 2.0",
  ram: "~512 MB total (approx. 256 MB available to custom apps)",
  storage: "4 GB NAND flash (~500 MB–1 GB usable for apps)",
  video: "HDMI up to 1080p60, hardware H.264 decode",
  network: "100 Mbit Ethernet, 802.11ac 2×2 MIMO Wi-Fi, BT 4.0",
  os: "Custom Valve Linux (kernel 3.8/3.18 lineage)",
  sdk: "Valve steamlink-sdk — SDL 2.0, Qt 5.4, OpenGL ES 2.0, GCC ARM toolchain",
  browserNote:
    "No modern evergreen browser. Rendering strategy: lightweight kiosk page (Chromium/Firefox on a Pi-class substitute) OR native SDL/OpenGL ES app; CMS stays on a separate powerful machine.",
};
