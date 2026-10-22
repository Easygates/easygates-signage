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
    }
    // Keep a background image, but tint its dark overlay with the brand colour.
    if (scene.bgImageUrl) out.overlayColor = brand.backgroundColor;
  }
  return out;
}

function themePalette(theme: string): { accent: string; bgFrom: string; bgTo: string; text: string; muted: string } {
  const palettes: Record<string, { accent: string; bgFrom: string; bgTo: string; text: string; muted: string }> = {
    christmas: { accent: "#dc2626", bgFrom: "#ffffff", bgTo: "#fef2f2", text: "#7f1d1d", muted: "#991b1b" },
    easter: { accent: "#ec4899", bgFrom: "#ffffff", bgTo: "#fce7f3", text: "#881337", muted: "#be185d" },
    halloween: { accent: "#f97316", bgFrom: "#fef2f2", bgTo: "#fecaca", text: "#7c2d12", muted: "#c2410c" },
    spring: { accent: "#16a34a", bgFrom: "#f0fdf4", bgTo: "#dcfce7", text: "#14532d", muted: "#15803d" },
    summer: { accent: "#0ea5e9", bgFrom: "#ffffff", bgTo: "#dbeafe", text: "#0c4a6e", muted: "#0369a1" },
    autumn: { accent: "#d97706", bgFrom: "#fffbeb", bgTo: "#fef3c7", text: "#78350f", muted: "#a16207" },
    winter: { accent: "#0ea5e9", bgFrom: "#ffffff", bgTo: "#eff6ff", text: "#0c4a6e", muted: "#0369a1" },
    none: { accent: "#ff3b30", bgFrom: "#0b1020", bgTo: "#1e2a5a", text: "#ffffff", muted: "#c7cede" },
  };
  return palettes[theme] ?? palettes.none;
}

/** Ticker for a slide: the business ticker replaces or fills in for the slide's own. */
export function tickerFor(scene: Scene, brand: BrandSettings): string {
  const own = fillText(scene.tickerText, brand) || "";
  const shared = fillText(brand.tickerText, brand);
  return brand.tickerOnAll && shared ? shared : own || shared;
}
