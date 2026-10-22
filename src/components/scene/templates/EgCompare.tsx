import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Frame, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, bullets, columnCount, columnWidth, kit, radiusFor, rows, type Kit } from "./brandKit";

/**
 * Template "eg-compare" — EasyGates Direct · Which Automation?
 *
 * A side-by-side comparison of up to four automation types (or motors, or
 * operators): each column carries a photo, a from-price, and a short
 * specification list. Columns are squared off with a hard accent bar — the
 * "choose your machine" wall of a trade counter.
 *
 * FIELDS:
 * - eyebrow        = small label, e.g. "EASYGATES DIRECT · WHICH MOTOR?"
 * - headline       = the board title, e.g. "PICK THE RIGHT AUTOMATION"
 * - subheadline    = one line under the headline
 * - ctaText        = button bottom-right, e.g. "ASK AN ENGINEER"
 * - highlightColor = second accent (the from-price strip and badges)
 * - items[]        = the options, up to four:
 *   - name  = the option, e.g. "Sliding gate motor"
 *   - price = the from-price, e.g. "FROM £449"
 *   - tag   = optional badge, e.g. "BEST SELLER"
 *   - desc  = the specification, one point per line or separated by " · "
 *   - image = optional photo of the unit
 * Not used: imageUrl, productName, description, prices.
 */

const GAP = 24;

function Column({
  k,
  d,
  i,
  item,
  w,
  h,
  cols,
}: {
  k: Kit;
  d: TemplateProps["d"];
  i: number;
  item: { name: string; price?: string; desc?: string; tag?: string; image?: string };
  w: number;
  h: number | string;
  cols: number;
}) {
  const points = bullets(item.desc, 4);
  const photoH = Math.round(Math.min(320, ((typeof h === "number" ? h : 620) - 230) * 0.62));
  const pointPx = points.length > 3 ? 23 : 26;
  const namePx = fitPx(item.name, w - 44, cols > 3 ? 38 : 46, 24);

  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        flex: "none",
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        background: alpha(k.text, k.dark ? 0.05 : 0.03),
        border: `1px solid ${k.line}`,
        borderRadius: radiusFor(w),
        overflow: "hidden",
        animationDelay: `${150 + d.s * (2 + i)}ms`,
      }}
    >
      <div style={{ flex: "none", height: 8, background: k.solid }} />
      {item.image ? (
        <div style={{ flex: "none", padding: "18px 18px 0" }}>
          <Frame src={item.image} alt={item.name} w="100%" h={photoH} k={k} radius={16} fit="contain" />
        </div>
      ) : null}
      <div style={{ flex: "1 1 auto", minHeight: 0, padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <span style={{ flex: "1 1 auto", fontSize: namePx, fontWeight: 900, lineHeight: 1.1, color: k.text, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{item.name}</span>
          {item.tag ? (
            <span
              style={{
                flex: "none",
                fontSize: 16,
                fontWeight: 900,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 11px",
                borderRadius: 7,
                background: k.solid2,
                color: k.solid2Ink,
                whiteSpace: "nowrap",
              }}
            >
              {item.tag}
            </span>
          ) : null}
        </div>
        {item.price ? (
          <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: k.accent2 }}>{item.price}</span>
        ) : null}
        <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          {points.map((p, j) => (
            <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ flex: "none", marginTop: 2 }}>
                <BrandIcon id="check" size={pointPx * 0.8} color={k.accent} stroke={3.2} />
              </span>
              <span style={{ fontSize: pointPx, fontWeight: 700, lineHeight: 1.22, color: k.text, overflowWrap: "anywhere" }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EgCompareTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 4);
  const cols = columnCount(items.length || 3);
  const totalW = 1920 - MARGIN * 2;
  const w = columnWidth(totalW, cols, GAP);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={80} min={36} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", gap: GAP, alignItems: "stretch" }}>
        {items.length ? (
          items.map((it, i) => <Column key={i} k={k} d={d} i={i} item={it} w={w} h="100%" cols={cols} />)
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add up to four options in the editor — one row per machine.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
        <CtaBar scene={scene} d={d} k={k} i={7} width={720} />
      </div>
    </div>
  );
}
