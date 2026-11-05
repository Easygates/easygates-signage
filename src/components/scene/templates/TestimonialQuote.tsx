import type { TemplateProps } from "../parts";
import { A, BOTTOM, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows } from "./brandKit";

/**
 * Template "testimonial-quote" — Corporate · Customer praise.
 *
 * One customer quote set large, who said it on a card at the side, and up to two shorter quotes
 * underneath it.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "CUSTOMER STORY"
 * - headline    = the pull quote, the line that matters most
 * - description = the fuller version of the quote, in italics under the headline
 * - productName = who said it, e.g. "M. Carter" (the subheadline is used if this is empty)
 * - ctaText     = who they are, e.g. "Homeowner · Manchester"
 * - imageUrl    = photo of the customer or their site (round); their initial is used if empty
 * - items[]     = up to two more short quotes:
 *   - desc = the quote
 *   - name = who said it
 * Not used: prices, highlightColor.
 */

function initial(name: string): string {
  return (name.trim().charAt(0) || "“").toUpperCase();
}

export default function TestimonialQuoteTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const more = rows(scene, 2);
  const who = (scene.productName || scene.subheadline || "Customer").trim();
  const role = (scene.ctaText || "").trim();
  const headline = (scene.headline || "").trim();
  const desc = (scene.description || "").trim();
  const leftW = 1130;
  const sideW = 1920 - MARGIN * 2 - leftW - 60;
  const quotePx = fitPx(headline, leftW, 96, 48, desc ? 4 : 5, -0.02);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", gap: 60 }}>
      {/* ── the quote ── */}
      <div style={{ flex: "none", width: leftW, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        {scene.eyebrow ? (
          <A d={d} i={0} cls="sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 46, height: 8, borderRadius: 99, background: k.accent, flex: "none" }} />
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: k.accent }}>{scene.eyebrow}</span>
          </A>
        ) : null}
        <A d={d} i={1} cls="sg-scale-in" style={{ lineHeight: 0.6, height: 110 }}>
          <span style={{ display: "block", fontSize: 280, fontWeight: 900, lineHeight: 0.8, color: k.accent, fontFamily: "Georgia, 'Times New Roman', serif" }}>“</span>
        </A>
        <div className="sg-mask">
          <span className="sg-display" style={{ display: "block", fontSize: quotePx, lineHeight: 1.04, letterSpacing: "-0.02em", color: k.text, animationDelay: `${150 + d.s}ms` }}>{headline}</span>
        </div>
        {desc ? (
          <A d={d} i={3} cls="sg-fade-up" tag="p" style={{ margin: 0, fontSize: 34, fontStyle: "italic", fontWeight: 500, lineHeight: 1.36, color: k.muted }}>
            {desc}
          </A>
        ) : null}
      </div>

      {/* ── who said it, and more praise ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        <A d={d} i={4} cls="sg-fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: 26, padding: 28, borderRadius: 30, background: alpha(k.text, k.dark ? 0.08 : 0.05), border: `1px solid ${k.line}`, boxShadow: k.dark ? "0 18px 44px rgba(0,0,0,0.32)" : "0 14px 34px rgba(15,23,42,0.1)" }}>
            <span style={{ flex: "none", width: 124, height: 124, borderRadius: 999, overflow: "hidden", display: "grid", placeItems: "center", background: k.solid, color: k.solidInk, border: `4px solid ${k.accent}`, boxSizing: "border-box", fontSize: 58, fontWeight: 900 }}>
              {scene.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={scene.imageUrl} alt={who} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                initial(who)
              )}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: fitPx(who, sideW - 220, 48, 28, 2), fontWeight: 900, lineHeight: 1.06, color: k.text }}>{who}</span>
              {role ? <span style={{ display: "block", marginTop: 6, fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: k.accent }}>{role}</span> : null}
            </span>
          </div>
        </A>

        {more.map((it, i) => (
          <A key={i} d={d} i={6 + i} cls="sg-fade-up">
            <div style={{ padding: "24px 28px", borderRadius: 26, background: alpha(k.text, k.dark ? 0.05 : 0.035), border: `1px solid ${k.line}`, borderLeft: `8px solid ${i % 2 ? k.accent2 : k.accent}` }}>
              <span style={{ display: "block", fontSize: fitPx(it.desc || it.name, sideW - 90, 32, 24, 4, 0), fontStyle: "italic", fontWeight: 600, lineHeight: 1.3, color: k.text }}>{it.desc || it.name}</span>
              {it.desc && it.name ? <span style={{ display: "block", marginTop: 10, fontSize: 24, fontWeight: 900, letterSpacing: "0.04em", color: k.muted }}>{it.name}</span> : null}
            </div>
          </A>
        ))}
      </div>
    </div>
  );
}
