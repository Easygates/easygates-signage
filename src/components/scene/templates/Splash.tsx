import type { TemplateProps } from "../parts";
import { hexToRgb } from "@/lib/color";
import { A, CtaPill, Icon, palette } from "./storeBoardParts";
import { cleanItems, fitText, serviceIcon } from "./storeBoardKit";

/**
 * Template "splash" — a welcome / brand screen: the business logo on a white plate, the business
 * name or tagline, and a row of contact details. Everything comes from the slide, and the logo
 * follows Business settings, so changing the logo there updates every splash screen.
 *
 * FIELDS:
 * - imageUrl     = logo for this slide only; leave empty to use the logo from Business settings
 *                  (or the business name as a wordmark if the business has no logo)
 * - eyebrow      = small pill above the logo, e.g. "WELCOME"
 * - headline     = big line under the logo, e.g. "Gates · Automation · Electrical" ({business} works)
 * - subheadline  = helper line under it, e.g. "Supply, fit and repair — all makes"
 * - ctaText      = optional button, e.g. "FREE SITE SURVEY"
 * - items[]      = contact details, up to 4 cards
 *   - items[].name = label, e.g. "Call us" (the icon is picked from the words, or from items[].tag)
 *   - items[].desc = the detail, e.g. "{phone}" or "Mon–Fri 8am–5pm"
 * - accentColor  = icon circles and divider; textColor / mutedColor / bgFrom / bgTo as on every slide
 * Not used: prices, productName, description, items[].price/image.
 */

const FALLBACK_LOGO = "/trade/easygates-logo.svg";

/** Let long values (emails, web addresses) wrap after @ . / - instead of in the middle of a word. */
function breakable(v: string): string {
  return v.replace(/([@./_-])(?=\S)/g, "$1\u200b");
}

type DetailIcon = "mail" | "web" | "pin" | ReturnType<typeof serviceIcon>;

function detailIcon(tag: string | undefined, name: string | undefined, i: number): DetailIcon {
  const t = `${tag || ""} ${name || ""}`.toLowerCase();
  if (/mail/.test(t)) return "mail";
  if (/\bweb|www|website|\.com|\.co\.uk/.test(t)) return "web";
  if (/find us|visit|address|location|where|showroom|directions|map\b/.test(t)) return "pin";
  return serviceIcon(tag, name, i);
}

function DetailGlyph({ id, size, color }: { id: DetailIcon; size: number; color: string }) {
  if (id === "pin") return <Icon id="pin" size={size} color={color} stroke={2.2} />;
  if (id === "mail" || id === "web") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {id === "mail" ? (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="M3.5 7l8.5 6.5L20.5 7" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
          </>
        )}
      </svg>
    );
  }
  return <Icon id={id} size={size} color={color} stroke={2.2} />;
}

function soft(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})` : `rgba(255, 255, 255, ${a})`;
}

export default function SplashTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const logo = (scene.imageUrl || scene.brandLogoUrl || (scene.brandName ? "" : FALLBACK_LOGO)).trim();
  const name = (scene.brandName || "").trim();
  const eyebrow = (scene.eyebrow || "").trim();
  const head = (scene.headline || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const items = cleanItems(scene.items).filter((it) => it.name || it.desc).slice(0, 4);
  const n = items.length;

  const text = scene.textColor || "#ffffff";
  const muted = scene.mutedColor || soft(text, 0.7);

  // one line if it fits at a good size, otherwise two smaller lines (keeps the block inside its zone)
  const oneLine = fitText({ text: head, boxW: 1560, maxPx: 100, minPx: 64, maxLines: 1, lineHeight: 1.02, ls: -0.02 });
  const headFit = oneLine.fits ? oneLine : fitText({ text: head, boxW: 1560, maxPx: 84, minPx: 44, maxLines: 2, lineHeight: 1.02, ls: -0.02 });
  const subFit = fitText({ text: sub, boxW: 1400, maxPx: 42, minPx: 28, maxLines: 2, lineHeight: 1.2 });
  const wordFit = fitText({ text: name, boxW: 700, maxPx: 120, minPx: 52, maxLines: 2, upper: true, lineHeight: 0.95, ls: -0.02 });

  const gap = 28;
  const cardW = n ? Math.floor((1740 - gap * (n - 1)) / n) : 0;
  const cardInner = cardW - 2 * 26 - 76 - 20;

  return (
    <div className="absolute inset-0 z-10">
      {/* soft glow behind the logo */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: 460, top: n ? 0 : 120, width: 1000, height: 640, background: `radial-gradient(closest-side, ${soft(pal.accent, 0.35)}, transparent)`, filter: "blur(10px)" }}
      />

      <div style={{ position: "absolute", left: 0, right: 0, top: n ? 34 : 110, height: n ? 762 : 860, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, textAlign: "center" }}>
        {eyebrow && (
          <A d={d} i={0} cls="sg-fade-down">
            <span style={{ display: "inline-block", background: pal.solid, color: pal.solidInk, fontSize: 28, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", padding: "10px 30px 10px 34px", borderRadius: 999 }}>{eyebrow}</span>
          </A>
        )}

        <A d={d} i={1} cls="sg-scale-in" slow>
          <div style={{ background: "#ffffff", borderRadius: 40, padding: "30px 64px", minWidth: 560, maxWidth: 1000, minHeight: 220, display: "grid", placeItems: "center", boxShadow: "0 18px 0 rgba(0,0,0,0.18), 0 40px 80px rgba(0,0,0,0.35)" }}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={name || "Logo"} style={{ display: "block", maxWidth: 860, maxHeight: 200, width: "auto", height: "auto", objectFit: "contain" }} />
            ) : (
              <div style={{ color: "#0f172a", fontSize: wordFit.px, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.02em", textTransform: "uppercase", maxWidth: 800 }}>{name || "Welcome"}</div>
            )}
          </div>
        </A>

        {head && (
          <A d={d} i={2} cls="sg-fade-up" style={{ maxWidth: 1560 }}>
            <div style={{ color: text, fontSize: headFit.px, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>{head}</div>
          </A>
        )}

        <A d={d} i={3} cls="sg-scale-in">
          <div style={{ width: 170, height: 10, borderRadius: 6, background: pal.accent }} />
        </A>

        {sub && (
          <A d={d} i={4} cls="sg-fade-up" style={{ maxWidth: 1460 }}>
            <div style={{ color: muted, fontSize: subFit.px, fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{sub}</div>
          </A>
        )}

        {cta && (
          <A d={d} i={5} cls="sg-pop">
            <CtaPill text={cta} bg={pal.pop} fg={pal.popInk} />
          </A>
        )}
      </div>

      {n > 0 && (
        <div style={{ position: "absolute", left: 90, right: 90, top: 816, height: 170, display: "flex", gap }}>
          {items.map((it, i) => {
            const value = it.desc || it.name;
            const label = it.desc ? it.name : "";
            // four narrow cards need smaller type than one or two wide ones; long values drop to three small lines
            const cap = n >= 4 ? 34 : n === 3 ? 44 : 52;
            const two = fitText({ text: value, boxW: cardInner * 0.94, maxPx: cap, minPx: 24, maxLines: 2, lineHeight: 1.08 });
            const vf = two.fits ? two : fitText({ text: value, boxW: cardInner * 0.94, maxPx: 30, minPx: 22, maxLines: 3, lineHeight: 1.08 });
            return (
              <A key={i} d={d} i={6 + i} cls="sg-fade-up" style={{ width: cardW, height: 170 }}>
                <div style={{ width: cardW, height: 170, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 20, padding: "0 26px", borderRadius: 30, background: soft(text, 0.1), border: `3px solid ${soft(text, 0.22)}`, boxShadow: "0 8px 0 rgba(0,0,0,0.2)" }}>
                  <span style={{ flex: "none", width: 76, height: 76, borderRadius: 999, background: pal.solid, display: "grid", placeItems: "center" }}>
                    <DetailGlyph id={detailIcon(it.tag, it.name, i)} size={44} color={pal.solidInk} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {label && <div style={{ color: muted, fontSize: 22, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: 6 }}>{label}</div>}
                    <div style={{ color: text, fontSize: vf.px, fontWeight: 900, lineHeight: 1.08, overflowWrap: "break-word" }}>{breakable(value)}</div>
                  </div>
                </div>
              </A>
            );
          })}
        </div>
      )}
    </div>
  );
}
