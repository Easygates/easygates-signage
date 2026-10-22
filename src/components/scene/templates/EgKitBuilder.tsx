import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, Panel, TOP, fitPx } from "./brandParts";
import { kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-kit-builder" — EasyGates Direct · Gate Kit Builder.
 *
 * A trade-catalogue product board: the kit's photo in a framed window on the left,
 * what is in the box as a dotted-leader specification list on the right, and a
 * price plate underneath. Monospaced part numbers and hairline rules give it the
 * trade-counter feel rather than a consumer promo look.
 *
 * FIELDS:
 * - eyebrow        = small label above the headline, e.g. "EASYGATES DIRECT · GATE KITS"
 * - headline       = the kit name, e.g. "SLIDING GATE KIT"
 * - subheadline    = one line under the headline
 * - productName    = the part number shown under the photo, e.g. "KIT-SL-230V"
 * - description    = short blurb under the specification list
 * - originalPrice  = struck-through "was" price
 * - promoPrice     = the big trade price
 * - discountBadge  = sticker beside the price, e.g. "SAVE £120"
 * - ctaText        = button at the bottom right
 * - imageUrl       = hero photo of the kit, always shown whole
 * - highlightColor = second accent (price plate, badges, part-number strip)
 * - items[]        = what is in the kit:
 *   - name  = component, e.g. "230V sliding gate motor"
 *   - price = quantity or "INCLUDED"
 *   - tag   = optional badge, e.g. "UPGRADED"
 * Not used: videoUrl.
 */

const PHOTO_W = 720;
const GAP = 36;

function SpecRow({ k, name, value, tag, i, px }: { k: Kit; name: string; value: string; tag?: string; i: number; px: number }) {
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: `${Math.round(px * 0.34)}px 0`,
        borderBottom: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 70}ms`,
      }}
    >
      <span style={{ flex: "none", width: 26, height: 26, borderRadius: 6, background: k.solid, display: "grid", placeItems: "center" }}>
        <BrandIcon id="check" size={17} color={k.solidInk} stroke={3.4} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: px, fontWeight: 700, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
      {tag ? (
        <span
          style={{
            flex: "none",
            fontSize: Math.round(px * 0.62),
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "5px 12px",
            borderRadius: 8,
            background: k.solid2,
            color: k.solid2Ink,
          }}
        >
          {tag}
        </span>
      ) : null}
      <span style={{ flex: "none", minWidth: 120, textAlign: "right", fontSize: Math.round(px * 0.92), fontWeight: 900, color: k.accent2 }}>{value}</span>
    </div>
  );
}

export default function EgKitBuilderTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 8);
  const rightW = 1920 - MARGIN * 2 - PHOTO_W - GAP;
  const listCount = Math.max(1, items.length);
  const rowPx = listCount > 6 ? 26 : listCount > 4 ? 30 : 34;

  return (
    <div className="relative z-10" style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={86} min={38} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: GAP }}>
        {/* ── photo window ── */}
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

        {/* ── contents + price ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          <Panel k={k} pad={24} style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.24em", textTransform: "uppercase", color: k.muted }}>What&apos;s in the box</span>
              {items.length > 0 && <span style={{ fontSize: 20, fontWeight: 800, color: k.muted }}>{items.length} items</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: "1 1 0" }}>
              {items.length ? (
                items.map((it, i) => <SpecRow key={i} k={k} name={it.name} value={it.price || "INCLUDED"} tag={it.tag} i={2 + i} px={rowPx} />)
              ) : (
                <span style={{ fontSize: 28, color: k.muted }}>Add the kit contents in the editor — one row per component.</span>
              )}
            </div>
            {scene.description ? (
              <p style={{ margin: "14px 0 0", fontSize: 26, fontWeight: 600, lineHeight: 1.3, color: k.muted }}>{scene.description}</p>
            ) : null}
          </Panel>

          {/* price plate */}
          <div style={{ flex: "none", display: "flex", alignItems: "flex-end", gap: 26, flexWrap: "wrap" }}>
            <div className="sg-anim sg-fade" style={{ animationDelay: `${150 + d.s * (3 + items.length)}ms` }}>
              {scene.originalPrice ? (
                <span style={{ display: "block", fontSize: 30, fontWeight: 700, color: k.muted, textDecoration: "line-through", textDecorationThickness: 3 }}>
                  {scene.originalPrice}
                </span>
              ) : null}
              {scene.promoPrice ? (
                <span className="sg-display" style={{ display: "block", fontSize: fitPx(scene.promoPrice, 420, 118, 52), lineHeight: 0.98, color: k.text }}>
                  {scene.promoPrice}
                </span>
              ) : null}
            </div>
            {scene.discountBadge ? (
              <span
                className="sg-anim sg-pop"
                style={{
                  padding: "14px 26px",
                  borderRadius: 14,
                  background: k.solid,
                  color: k.solidInk,
                  fontSize: 32,
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  transform: "rotate(-2deg)",
                  animationDelay: `${150 + d.s * (4 + items.length)}ms`,
                }}
              >
                {scene.discountBadge}
              </span>
            ) : null}
            <div style={{ flex: "1 1 auto" }} />
            <CtaBar scene={scene} d={d} k={k} i={5 + items.length} width={rightW} />
          </div>
        </div>
      </div>
    </div>
  );
}
