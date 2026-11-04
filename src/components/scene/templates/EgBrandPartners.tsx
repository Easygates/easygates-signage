import type { TemplateProps } from "../parts";
import { BOTTOM, CtaBar, Head, MARGIN, TOP, fitPx } from "./brandParts";
import { alpha, kit, rows, type Kit } from "./brandKit";

/**
 * Template "eg-brand-partners" — EasyGates Direct · Brands We Stock.
 *
 * A typographic manufacturer wall: the brands held on the shelf, set large in
 * three alternating inks so the wall has rhythm without logos. The category sits
 * underneath each name. Ten across two rows, or five in one.
 *
 * FIELDS:
 * - eyebrow     = small label, e.g. "EASYGATES DIRECT · BRANDS"
 * - headline    = the wall title, e.g. "THE MAKES WE HOLD"
 * - subheadline = one line under the headline
 * - ctaText     = button bottom-right, e.g. "ASK FOR A TRADE PRICE"
 * - items[]     = the manufacturers, up to ten:
 *   - name = the brand, e.g. "CAME"
 *   - desc = what we stock of theirs, e.g. "Gate operators & control panels"
 * Not used: imageUrl, productName, description, prices, highlightColor.
 */

const COLS = 5;

function BrandTile({ k, i, name, desc, w, h }: { k: Kit; i: number; name: string; desc?: string; w: number; h: number | string }) {
  // three-in-a-row rhythm: body text, accent, second accent
  const tone = i % 3 === 0 ? k.text : i % 3 === 1 ? k.accent : k.accent2;
  const namePx = fitPx(name, w - 44, 56, 26, 2, 0.02);
  return (
    <div
      className="sg-anim sg-fade-up"
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 10,
        padding: "22px 20px",
        borderRadius: 16,
        background: alpha(k.text, k.dark ? 0.04 : 0.03),
        border: `1px solid ${k.line}`,
        overflow: "hidden",
        animationDelay: `${150 + i * 60}ms`,
      }}
    >
      <span style={{ display: "block", width: 44, height: 6, borderRadius: 99, background: tone, flex: "none" }} />
      <span style={{ flex: "1 1 auto", display: "flex", alignItems: "center", minHeight: 0 }}>
        <span style={{ display: "block", fontSize: namePx, fontWeight: 900, lineHeight: 1.02, letterSpacing: "0.02em", textTransform: "uppercase", color: tone, overflowWrap: "anywhere" }}>{name}</span>
      </span>
      {desc ? <span style={{ display: "block", fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: k.muted, overflowWrap: "anywhere" }}>{desc}</span> : null}
    </div>
  );
}

export default function EgBrandPartnersTemplate({ scene, d }: TemplateProps) {
  const k = kit(scene);
  const items = rows(scene, 10);
  const totalW = 1920 - MARGIN * 2;
  const gap = 16;
  const w = Math.floor((totalW - gap * (COLS - 1)) / COLS);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: TOP, bottom: BOTTOM, padding: `0 ${MARGIN}px`, display: "flex", flexDirection: "column", gap: 20 }}>
      <Head scene={scene} d={d} k={k} width={totalW} max={78} min={34} />

      <div style={{ flex: "1 1 0", minHeight: 0, display: "flex", flexWrap: "wrap", gap, alignContent: "stretch" }}>
        {items.length ? (
          items.map((it, i) => (
            <BrandTile key={i} k={k} i={i} name={it.name} desc={it.desc} w={w} h={items.length > COLS ? "calc(50% - 8px)" : "100%"} />
          ))
        ) : (
          <span style={{ fontSize: 28, color: k.muted }}>Add the manufacturers in the editor — one row per brand.</span>
        )}
      </div>

      <div style={{ flex: "none", display: "flex", justifyContent: "flex-end" }}>
        <CtaBar scene={scene} d={d} k={k} i={4 + items.length} width={620} />
      </div>
    </div>
  );
}
