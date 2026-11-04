import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Chip, Head, MARGIN, Panel, TOP } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-price-board" — EasyGates Direct · Trade Price Board.
 *
 * A catalogue price board rather than a promo: one line per product with the
 * part number and pack size underneath, a was-price chip where there is one, and
 * the trade price right-aligned in a single column. The header strip uses the
 * second accent so the whole board reads as a printed trade list.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "EASYGATES DIRECT · TRADE PRICES"
 * - headline       = the board title, e.g. "THIS WEEK AT THE COUNTER"
 * - subheadline    = one line under the headline
 * - description    = the footnote under the board, e.g. "Prices exclude VAT · while stocks last"
 * - ctaText        = button bottom-right
 * - highlightColor = second accent (header strip, was-price chips, price column)
 * - items[]        = the price lines, up to eight:
 *   - name  = the product, e.g. "Sliding gate motor 600kg"
 *   - price = the trade price, e.g. "£289.00"
 *   - desc  = part number and pack, e.g. "KIT-SL-600 · 1 kit"
 *   - tag   = optional chip, e.g. "WAS £349"
 * Not used: imageUrl, productName, prices (the slide-level original/promo price).
 */

function PriceRow({ k, i, name, price, desc, tag, px }: { k: Kit; i: number; name: string; price?: string; desc?: string; tag?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        padding: `${Math.round(px * 0.44)}px ${Math.round(px * 0.6)}px`,
        background: i % 2 ? alpha(k.text, k.dark ? 0.05 : 0.04) : "transparent",
        borderBottom: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 70}ms`,
      }}
    >
      <span style={{ flex: "none", width: 12, height: 12, borderRadius: 999, background: k.solid }} />
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, lineHeight: 1.14, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? (
          <span style={{ display: "block", marginTop: 2, fontSize: Math.round(px * 0.66), fontWeight: 700, letterSpacing: "0.08em", color: k.muted, overflowWrap: "anywhere" }}>{desc}</span>
        ) : null}
      </span>
      {tag ? (
        <span style={{ flex: "none" }}>
          <Chip k={k} text={tag} fill={alpha(k.accent2, 0.18)} ink={k.accent2} px={Math.round(px * 0.55)} />
        </span>
      ) : null}
      <span style={{ flex: "none", minWidth: 210, textAlign: "right", fontSize: Math.round(px * 1.22), fontWeight: 900, letterSpacing: "-0.01em", color: k.accent2 }}>{price || "POA"}</span>
    </div>
  );
}

export default function EgPriceBoardTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 8);
  const px = items.length > 6 ? 23 : items.length > 4 ? 27 : 31;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 22 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={74} min={34} />

      <Panel k={k} pad={0} radius={22} style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* column strip */}
        <div
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "14px 24px",
            background: k.solid2,
            color: k.solid2Ink,
          }}
        >
          <BrandIcon id="tools" size={26} color={k.solid2Ink} stroke={2.6} />
          <span style={{ flex: "1 1 auto", fontSize: 20, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase" }}>Product / part number</span>
          <span style={{ flex: "none", minWidth: 210, textAlign: "right", fontSize: 20, fontWeight: 900, letterSpacing: "0.26em", textTransform: "uppercase" }}>Trade price</span>
        </div>

        <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: items.length > 6 ? "flex-start" : "center", padding: "0 10px" }}>
          {items.length ? (
            items.map((it, i) => <PriceRow key={i} k={k} i={i} name={it.name} price={it.price} desc={it.desc} tag={it.tag} px={px} />)
          ) : (
            <span style={{ padding: 24, fontSize: 28, color: k.muted }}>Add price lines in the editor — one row per product.</span>
          )}
        </div>
      </Panel>

      <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28 }}>
        <p style={{ margin: 0, maxWidth: 1080, fontSize: 24, fontWeight: 700, lineHeight: 1.25, color: k.muted }}>{scene.description || ""}</p>
        <CtaBar scene={scene} d={d} k={k} i={5 + items.length} width={560} />
      </div>
    </div>
  );
}
