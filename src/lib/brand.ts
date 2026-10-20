// ─── Business branding: one set of details used by every screen ──
// Client-safe (no DB imports): the player, admin previews and API all share it.

import type { Scene, SceneItem } from "./signage";

export interface BrandSettings {
  businessName: string;
  /** "" = no logo, show the business name instead */
  logoUrl: string;
  /** white badge behind the logo so coloured logos read on any slide */
  logoOnWhite: boolean;
  /** business name beside the logo (wordmark logos usually don't need it) */
  showName: boolean;
  phone: string;
  accentColor: string;
  backgroundColor: string;
  /** use the brand colours on every slide instead of each slide's own */
  applyColors: boolean;
  tickerText: string;
  /** replace slide tickers; otherwise only fills slides without one */
  tickerOnAll: boolean;
  showBrandBar: boolean;
  showClock: boolean;
}

export const DEFAULT_BRAND: BrandSettings = {
  businessName: "Easygates",
  logoUrl: "/trade/easygates-logo.svg",
  logoOnWhite: true,
  showName: false,
  phone: "01234 567 890",
  accentColor: "#1a7bbf",
  backgroundColor: "#07131f",
  applyColors: false,
  tickerText: "",
  tickerOnAll: false,
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
  const hex = (k: keyof BrandSettings) =>
    typeof v[k] === "string" && HEX.test(v[k] as string) ? (v[k] as string).toLowerCase() : (DEFAULT_BRAND[k] as string);
  return {
    businessName: str("businessName", 80),
    logoUrl: str("logoUrl", 2000),
    logoOnWhite: bool("logoOnWhite"),
    showName: bool("showName"),
    phone: str("phone", 40),
    accentColor: hex("accentColor"),
    backgroundColor: hex("backgroundColor"),
    applyColors: bool("applyColors"),
    tickerText: str("tickerText", 300),
    tickerOnAll: bool("tickerOnAll"),
    showBrandBar: bool("showBrandBar"),
    showClock: bool("showClock"),
  };
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

/** The scene as the screen shows it: placeholders filled, brand colours applied if switched on. */
export function brandScene(scene: Scene, brand: BrandSettings): Scene {
  const out: Scene = { ...scene };
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
    out.accentColor = brand.accentColor;
    out.bgFrom = brand.backgroundColor;
    out.bgTo = mix(brand.backgroundColor, brand.accentColor, 0.22);
    out.textColor = "#ffffff";
    out.mutedColor = mix("#ffffff", brand.accentColor, 0.18);
    out.cardColor = mix(brand.backgroundColor, "#ffffff", 0.06);
  }
  return out;
}

/** Ticker for a slide: the business ticker replaces or fills in for the slide's own. */
export function tickerFor(scene: Scene, brand: BrandSettings): string {
  const own = fillText(scene.tickerText, brand) || "";
  const shared = fillText(brand.tickerText, brand);
  return brand.tickerOnAll && shared ? shared : own || shared;
}
