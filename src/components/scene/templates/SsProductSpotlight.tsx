import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, Stars, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "ss-product-spotlight" — Smart & Secure · Product Spotlight.
 *
 * One product, properly sold: big photo, the name and price, a row of
 * specification chips, the star rating and one customer quote. The showroom
 * equivalent of a shelf-talker.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "SMART & SECURE · PRODUCT OF THE MONTH"
 * - headline       = the product name, e.g. "Aqara Smart Lock U200"
 * - productName    = the range or model line, e.g. "Aqara · Smart locks"
 * - description    = the customer quote, e.g. "Fitted in twenty minutes…"
 * - originalPrice  = struck-through RRP
 * - promoPrice     = the price, e.g. "£179"
 * - discountBadge  = the rating, e.g. "4.8" (drawn as stars)
 * - ctaText        = button bottom-right, e.g. "TRY IT IN THE SHOWROOM"
 * - imageUrl       = the hero product photo, always shown whole
 * - highlightColor = second accent (the specification chips and the stars)
 * - items[]        = the specification, up to six:
 *   - name = the label, e.g. "Fits"
 *   - desc = the value, e.g. "Most UK multipoint locks"
 * Not used: subheadline.
 */

const PHOTO_W = 780;

function SpecChip({ k, i, name, desc, px }: { k: Kit; i: number; name: string; desc?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-pop"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        padding: "12px 20px",
        borderRadius: 18,
        background: alpha(k.accent2, k.dark ? 0.18 : 0.13),
        border: `1px solid ${alpha(k.accent2, 0.42)}`,
        animationDelay: `${150 + i * 70}ms`,
      }}
    >
      <span style={{ fontSize: Math.round(px * 0.76), fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", color: k.accent2, whiteSpace: "nowrap" }}>{name}</span>
      {desc ? (
        <span style={{ fontSize: px, fontWeight: 800, color: k.text, overflowWrap: "anywhere" }}>{desc}</span>
      ) : null}
    </div>
  );
}

export default function SsProductSpotlightTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 6);
  const rightW = 1920 - MARGIN * 2 - PHOTO_W - 48;
  const pricePx = fitPx(scene.promoPrice || "", rightW * 0.5, 104, 46);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 22 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={76} min={34} sub={false} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 48 }}>
        {/* ── the product ── */}
        <div className="sg-anim sg-scale-in" style={{ flex: "none", width: PHOTO_W, minHeight: 0, animationDelay: `${150 + d.s}ms` }}>
          <Frame src={scene.imageUrl} alt={scene.headline} w="100%" h="100%" k={k} radius={32} fit="contain" />
        </div>

        {/* ── the sell ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {scene.productName ? (
              <span className="sg-anim sg-fade-down" style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: k.accent, animationDelay: `${150 + d.s * 2}ms` }}>
                {scene.productName}
              </span>
            ) : null}
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              {scene.discountBadge ? <Stars rating={scene.discountBadge} k={k} px={38} /> : null}
              {scene.discountBadge ? <span style={{ fontSize: 26, fontWeight: 800, color: k.muted }}>{scene.discountBadge} out of 5</span> : null}
            </div>
          </div>

          {/* price */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
            {scene.promoPrice ? (
              <span className="sg-anim sg-price sg-display" style={{ fontSize: pricePx, lineHeight: 0.96, color: k.text, letterSpacing: "-0.03em", animationDelay: `${150 + d.s * 3}ms` }}>
                {scene.promoPrice}
              </span>
            ) : null}
            {scene.originalPrice ? (
              <span className="sg-anim sg-fade" style={{ fontSize: 32, fontWeight: 700, color: k.muted, textDecoration: "line-through", textDecorationThickness: 3, paddingBottom: 10, animationDelay: `${150 + d.s * 4}ms` }}>
                {scene.originalPrice}
              </span>
            ) : null}
          </div>

          {/* spec chips */}
          {items.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {items.map((it, i) => (
                <SpecChip key={i} k={k} i={3 + i} name={it.name} desc={it.desc} px={26} />
              ))}
            </div>
          ) : null}

          {/* quote */}
          {scene.description ? (
            <div
              className="sg-anim sg-fade-up"
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "22px 26px",
                borderRadius: 24,
                background: k.panel,
                border: `1px solid ${k.line}`,
                animationDelay: `${150 + d.s * (5 + items.length)}ms`,
              }}
            >
              <span style={{ flex: "none" }}>
                <BrandIcon id="star" size={42} color={k.accent2} stroke={2.2} />
              </span>
              <p style={{ margin: 0, fontSize: 30, fontWeight: 600, fontStyle: "italic", lineHeight: 1.32, color: k.text }}>{scene.description}</p>
            </div>
          ) : (
            <span style={{ flex: "1 1 auto" }} />
          )}

          <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
            <CtaBar scene={scene} d={d} k={k} i={7 + items.length} width={rightW} />
          </div>
        </div>
      </div>
    </div>
  );
}
