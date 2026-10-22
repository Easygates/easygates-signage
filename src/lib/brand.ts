// ─── Business branding: one set of details used by every screen ──
// Client-safe (no DB imports): the player, admin previews and API all share it.

import type { Scene, SceneItem } from "./signage";
import { themePalette } from "./themes.ts";

/**
 * Ticker sizes. The bar lives on the 1920×1080 canvas, so the numbers are canvas
 * pixels: "md" is what the ticker has always been. `speed` keeps the text moving
 * at a constant pixels-per-second when the type gets bigger — a 26 px ticker on
 * the same 28 s loop reads much faster than a 16 px one.
 */
export type TickerSize = "sm" | "md" | "lg";

export const TICKER_SIZES: Record<TickerSize, { name: string; blurb: string; fontSize: number; padY: number; tracking: number }> = {
  sm: { name: "Small", blurb: "Quiet — a footnote under the slide", fontSize: 16, padY: 6, tracking: 0.16 },
  md: { name: "Standard", blurb: "The default news-ticker strip", fontSize: 20, padY: 8, tracking: 0.18 },
  lg: { name: "Large", blurb: "Readable across a shop floor", fontSize: 28, padY: 11, tracking: 0.14 },
};

export const TICKER_SIZE_IDS = Object.keys(TICKER_SIZES) as TickerSize[];

export interface BrandSettings {
  businessName: string;
  /** "" = no logo, show the business name instead */
  logoUrl: string;
  /** white badge behind the logo so coloured logos read on any slide */
  logoOnWhite: boolean;
  /** business name beside the logo (wordmark logos usually don't need it) */
  showName: boolean;
  phone: string;
  /** Background image used by slides that don't set one of their own */
  defaultBgImageUrl: string;
  /** IANA time zone used to evaluate schedule windows (default Europe/London) */
  timezone: string;
  accentColor: string;
  backgroundColor: string;
  /** use the brand colours on every slide instead of each slide's own */
  applyColors: boolean;
  tickerText: string;
  /** replace slide tickers; otherwise only fills slides without one */
  tickerOnAll: boolean;
  /** how big the scrolling strip is drawn */
  tickerSize: TickerSize;
  showBrandBar: boolean;
  showClock: boolean;
}

export const DEFAULT_BRAND: BrandSettings = {
  businessName: "Easygates",
  logoUrl: "/trade/easygates-logo.svg",
  logoOnWhite: true,
  showName: false,
  phone: "01234 567 890",
  defaultBgImageUrl: "",
  timezone: "Europe/London",
  accentColor: "#1a7bbf",
  backgroundColor: "#07131f",
  applyColors: false,
  tickerText: "",
  tickerOnAll: false,
  tickerSize: "md",
  showBrandBar: true,
  showClock: true,
};

const HEX = /^#[0-9a-f]{6}$/i;

/** Accept anything (DB row, request body) and return complete, valid settings. */
export function normalizeBrand(input: unknown): BrandSettings {
  const v = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const str = (k: keyof BrandSettings, max: number) =>
    typeof v[k] === "string" ? (v[k] as string).trim().slice(0, max) : (DEFAULT_BRAND[k] as string);
  const bool = (k: keyof BrandSettings) =>
    typeof v[k] === "boolean" ? (v[k] as boolean) : (DEFAULT_BRAND[k] as boolean);
  const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  const hex = (k: keyof BrandSettings) =>
    typeof v[k] === "string" && HEX.test(v[k] as string) ? (v[k] as string).toLowerCase() : (DEFAULT_BRAND[k] as string);
  const tz = (k: keyof BrandSettings) => {
    const zone = typeof v[k] === "string" ? (v[k] as string).trim() : (DEFAULT_BRAND[k] as string);
    try {
      new Intl.DateTimeFormat("en", { timeZone: zone });
      return zone;
    } catch {
      return (DEFAULT_BRAND[k] as string);
    }
  };
  return {
    businessName: str("businessName", 80),
    logoUrl: str("logoUrl", 2000),
    logoOnWhite: bool("logoOnWhite"),
    showName: bool("showName"),
    phone: str("phone", 40),
    defaultBgImageUrl: str("defaultBgImageUrl", 2000),
    timezone: tz("timezone"),
    accentColor: hex("accentColor"),
    backgroundColor: hex("backgroundColor"),
    applyColors: bool("applyColors"),
    tickerText: str("tickerText", 300),
    tickerOnAll: bool("tickerOnAll"),
    tickerSize: oneOf(v.tickerSize, TICKER_SIZE_IDS, DEFAULT_BRAND.tickerSize),
    showBrandBar: bool("showBrandBar"),
    showClock: bool("showClock"),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Multiple businesses
//
// One NovaSign install can run several brands (two shops, a trade counter and a
// showroom, …). Each business is a complete set of screen details — logo, phone,
// colours, ticker — so a slide shown on a Smart & Secure screen looks like Smart
// & Secure even though the same slide plays on an EasyGates screen.
//
// Storage: the `settings` table, key `businesses`, shaped like BusinessCollection.
// The old single-business row (`brand`) stays as the fallback: the first time this
// runs, the saved business details become the first profile rather than being lost.
// ─────────────────────────────────────────────────────────────────────────────

/** One business. Everything a BrandSettings has, plus the admin label and contact extras. */
export interface BusinessProfile extends BrandSettings {
  /** stable id — scenes/displays reference this, never the array position */
  id: string;
  /** the name shown in the admin list (the brand, e.g. "Smart & Secure") */
  profileName: string;
  /** short line under the name in the picker, e.g. "Smart home superstore" */
  tagline: string;
  /** website shown on contact-style slides; optional */
  website: string;
}

export interface BusinessCollection {
  profiles: BusinessProfile[];
  /** which profile new screens and previews use when nothing else is chosen */
  activeId: string;
}

/**
 * Ready-made businesses. Colours are read off the supplied logos:
 * EasyGates Direct is silver + #e62d34 red on deep navy (with the EasyGates blue
 * #1a7bbf and a safety amber as the second and third accents); Smart & Secure is
 * teal #74c0cd, coral #d07374 and cream #ecea91 on charcoal-teal.
 * Every pairing clears WCAG AA for signage (checked by tests/businesses.test.mjs).
 */
export const BUSINESS_PRESETS: Omit<BusinessProfile, "id">[] = [
  {
    profileName: "EasyGates Direct",
    businessName: "EasyGates Direct",
    tagline: "Gate automation · access control · safety",
    website: "https://www.easygatesdirect.co.uk",
    // silver-on-transparent mark — it needs a dark plate, not a white one
    logoUrl: "/brands/easygates-direct-logo.png",
    logoOnWhite: false,
    showName: false,
    phone: "01384 569 942",
    defaultBgImageUrl: "",
    timezone: "Europe/London",
    accentColor: "#ff3b43",
    backgroundColor: "#07131f",
    applyColors: false,
    tickerText: "TRADE COUNTER OPEN 7.30AM–5PM · ORDER BY 3PM FOR NEXT DAY DELIVERY · CALL {phone} ·",
    tickerOnAll: false,
    tickerSize: "md",
    showBrandBar: true,
    showClock: true,
  },
  {
    profileName: "Smart & Secure",
    businessName: "Smart & Secure",
    tagline: "Smart home · security · home cinema",
    website: "https://www.smart-secure.co.uk",
    logoUrl: "/brands/smart-secure-logo.png",
    logoOnWhite: true,
    showName: false,
    phone: "01384 900 262",
    defaultBgImageUrl: "",
    timezone: "Europe/London",
    accentColor: "#74c0cd",
    backgroundColor: "#08161b",
    applyColors: false,
    tickerText: "5,000 SQ FT OF SMART HOME TO TRY · OPEN MON–SAT · CALL {phone} ·",
    tickerOnAll: false,
    tickerSize: "md",
    showBrandBar: true,
    showClock: true,
  },
];

/** Turn a name into a short, stable id: "Smart & Secure" → "smart-secure". */
export function profileSlug(name: string, taken: string[] = []): string {
  const base =
    (name || "business")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "business";
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function withId(profile: Omit<BusinessProfile, "id">, taken: string[]): BusinessProfile {
  return { ...profile, id: profileSlug(profile.profileName, taken) };
}

/** The two shipped businesses. Used when there is nothing saved yet. */
export function defaultBusinesses(): BusinessCollection {
  const profiles = BUSINESS_PRESETS.map((p, i) => withId(p, BUSINESS_PRESETS.slice(0, i).map((q) => profileSlug(q.profileName))));
  return { profiles, activeId: profiles[0].id };
}

function normalizeProfile(input: unknown, taken: string[], fallback: BusinessProfile): BusinessProfile {
  const base = normalizeBrand(input) as BusinessProfile;
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (k: "profileName" | "tagline" | "website", max: number, dflt: string) =>
    typeof v[k] === "string" ? v[k].trim().slice(0, max) : dflt;
  const rawId = typeof v.id === "string" ? v.id.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) : "";
  const profile: BusinessProfile = {
    ...base,
    profileName: str("profileName", 60, fallback.profileName),
    tagline: str("tagline", 120, ""),
    website: str("website", 200, ""),
    id: "",
  };
  profile.id = rawId && !taken.includes(rawId) ? rawId : profileSlug(profile.profileName || fallback.profileName, taken);
  return profile;
}

/**
 * Accept anything stored under `businesses` and return a usable collection:
 * always at least one profile, unique ids, and an activeId that exists.
 * `fallbackBrand` is the legacy single-business row, migrated into profile one
 * the first time this runs so existing installs keep their details.
 */
export function normalizeBusinesses(input: unknown, fallbackBrand?: BrandSettings): BusinessCollection {
  const v = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const raw = Array.isArray(v.profiles) ? v.profiles : null;
  if (!raw || raw.length === 0) {
    const seed: Omit<BusinessProfile, "id"> | undefined = fallbackBrand
      ? { ...fallbackBrand, profileName: fallbackBrand.businessName, tagline: "", website: "" }
      : undefined;
    const profiles = [withId(seed ?? BUSINESS_PRESETS[0], [])];
    return { profiles, activeId: profiles[0].id };
  }
  const taken: string[] = [];
  const profiles: BusinessProfile[] = [];
  for (const [i, item] of raw.entries()) {
    const fallback = BUSINESS_PRESETS[i] ?? BUSINESS_PRESETS[0];
    const p = normalizeProfile(item, taken, { ...fallback, id: "" } as BusinessProfile);
    taken.push(p.id);
    profiles.push(p);
  }
  const activeId = typeof v.activeId === "string" && profiles.some((p) => p.id === v.activeId) ? v.activeId : profiles[0].id;
  return { profiles, activeId };
}

/** The profile screens use when nothing is chosen for them. */
export function activeProfile(c: BusinessCollection): BusinessProfile {
  return c.profiles.find((p) => p.id === c.activeId) ?? c.profiles[0];
}

export function profileById(c: BusinessCollection, id?: string | null): BusinessProfile | undefined {
  if (!id) return undefined;
  return c.profiles.find((p) => p.id === id);
}

/** Profile for an id, falling back to the active one — never undefined. */
export function profileOrDefault(c: BusinessCollection, id?: string | null): BusinessProfile {
  return profileById(c, id) ?? activeProfile(c);
}

const TOKENS = /\{\s*(phone|business)\s*\}/gi;

/** Swap {phone} and {business} in slide text for the saved business details. */
export function fillText<T extends string | undefined>(text: T, brand: BrandSettings): T {
  if (!text) return text;
  return text.replace(TOKENS, (_, key: string) =>
    key.toLowerCase() === "phone" ? brand.phone : brand.businessName
  ) as T;
}

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255;
    const y = (pb >> shift) & 255;
    return Math.round(x + (y - x) * t);
  };
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

const TEXT_FIELDS = [
  "eyebrow",
  "headline",
  "subheadline",
  "productName",
  "description",
  "originalPrice",
  "promoPrice",
  "discountBadge",
  "ctaText",
  "tickerText",
] as const;

/** The scene as the screen shows it: placeholders filled, brand colours applied if switched on.
 *  Theme decorations always render (handled in SceneRenderer). Theme colours only override
 *  the slide's own colours when applyColors is on — the slide keeps its own palette otherwise.
 */
export function brandScene(scene: Scene, brand: BrandSettings): Scene {
  const out: Scene = { ...scene };
  out.brandLogoUrl = brand.logoUrl || undefined;
  out.brandName = brand.businessName || undefined;
  if (!out.bgImageUrl && brand.defaultBgImageUrl) out.bgImageUrl = brand.defaultBgImageUrl;
  for (const k of TEXT_FIELDS) out[k] = fillText(scene[k], brand);
  if (scene.items) {
    out.items = scene.items.map((it: SceneItem) => ({
      ...it,
      name: fillText(it.name, brand),
      price: fillText(it.price, brand),
      desc: fillText(it.desc, brand),
      tag: fillText(it.tag, brand),
    }));
  }
  if (brand.applyColors) {
    // Theme colours win over brand colours when a theme is set, otherwise brand colours.
    if (scene.theme && scene.theme !== "none") {
      const tp = themePalette(scene.theme);
      out.accentColor = tp.accent;
      // highlightColor drives price plates, stickers and tags (storeBoardParts.palette).
      // It used to be left untouched here, so every theme fell back to the stock
      // yellow #ffd60a and plates ignored the theme's own second accent.
      out.highlightColor = tp.accent2;
      out.bgFrom = tp.bgFrom;
      out.bgTo = tp.bgTo;
      out.textColor = tp.text;
      out.mutedColor = tp.muted;
      out.cardColor = "#ffffff";
    } else {
      out.accentColor = brand.accentColor;
      out.bgFrom = brand.backgroundColor;
      out.bgTo = mix(brand.backgroundColor, brand.accentColor, 0.22);
      out.textColor = "#ffffff";
      out.mutedColor = mix("#ffffff", brand.accentColor, 0.18);
      out.cardColor = mix(brand.backgroundColor, "#ffffff", 0.06);
      out.highlightColor = brand.accentColor;
    }
    // Keep a background image, but tint its dark overlay with the brand colour.
    if (scene.bgImageUrl) out.overlayColor = brand.backgroundColor;
  }
  return out;
}

/** Ticker for a slide: the business ticker replaces or fills in for the slide's own. */
export function tickerFor(scene: Scene, brand: BrandSettings): string {
  const own = fillText(scene.tickerText, brand) || "";
  const shared = fillText(brand.tickerText, brand);
  return brand.tickerOnAll && shared ? shared : own || shared;
}
