import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, Panel, TOP, rowIcon } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-stock-status" — EasyGates Direct · Stock & Availability.
 *
 * The "what is on the shelf today" board: the product photo and part number on
 * the left, a list of lines on the right with a status chip that follows the row
 * tag (IN STOCK, NEXT DAY, DUE FRIDAY…). In-stock lines glow in the brand accent,
 * lead-time lines stay quiet — so the promise is obvious from across the counter.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "EASYGATES DIRECT · STOCK"
 * - headline    = the board title, e.g. "IN STOCK NOW"
 * - subheadline = one line under the headline
 * - productName = the part number strip under the photo, e.g. "KIT-SL-600"
 * - description = footnote under the list, e.g. "Stock checked at 7am · all prices exclude VAT"
 * - ctaText     = button bottom-right
 * - imageUrl    = the product photo, drawn whole
 * - items[]     = the stock lines, up to six:
 *   - name = the product, e.g. "230V sliding gate kit"
 *   - desc = detail, e.g. "3 on the shelf · 12 in the warehouse"
 *   - tag  = the status, e.g. "IN STOCK" / "NEXT DAY" / "2–3 DAYS"
 * Not used: prices, highlightColor.
 */

function statusTone(k: Kit, tag?: string) {
  const t = (tag || "").toLowerCase();
  // In stock reads in the second (warm) accent, "next day" in the brand accent
  // because it wants attention, and a lead time stays quiet — no invented greens.
  if (/in stock|stock|available|today|on the shelf/.test(t)) return { fill: k.solid2, ink: k.solid2Ink, soft: alpha(k.accent2, 0.14) };
  if (/next day|tomorrow|24h|despatch|dispatch/.test(t)) return { fill: k.solid, ink: k.solidInk, soft: alpha(k.accent, 0.14) };
  return { fill: alpha(k.text, 0.12), ink: k.text, soft: alpha(k.text, 0.06) };
}

function StockRow({ k, i, name, desc, tag, px }: { k: Kit; i: number; name: string; desc?: string; tag?: string; px: number }) {
  const tone = statusTone(k, tag);
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: `${Math.round(px * 0.36)}px 20px`,
        marginBottom: 8,
        borderRadius: 16,
        background: tone.soft,
        border: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 75}ms`,
      }}
    >
      <span style={{ flex: "none", width: 50, height: 50, borderRadius: 14, background: tone.fill, display: "grid", placeItems: "center" }}>
        <BrandIcon id={rowIcon({ name, desc, tag }, i)} size={28} color={tone.ink} stroke={2.4} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, lineHeight: 1.14, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? <span style={{ display: "block", marginTop: 2, fontSize: Math.round(px * 0.66), fontWeight: 600, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
      </span>
      {tag ? (
        <span
          style={{
            flex: "none",
            fontSize: Math.round(px * 0.52),
            fontWeight: 900,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "7px 14px",
            borderRadius: 9,
            background: tone.fill,
            color: tone.ink,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      ) : null}
    </div>
  );
}

const PHOTO_W = 620;

export default function EgStockStatusTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 6);
  const px = items.length > 4 ? 26 : items.length > 2 ? 30 : 34;
  const listW = 1920 - MARGIN * 2 - PHOTO_W - 36;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 22 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 36 }}>
        {/* ── product window ── */}
        <div style={{ flex: "none", width: PHOTO_W, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <div className="sg-anim sg-scale-in" style={{ flex: "1 1 0", minHeight: 0, animationDelay: `${150 + d.s}ms` }}>
            <Frame src={scene.imageUrl} alt={scene.productName || scene.headline} w="100%" h="100%" k={k} radius={22} fit="contain" />
          </div>
          {scene.productName ? (
            <div
              className="sg-anim sg-fade-up"
              style={{
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "12px 20px",
                borderRadius: 14,
                background: k.solid2,
                color: k.solid2Ink,
                animationDelay: `${150 + d.s * 4}ms`,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>{scene.productName}</span>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.18em", opacity: 0.75 }}>PART NO.</span>
            </div>
          ) : null}
        </div>

        {/* ── stock list + promise ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel k={k} edge={k.solid} pad={22} style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {items.length ? (
              items.map((it, i) => <StockRow key={i} k={k} i={2 + i} name={it.name} desc={it.desc} tag={it.tag} px={px} />)
            ) : (
              <span style={{ fontSize: 28, color: k.muted }}>Add the stock lines in the editor — one row per product.</span>
            )}
          </Panel>

          <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <p style={{ margin: 0, maxWidth: listW - 320, fontSize: 23, fontWeight: 700, lineHeight: 1.25, color: k.muted }}>{scene.description || ""}</p>
            <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={440} />
          </div>
        </div>
      </div>
    </div>
  );
}
