import type { TemplateProps } from "../parts";
import { hexToRgb, mixHex } from "@/lib/color";
import { inkOn } from "./brandKit";
import { A, Icon, palette } from "./storeBoardParts";
import { fitText, serviceIcon } from "./storeBoardKit";
import { accentBar, glueRanges, headlinePlan, logoSource, plateColor, plateInk, splashDetails } from "./splashKit";

/**
 * Template "splash-split" — EasyGates Direct / any business · Split-panel welcome.
 *
 * A welcome screen with the brand side and the information side separated: a full
 * height colour panel down the left carries the logo (on a plate, or floating) and
 * the call to action, while the right two-thirds holds the welcome line and the
 * contact details as stacked cards.
 *
 * FIELDS:
 * - imageUrl       = logo for this slide only; empty uses the logo from Business settings
 * - eyebrow        = small label in the colour panel, e.g. "WELCOME"
 * - headline       = big welcome line on the right, e.g. "Gates · Automation · Electrical"
 * - subheadline    = helper line under it
 * - ctaText        = pill at the bottom of the colour panel, e.g. "FREE SITE SURVEY"
 * - items[]        = contact details, up to 4 cards
 *   - name = label, e.g. "Call us" (the icon is picked from the words, or items[].tag)
 *   - desc = the detail, e.g. "{phone}" or "Mon–Fri 8am–5pm"
 * - logoPlateColor = plate behind the logo: "" = follow the Business setting,
 *                    "none" = no plate, or a hex colour
 * - barColor       = the colour panel and divider; empty = the slide accent
 * - accentColor    = icon circles and the eyebrow pill
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

const PANEL_W = 780;

export default function SplashSplitTemplate({ scene, d }: TemplateProps) {
  const pal = palette(scene);
  const name = (scene.brandName || "").trim();
  const logo = logoSource(scene);
  const plate = plateColor(scene);
  const bar = accentBar(scene, pal.accent);
  const barInk = inkOn(bar);
  const panelDeep = mixHex(bar, "#000000", 0.34);
  const eyebrow = (scene.eyebrow || "").trim();
  const sub = (scene.subheadline || "").trim();
  const cta = (scene.ctaText || "").trim();
  const items = splashDetails(scene, 4);
  const text = scene.textColor || "#ffffff";
  const muted = scene.mutedColor || soft(text, 0.72);
  const wordInk = plateInk(plate, barInk);

  const headPlan = headlinePlan(scene.headline || "", 980, { oneMax: 84, oneMin: 58, twoMax: 88, twoMin: 42 });
  const subFit = fitText({ text: sub, boxW: 960, maxPx: 40, minPx: 26, maxLines: 2, lineHeight: 1.2 });
  const wordFit = fitText({ text: name, boxW: PANEL_W - 150, maxPx: 64, minPx: 30, maxLines: 2, upper: true, lineHeight: 0.98, ls: -0.01 });
  const rowH = items.length >= 4 ? 100 : items.length === 3 ? 118 : 140;

  return (
    <div className="absolute inset-0 z-10">
      {/* ── brand panel ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: PANEL_W,
          background: `linear-gradient(165deg, ${bar} 0%, ${bar} 42%, ${panelDeep} 100%)`,
          boxShadow: "18px 0 60px rgba(0,0,0,0.45)",
        }}
      >
        {/* soft light behind the logo */}
        <div aria-hidden="true" style={{ position: "absolute", left: -120, top: 120, width: 820, height: 620, background: `radial-gradient(closest-side, ${soft(barInk, 0.18)}, transparent)`, filter: "blur(12px)" }} />

        <div style={{ position: "absolute", inset: 0, padding: "64px 62px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {eyebrow ? (
            <A d={d} i={0} cls="sg-fade-down">
              <span style={{ display: "inline-block", border: `3px solid ${soft(barInk, 0.55)}`, color: barInk, fontSize: 24, fontWeight: 900, letterSpacing: "0.24em", textTransform: "uppercase", padding: "10px 26px 10px 30px", borderRadius: 999 }}>{eyebrow}</span>
            </A>
          ) : null}

          <div style={{ flex: "1 1 0" }} />

          <A d={d} i={1} cls="sg-scale-in" slow>
            <div
              style={{
                background: plate ?? "transparent",
                borderRadius: 34,
                padding: plate ? "26px 46px" : 0,
                minWidth: plate ? 420 : undefined,
                maxWidth: 660,
                minHeight: plate ? 170 : undefined,
                display: "grid",
                placeItems: "center",
                boxShadow: plate ? "0 16px 0 rgba(0,0,0,0.16), 0 34px 66px rgba(0,0,0,0.38)" : "0 26px 60px rgba(0,0,0,0.45)",
              }}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={name || "Logo"} style={{ display: "block", maxWidth: 600, maxHeight: 160, width: "auto", height: "auto", objectFit: "contain", filter: plate ? undefined : "drop-shadow(0 10px 22px rgba(0,0,0,0.45))" }} />
              ) : (
                <div style={{ color: wordInk, fontSize: wordFit.px, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.01em", textTransform: "uppercase", maxWidth: PANEL_W - 180 }}>{name || "Welcome"}</div>
              )}
            </div>
          </A>

          {logo && name ? (
            <A d={d} i={2} cls="sg-fade-up" style={{ marginTop: 22 }}>
              <span style={{ display: "block", color: barInk, fontSize: 30, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", lineHeight: 1.1 }}>{name}</span>
            </A>
          ) : null}

          <div style={{ flex: "1 1 0" }} />

          {cta ? (
            <A d={d} i={3} cls="sg-pop">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "20px 38px",
                  borderRadius: 999,
                  background: plate ?? barInk,
                  color: plate ? plateInk(plate, barInk) : bar,
                  fontSize: 30,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  boxShadow: "0 16px 38px rgba(0,0,0,0.35)",
                }}
              >
                <span style={{ display: "block", width: 13, height: 13, borderRadius: 99, background: plate ? plateInk(plate, barInk) : bar, animation: "sg-pulse 1.8s ease-in-out infinite" }} />
                {cta}
              </span>
            </A>
          ) : null}
        </div>
      </div>

      {/* ── information side ── */}
      <div style={{ position: "absolute", left: PANEL_W + 70, right: 76, top: 116, bottom: 78, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <A d={d} i={2} cls="sg-fade-up" style={{ maxWidth: 990 }}>
          <div style={{ color: text, fontSize: headPlan.px, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em", overflowWrap: "anywhere" }}>
            {headPlan.lines.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        </A>

        <A d={d} i={3} cls="sg-scale-in">
          <div style={{ width: 150, height: 9, borderRadius: 6, background: bar }} />
        </A>

        {sub ? (
          <A d={d} i={4} cls="sg-fade-up" style={{ maxWidth: 960 }}>
            <div style={{ color: muted, fontSize: subFit.px, fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{sub}</div>
          </A>
        ) : null}

        {items.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8, maxWidth: 990 }}>
            {items.map((it, i) => {
              const value = it.desc || it.name;
              const label = it.desc ? it.name : "";
              const vf = fitText({ text: value, boxW: 700, maxPx: 40, minPx: 24, maxLines: 2, lineHeight: 1.08 });
              return (
                <A key={i} d={d} i={5 + i} cls="sg-slide-r" style={{ height: rowH }}>
                  <div style={{ height: rowH, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 22, padding: "0 26px", borderRadius: 22, background: soft(text, 0.08), border: `2px solid ${soft(text, 0.16)}` }}>
                    <span style={{ flex: "none", width: 68, height: 68, borderRadius: 20, background: bar, display: "grid", placeItems: "center" }}>
                      <DetailGlyph id={detailIcon(it.tag, it.name, i)} size={40} color={barInk} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {label ? <div style={{ color: muted, fontSize: 20, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1, marginBottom: 4 }}>{label}</div> : null}
                      <div style={{ color: text, fontSize: vf.px, fontWeight: 900, lineHeight: 1.08, overflowWrap: "break-word" }}>{glueRanges(value)}</div>
                    </div>
                  </div>
                </A>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
