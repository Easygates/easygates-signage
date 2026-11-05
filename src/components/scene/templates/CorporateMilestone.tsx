import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, Frame, MARGIN, TOP, fitPx } from "./brandParts";
import { kit } from "./brandKit";

/**
 * Template "corporate-milestone" — Corporate · Milestone / anniversary.
 *
 * One big number ("25", "1,000+", "10 YEARS") with a line underneath saying what it counts, a short
 * story, and a tall photo beside it. Built to be read from the other side of a reception area.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "A MILESTONE"
 * - headline    = the number, e.g. "25" (kept short; it is sized to fill the space)
 * - subheadline = what it counts, e.g. "YEARS KEEPING BRITAIN MOVING"
 * - description = the story, a sentence or two
 * - ctaText     = optional button, e.g. "HERE'S TO THE NEXT 25"
 * - imageUrl    = photo on the right (cropped to fill); leave empty for the number alone
 * Not used: productName, prices, items, highlightColor.
 */

export default function CorporateMilestoneTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const hasImage = Boolean(scene.imageUrl);
  const leftW = hasImage ? 960 : 1700;
  const headline = (scene.headline || "").trim();
  const sub = (scene.subheadline || "").trim();
  const desc = (scene.description || "").trim();
  const numPx = fitPx(headline, leftW, hasImage ? 360 : 420, 110, 1, -0.04);
  const subPx = fitPx(sub, leftW, 50, 28, 2, 0.02, true);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", gap: 56 }}>
      <div style={{ flex: "none", width: leftW, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        {scene.eyebrow ? (
          <A d={d} i={0} cls="sg-fade-down" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "block", width: 46, height: 8, borderRadius: 99, background: k.accent, flex: "none" }} />
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "0.26em", textTransform: "uppercase", color: k.accent }}>{scene.eyebrow}</span>
          </A>
        ) : null}
        <div className="sg-mask">
          <span className="sg-display" style={{ display: "block", fontSize: numPx, lineHeight: 0.9, letterSpacing: "-0.04em", color: k.accent, animationDelay: `${150 + d.s}ms` }}>{headline}</span>
        </div>
        {sub ? (
          <A d={d} i={2} cls="sg-fade-up" style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: subPx, fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1.08, textTransform: "uppercase", color: k.text }}>{sub}</span>
          </A>
        ) : null}
        {desc ? (
          <A d={d} i={3} cls="sg-fade-up" tag="p" style={{ margin: 0, maxWidth: leftW - 40, fontSize: 32, fontWeight: 600, lineHeight: 1.32, color: k.muted }}>
            {desc}
          </A>
        ) : null}
        {scene.ctaText ? (
          <div style={{ marginTop: 10 }}>
            <CtaBar scene={scene} d={d} k={k} i={5} width={leftW} />
          </div>
        ) : null}
      </div>

      {hasImage ? (
        <A d={d} i={2} cls="sg-scale-in" style={{ flex: "1 1 0", minWidth: 0 }}>
          <Frame src={scene.imageUrl} alt="" w="100%" h="100%" k={k} radius={36} fit="cover" />
        </A>
      ) : null}
    </div>
  );
}
