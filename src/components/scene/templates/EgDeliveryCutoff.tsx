import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Head, MARGIN, Panel, TOP, fitPx } from "./brandParts";
import { clockHand, handAngle, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-delivery-cutoff" — EasyGates Direct · Order Cut-Off & Delivery.
 *
 * A dispatch board: a big clock dial with the cut-off time on the left, the
 * delivery options as a numbered list on the right. The dial hands are drawn
 * from the cut-off text, so "3PM" and "16:30" both point somewhere sensible.
 *
 * FIELDS:
 * - eyebrow      = small label, e.g. "EASYGATES DIRECT · NEXT DAY DELIVERY"
 * - headline     = the board title, e.g. "ORDER BY 3PM. ON SITE TOMORROW."
 * - subheadline  = one line under the headline
 * - productName  = the cut-off time drawn inside the dial, e.g. "3PM"
 * - description  = the promise line under the options
 * - ctaText      = button bottom-right
 * - imageUrl     = optional photo beside the dial (a van, a pallet, the counter)
 * - items[]      = the delivery options:
 *   - name = the service, e.g. "Next day — pre 12"
 *   - desc = detail, e.g. "Order by 3pm Mon–Fri"
 *   - tag  = the price or badge, e.g. "£9.95" / "FREE OVER £150"
 * Not used: prices, highlightColor.
 */

const DIAL = 330;

function Option({ k, i, name, desc, tag, px }: { k: Kit; i: number; name: string; desc?: string; tag?: string; px: number }) {
  return (
    <div
      className="sg-anim sg-slide-r"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: `${Math.round(px * 0.4)}px ${Math.round(px * 0.5)}px`,
        borderRadius: 14,
        background: i % 2 ? "transparent" : undefined,
        border: `1px solid ${k.line}`,
        animationDelay: `${150 + i * 80}ms`,
      }}
    >
      <span style={{ flex: "none", display: "grid", placeItems: "center", width: px + 20, height: px + 20, borderRadius: 12, background: k.solid, color: k.solidInk }}>
        <BrandIcon id="van" size={px * 0.78} color={k.solidInk} stroke={2.4} />
      </span>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: px, fontWeight: 800, color: k.text, overflowWrap: "anywhere" }}>{name}</span>
        {desc ? <span style={{ display: "block", marginTop: 3, fontSize: Math.round(px * 0.72), fontWeight: 600, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
      </span>
      {tag ? (
        <span style={{ flex: "none", fontSize: Math.round(px * 0.78), fontWeight: 900, color: k.accent, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{tag}</span>
      ) : null}
    </div>
  );
}

export default function EgDeliveryCutoffTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 5);
  const px = items.length > 4 ? 26 : 30;
  const { hour, minute } = clockHand(scene.productName || "3pm");
  const { hourDeg, minuteDeg } = handAngle(hour, minute);
  const dialLabel = (scene.productName || "3PM").trim();
  const rightW = 1920 - MARGIN * 2 - DIAL - 44;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={1920 - MARGIN * 2} max={80} min={36} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: 44, alignItems: "center" }}>
        {/* ── the clock dial ── */}
        <div style={{ flex: "none", width: DIAL, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            className="sg-anim sg-scale-in"
            style={{
              position: "relative",
              width: DIAL,
              height: DIAL,
              borderRadius: "50%",
              border: `10px solid ${k.solid}`,
              background: k.panel,
              boxShadow: k.dark ? "0 20px 50px rgba(0,0,0,0.45)" : "0 16px 38px rgba(15,23,42,0.14)",
              animationDelay: `${150 + d.s}ms`,
            }}
          >
            {/* hour ticks */}
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 14,
                  width: i % 3 === 0 ? 6 : 3,
                  height: i % 3 === 0 ? 26 : 16,
                  marginLeft: i % 3 === 0 ? -3 : -1.5,
                  background: i % 3 === 0 ? k.accent : k.line,
                  borderRadius: 2,
                  transformOrigin: `50% ${DIAL / 2 - 14 - 10}px`,
                  transform: `rotate(${i * 30}deg)`,
                }}
              />
            ))}
            {/* hands */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                bottom: "50%",
                width: 12,
                height: DIAL * 0.26,
                marginLeft: -6,
                background: k.accent,
                borderRadius: 6,
                transformOrigin: "50% 100%",
                transform: `rotate(${hourDeg}deg)`,
              }}
            />
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "50%",
                bottom: "50%",
                width: 8,
                height: DIAL * 0.36,
                marginLeft: -4,
                background: k.text,
                borderRadius: 4,
                transformOrigin: "50% 100%",
                transform: `rotate(${minuteDeg}deg)`,
              }}
            />
            <span style={{ position: "absolute", left: "50%", top: "50%", width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: "50%", background: k.solid }} />
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "62%",
                textAlign: "center",
                fontSize: fitPx(dialLabel, DIAL - 90, 74, 30),
                fontWeight: 900,
                letterSpacing: "0.02em",
                color: k.text,
              }}
            >
              {dialLabel}
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.22em", textTransform: "uppercase", color: k.muted }}>cut-off</span>
        </div>

        {/* ── options ── */}
        <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel k={k} pad={24} style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            {items.length ? (
              items.map((it, i) => <Option key={i} k={k} i={2 + i} name={it.name} desc={it.desc} tag={it.tag} px={px} />)
            ) : (
              <span style={{ fontSize: 28, color: k.muted }}>Add the delivery options in the editor — one row per service.</span>
            )}
          </Panel>
          {scene.description ? (
            <p className="sg-anim sg-fade-up" style={{ margin: 0, fontSize: 27, fontWeight: 700, color: k.text, animationDelay: `${150 + d.s * (3 + items.length)}ms` }}>
              {scene.description}
            </p>
          ) : null}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={rightW} />
          </div>
        </div>
      </div>
    </div>
  );
}
