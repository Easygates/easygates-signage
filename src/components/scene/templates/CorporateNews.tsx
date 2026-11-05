import type { TemplateProps } from "../parts";
import { A, BOTTOM, CtaBar, Frame, Head, MARGIN, TOP } from "./brandParts";
import { kit } from "./brandKit";

/**
 * Template "corporate-news" — Corporate · Company news.
 *
 * A news story for staff and visitors: a big headline, the story, a dated "available from" line and a
 * photo. The date line is the slide's ticker text if it has one, otherwise the subheadline.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "COMPANY NEWS"
 * - headline    = the story title
 * - subheadline = the date / status line, e.g. "AVAILABLE FROM DECEMBER" (the ticker text is used first)
 * - description = the story, two or three sentences
 * - ctaText     = optional button, e.g. "BOOK A SITE SURVEY"
 * - imageUrl    = photo on the right (cropped to fill); leave empty for text only
 * Not used: productName, prices, items, highlightColor.
 */

export default function CorporateNewsTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const hasImage = Boolean(scene.imageUrl);
  const leftW = hasImage ? 1000 : 1500;
  const dateLine = (scene.tickerText || scene.subheadline || "").trim();
  const desc = (scene.description || "").trim();
  // the subheadline is the date line here, so the header draws only the eyebrow and headline
  const headScene = { ...scene, subheadline: undefined };

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", gap: 56 }}>
      <div style={{ flex: "none", width: leftW, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <Head scene={headScene} d={d} k={k} width={leftW} max={hasImage ? 84 : 100} min={44} />
        {desc ? (
          <A d={d} i={3} cls="sg-fade-up" tag="p" style={{ margin: 0, maxWidth: leftW - 20, fontSize: 34, fontWeight: 600, lineHeight: 1.34, color: k.muted }}>
            {desc}
          </A>
        ) : null}
        {dateLine ? (
          <A d={d} i={4} cls="sg-fade-up" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ display: "block", width: 22, height: 22, borderRadius: 99, background: k.accent, flex: "none" }} />
            <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "0.04em", textTransform: "uppercase", color: k.text }}>{dateLine}</span>
          </A>
        ) : null}
        {scene.ctaText ? (
          <div style={{ marginTop: 6 }}>
            <CtaBar scene={scene} d={d} k={k} i={6} width={leftW} />
          </div>
        ) : null}
      </div>

      {hasImage ? (
        <A d={d} i={2} cls="sg-scale-in" style={{ flex: "1 1 0", minWidth: 0 }}>
          <Frame src={scene.imageUrl} alt="" w="100%" h="100%" k={k} radius={34} fit="cover" />
        </A>
      ) : null}
    </div>
  );
}
