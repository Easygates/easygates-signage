/* eslint-disable @next/next/no-img-element -- brand logos come from user uploads, storage or /public; next/image allowlist can't cover them */
import type { TemplateProps } from "../parts";
import { BOTTOM, BrandIcon, CtaBar, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "ss-works-with" — Smart & Secure · Works With…
 *
 * A wall of compatible brands and ecosystems: soft rounded pills (or logo
 * pictures when a row has one) tiled across the screen, with the count as a
 * quiet statistic. The "everything talks to everything" board.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "SMART & SECURE · WORKS WITH"
 * - headline    = the board title, e.g. "YOUR HOME. ONE APP."
 * - subheadline = one line under the headline
 * - ctaText     = button bottom-right, e.g. "BRING YOUR OWN DEVICE IN"
 * - items[]     = the brands and ecosystems, up to twelve:
 *   - name  = the brand, e.g. "Philips Hue"
 *   - tag   = optional category, e.g. "LIGHTING"
 *   - image = optional logo, shown instead of the word when present
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

const GAP = 16;
const PILL_H = 116;

function Pill({ k, d, i, item, w }: { k: Kit; d: TemplateProps["d"]; i: number; item: { name: string; tag?: string; image?: string }; w: number }) {
  const namePx = fitPx(item.name, w - 36, 38, 20);
  return (
    <div
      className="sg-anim sg-pop"
      style={{
        flex: "none",
        width: w,
        height: PILL_H,
        borderRadius: 999,
        background: alpha(k.text, k.dark ? 0.07 : 0.04),
        border: `1px solid ${k.line}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 22px",
        overflow: "hidden",
        animationDelay: `${150 + d.s * (1 + i * 0.6)}ms`,
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} draggable={false} style={{ maxHeight: "72%", maxWidth: "82%", objectFit: "contain", display: "block" }} />
      ) : (
        <span style={{ textAlign: "center" }}>
          <span style={{ display: "block", fontSize: namePx, fontWeight: 900, letterSpacing: "-0.01em", color: k.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </span>
          {item.tag ? (
            <span style={{ display: "block", marginTop: 3, fontSize: 17, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: k.accent }}>
              {item.tag}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

export default function SsWorksWithTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 12);
  const totalW = 1920 - MARGIN * 2;
  // four across reads best at 1920 wide; five when there are enough to fill two rows
  const perRow = items.length > 8 ? 5 : 4;
  const w = Math.floor((totalW - GAP * (perRow - 1)) / perRow);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 26 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={84} min={36} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {items.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: GAP, justifyContent: "center", alignContent: "center" }}>
            {items.map((it, i) => (
              <Pill key={i} k={k} d={d} i={i} item={it} w={w} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, fontSize: 28, color: k.muted }}>
            <BrandIcon id="wifi" size={36} color={k.muted} />
            Add the brands and ecosystems in the editor — one row per logo.
          </div>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 24 }}>
        {items.length ? (
          <span className="sg-anim sg-fade-up" style={{ flex: "1 1 auto", display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 800, color: k.muted, animationDelay: `${150 + d.s * 8}ms` }}>
            <BrandIcon id="check" size={30} color={k.accent} stroke={3} />
            {items.length} brands, all working together — and all set up for you.
          </span>
        ) : (
          <span style={{ flex: "1 1 auto" }} />
        )}
        <CtaBar scene={scene} d={d} k={k} i={9} width={700} />
      </div>
    </div>
  );
}
