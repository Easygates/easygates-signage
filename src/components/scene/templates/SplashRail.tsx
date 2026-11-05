import type { TemplateProps } from "../parts";
import { hexToRgb, mixHex } from "@/lib/color";
import { inkOn } from "./brandKit";
import { A, Icon, palette } from "./storeBoardParts";
import { fitText, serviceIcon } from "./storeBoardKit";
import { accentBar, glueRanges, headlinePlan, logoSource, plateColor, plateInk, splashDetails } from "./splashKit";

/**
 * Template "splash-rail" — EasyGates Direct / any business · Header-rail welcome.
 *
 * A brand rail runs the full width of the top of the screen — colour, logo and
 * business name — and the welcome sits centred underneath with the contact
 * details laid out as a single ledger row. Softer and more corporate than the
 * original splash: no floating plate in the middle of the screen.
 *
 * FIELDS:
 * - imageUrl       = logo for this slide only; empty uses the logo from Business settings
 * - eyebrow        = small label beside the business name in the rail, e.g. "WELCOME"
 * - headline       = the centred welcome line
 * - subheadline    = helper line under it
 * - ctaText        = pill under the contact ledger
 * - items[]        = contact details, up to 4 ledger columns
 *   - name = label, e.g. "Call us" (the icon is picked from the words, or items[].tag)
 *   - desc = the detail, e.g. "{phone}" or "Mon–Fri 8am–5pm"
 * - logoPlateColor = plate behind the logo: "" = follow the Business setting,
 *                    "none" = no plate, or a hex colour
 * - barColor       = the rail and divider colour; empty = the slide accent
 * - accentColor    = icon circles and the pill
 * Not used: prices, productName, description, items[].price/image.
 */

type DetailIcon = "mail" | "web" | "pin" | ReturnType<typeof serviceIcon>;

function detailIcon(tag: string | undefined, name: string | undefined, i: number): DetailIcon {
  const t = `${tag || ""} ${name || ""}`.toLowerCase();
  if (/mail/.test(t)) return "mail";
  if (/\bweb|www|website|\.com|\.co\.uk/.test(t)) return "web";
  if (/find us|visit|address|location|where|showroom|directions|map\b/.test(t)) return "pin";
  return serviceIcon(tag, name, i);
}

function DetailGlyph({ id, size, color }: { id: DetailIcon; size: number; color: string }) {
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

const RAIL_H = 252;

export default function SplashRailTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const name = (scene.brandName || "").trim();
  const logo = logoSource(scene);
  const plate = plateColor(scene);
  const bar = accentBar(scene, pal.accent);
  const railInk = inkOn(bar);
  const railDeep = mixHex(bar, "#000000", 0.3);
  const eyebrow = (scene.eyebrow || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const items = splashDetails(scene, 4);
  const text = scene.textColor || "#ffffff";
  const muted = scene.mutedColor || soft(text, 0.72);
  const wordInk = plateInk(plate, railInk);

  const headPlan = headlinePlan(scene.headline || "", 1500, { oneMax: 102, oneMin: 64, twoMax: 96, twoMin: 46 });
  const subFit = fitText({ text: sub, boxW: 1360, maxPx: 38, minPx: 26, maxLines: 2, lineHeight: 1.2 });
  const wordFit = fitText({ text: name, boxW: 620, maxPx: 60, minPx: 28, maxLines: 1, upper: true, lineHeight: 1, ls: 0 });
  const colW = items.length ? Math.floor((1620 - (items.length - 1) * 2) / items.length) : 0;

  return (
    <div className="absolute inset-0 z-10">
      {/* ── brand rail ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: RAIL_H,
          background: `linear-gradient(100deg, ${bar} 0%, ${bar} 55%, ${railDeep} 100%)`,
          display: "flex",
          alignItems: "center",
          gap: 34,
          padding: "0 76px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <A d={d} i={0} cls="sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 34, width: "100%" }}>
          <div
            style={{
              flex: "none",
              background: plate ?? "transparent",
              borderRadius: 26,
              padding: plate ? "18px 34px" : 0,
              minWidth: plate ? 300 : undefined,
              minHeight: plate ? 118 : undefined,
              maxWidth: 640,
              display: "grid",
              placeItems: "center",
              boxShadow: plate ? "0 12px 0 rgba(0,0,0,0.14), 0 22px 44px rgba(0,0,0,0.3)" : "0 16px 38px rgba(0,0,0,0.35)",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={name || "Logo"} style={{ display: "block", maxWidth: 570, maxHeight: 118, width: "auto", height: "auto", objectFit: "contain", filter: plate ? undefined : "drop-shadow(0 8px 18px rgba(0,0,0,0.4))" }} />
            ) : (
              <div style={{ color: wordInk, fontSize: wordFit.px, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.01em", textTransform: "uppercase" }}>{name || "Welcome"}</div>
            )}
          </div>

          <div style={{ flex: "none", width: 2, height: 96, background: soft(railInk, 0.35) }} />

          <div style={{ minWidth: 0, flex: "1 1 auto", textAlign: "left" }}>
            {eyebrow ? <div style={{ color: soft(railInk, 0.8), fontSize: 22, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 8 }}>{eyebrow}</div> : null}
            {name ? <div style={{ color: railInk, fontSize: 44, fontWeight: 900, letterSpacing: "0.04em", lineHeight: 1.05, textTransform: "uppercase" }}>{name}</div> : null}
          </div>
        </A>
      </div>

      {/* ── welcome body ── */}
      <div style={{ position: "absolute", left: 100, right: 100, top: RAIL_H + 42, bottom: 74, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 18 }}>
        <A d={d} i={2} cls="sg-fade-up" style={{ maxWidth: 1560 }}>
          <div style={{ color: text, fontSize: headPlan.px, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
            {headPlan.lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </A>

        <A d={d} i={3} cls="sg-scale-in">
          <div style={{ width: 190, height: 9, borderRadius: 6, background: bar }} />
        </A>

        {sub ? (
          <A d={d} i={4} cls="sg-fade-up" style={{ maxWidth: 1400 }}>
            <div style={{ color: muted, fontSize: subFit.px, fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{sub}</div>
          </A>
        ) : null}

        {items.length ? (
          <A d={d} i={5} cls="sg-scale-in" style={{ width: 1700, marginTop: 12 }}>
            <div style={{ width: 1700, boxSizing: "border-box", display: "flex", alignItems: "stretch", borderRadius: 26, background: soft(text, 0.07), border: `2px solid ${soft(text, 0.15)}`, overflow: "hidden" }}>
              {items.map((it, i) => {
                const value = it.desc || it.name;
                const label = it.desc ? it.name : "";
                const vf = fitText({ text: value, boxW: colW - 58, maxPx: 36, minPx: 22, maxLines: 2, lineHeight: 1.1 });
                return (
                  <div
                    key={i}
                    className="sg-anim sg-fade-up"
                    style={{
                      width: colW,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "26px 22px",
                      borderLeft: i === 0 ? undefined : `2px solid ${soft(text, 0.12)}`,
                      animationDelay: `${150 + (5 + i) * 80}ms`,
                    }}
                  >
                    <span style={{ flex: "none", width: 58, height: 58, borderRadius: 18, background: bar, display: "grid", placeItems: "center" }}>
                      <DetailGlyph id={detailIcon(it.tag, it.name, i)} size={34} color={railInk} />
                    </span>
                    <div style={{ minWidth: 0, textAlign: "left" }}>
                      {label ? <div style={{ color: muted, fontSize: 18, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: 4 }}>{label}</div> : null}
                      <div style={{ color: text, fontSize: vf.px, fontWeight: 900, lineHeight: 1.1, overflowWrap: "break-word" }}>{glueRanges(value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </A>
        ) : null}

        {cta ? (
          <A d={d} i={10} cls="sg-pop" style={{ marginTop: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "18px 40px", borderRadius: 999, background: bar, color: railInk, fontSize: 30, fontWeight: 900, letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: "0 16px 38px rgba(0,0,0,0.35)" }}>
              <span style={{ display: "block", width: 13, height: 13, borderRadius: 99, background: railInk, animation: "sg-pulse 1.8s ease-in-out infinite" }} />
              {cta}
            </span>
          </A>
        ) : null}
      </div>
    </div>
  );
}
