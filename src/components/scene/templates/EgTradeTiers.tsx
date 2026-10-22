import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, bullets, columnCount, columnWidth, kit, radiusFor, rows, type Kit } from "./brandKit";

/**
 * Template "eg-trade-tiers" — EasyGates Direct · Trade Account Tiers.
 *
 * A hard-edged rate card: up to four tiers side by side, each with a metal bar
 * across the top, the discount as the hero, and the benefits ticked underneath.
 * The tier named in `discountBadge` is lifted out as the recommended one.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "EASYGATES DIRECT · TRADE ACCOUNT"
 * - headline       = the board title, e.g. "TRADE PRICING THAT SCALES WITH YOU"
 * - subheadline    = one line under the headline
 * - description    = footnote under the columns, e.g. "All prices exclude VAT."
 * - discountBadge  = the tier to highlight, e.g. "GOLD" (matched against the row names)
 * - ctaText        = button bottom-right
 * - highlightColor = second accent (the recommended tier's bar and badge)
 * - items[]        = the tiers, best last or best first — up to four are shown:
 *   - name  = tier name, e.g. "Gold account"
 *   - price = the headline discount, e.g. "15%"
 *   - desc  = benefits, one per line or separated by " · "
 *   - tag   = optional badge, e.g. "MOST POPULAR"
 * Not used: imageUrl, productName, prices.
 */

const GAP = 26;

function Tier({ k, d, i, tier, w, h, featured }: { k: Kit; d: TemplateProps["d"]; i: number; tier: { name: string; price?: string; desc?: string; tag?: string }; w: number; h: number | string; featured: boolean }) {
  const points = bullets(tier.desc, 5);
  const bar = featured ? k.solid2 : k.solid;
  const barInk = featured ? k.solid2Ink : k.solidInk;
  const pointPx = points.length > 4 ? 24 : 27;
  const pricePx = fitPx(tier.price || "", w - 56, tier.price && tier.price.length > 5 ? 96 : 132, 54);

  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        flex: "none",
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        background: featured ? k.panel : alpha(k.text, k.dark ? 0.05 : 0.03),
        border: `2px solid ${featured ? k.solid2 : k.line}`,
        borderRadius: radiusFor(w),
        overflow: "hidden",
        boxShadow: featured ? (k.dark ? "0 22px 54px rgba(0,0,0,0.5)" : "0 18px 40px rgba(15,23,42,0.16)") : "none",
        animationDelay: `${150 + d.s * (2 + i)}ms`,
      }}
    >
      {/* metal bar */}
      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 22px", background: bar, color: barInk }}>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tier.name}
        </span>
        {tier.tag ? (
          <span style={{ flex: "none", fontSize: 16, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 6, background: barInk, color: bar }}>
            {tier.tag}
          </span>
        ) : null}
      </div>

      {/* the discount */}
      <div style={{ flex: "none", padding: "20px 24px 8px", display: "flex", alignItems: "flex-end", gap: 12 }}>
        {tier.price ? (
          <span className="sg-display" style={{ fontSize: pricePx, lineHeight: 0.94, color: featured ? k.accent2 : k.accent, letterSpacing: "-0.03em" }}>
            {tier.price}
          </span>
        ) : null}
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: k.muted, paddingBottom: 8 }}>off</span>
      </div>

      {/* benefits */}
      <div style={{ flex: "1 1 0", minHeight: 0, padding: "8px 24px 22px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
        {points.map((p, j) => (
          <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ flex: "none", marginTop: 3 }}>
              <BrandIcon id="check" size={pointPx * 0.82} color={featured ? k.accent2 : k.accent} stroke={3.2} />
            </span>
            <span style={{ fontSize: pointPx, fontWeight: 700, lineHeight: 1.2, color: k.text, overflowWrap: "anywhere" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EgTradeTiersTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 4);
  const cols = columnCount(items.length || 3);
  const totalW = 1920 - MARGIN * 2;
  const w = columnWidth(totalW, cols, GAP);
  const featuredName = (scene.discountBadge || "").trim().toLowerCase();

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: GAP, alignItems: "stretch" }}>
        {items.length ? (
          items.map((tier, i) => (
            <Tier
              key={i}
              k={k}
              d={d}
              i={i}
              tier={tier}
              w={w}
              h="100%"
              featured={Boolean(featuredName) && (tier.name || "").toLowerCase().includes(featuredName)}
            />
          ))
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add up to four tiers in the editor — one row per level.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 24 }}>
        {scene.description ? (
          <p className="sg-anim sg-fade-up" style={{ margin: 0, flex: "1 1 auto", fontSize: 24, fontWeight: 600, color: k.muted, animationDelay: `${150 + d.s * 7}ms` }}>
            {scene.description}
          </p>
        ) : (
          <span style={{ flex: "1 1 auto" }} />
        )}
        <CtaBar scene={scene} d={d} k={k} i={7} width={700} />
      </div>
    </div>
  );
}
