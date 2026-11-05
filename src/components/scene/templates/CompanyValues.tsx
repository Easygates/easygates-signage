import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, Frame, Head, MARGIN, Panel, TOP, fitPx } from "./brandParts";
import { kit, rows, stepLabel } from "./brandKit";

/**
 * Template "company-values" — Corporate · What we stand for.
 *
 * A mission board for reception and office screens: the headline and a photo down the left, the
 * company's values as large numbered cards on the right (one column up to three values, two
 * columns beyond that).
 *
 * FIELDS:
 * - eyebrow     = small label above the headline, e.g. "EASYGATES · HEAD OFFICE"
 * - headline    = the board title, e.g. "WHAT WE STAND FOR"
 * - subheadline = one line under the headline, e.g. the mission statement
 * - ctaText     = optional button under the photo
 * - imageUrl    = photo under the headline (cropped to fill); leave empty for text only
 * - items[]     = the values, up to six:
 *   - name = the value, e.g. "Safety first"
 *   - desc = one sentence behind it
 * Not used: productName, description, prices, highlightColor.
 */

const LEFT_W = 740;
const GAP = 52;

export default function CompanyValuesTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 6);
  const hasImage = Boolean(scene.imageUrl);
  const rightW = 1920 - MARGIN * 2 - LEFT_W - GAP;
  const cols = items.length > 3 ? 2 : 1;
  const cardGap = 22;
  const cardW = (rightW - (cols - 1) * cardGap) / cols;
  const nameMax = cols === 2 ? 42 : 56;
  const descPx = cols === 2 ? 27 : 32;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", gap: GAP }}>
      {/* ── headline + photo ── */}
      <div style={{ flex: "none", width: LEFT_W, display: "flex", flexDirection: "column", gap: 30, justifyContent: hasImage ? "flex-start" : "center" }}>
        <Head scene={scene} d={d} k={k} width={LEFT_W} max={88} min={40} />
        {hasImage ? (
          <A d={d} i={4} cls="sg-scale-in" style={{ flex: "1 1 0", minHeight: 0 }}>
            <Frame src={scene.imageUrl} alt="" w="100%" h="100%" k={k} radius={30} fit="cover" />
          </A>
        ) : null}
        {scene.ctaText ? <CtaBar scene={scene} d={d} k={k} i={9} width={LEFT_W} /> : null}
      </div>

      {/* ── the values ── */}
      <div style={{ flex: "1 1 auto", minWidth: 0, display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)", gap: cardGap }}>
        {items.length ? (
          items.map((it, i) => (
            <A key={i} d={d} i={3 + i} cls="sg-fade-up" style={{ minHeight: 0 }}>
              <Panel k={k} pad={30} radius={26} edge={i % 2 ? k.accent2 : k.accent} style={{ height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.22em", color: i % 2 ? k.accent2 : k.accent }}>{stepLabel(i)}</span>
                <span style={{ display: "block", fontSize: fitPx(it.name, cardW - 90, nameMax, 28, 2), fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.01em", color: k.text, overflowWrap: "break-word" }}>{it.name}</span>
                {it.desc ? <span style={{ display: "block", fontSize: descPx, fontWeight: 600, lineHeight: 1.3, color: k.muted, overflowWrap: "break-word" }}>{it.desc}</span> : null}
              </Panel>
            </A>
          ))
        ) : (
          <span style={{ fontSize: 30, color: k.muted }}>Add the company values in the editor — one row per value.</span>
        )}
      </div>
    </div>
  );
}
